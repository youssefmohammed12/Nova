<?php
/** NOVA Home — POST /api/admin-login.php (Phase 5). Admin authentication.
 * JSON: {email, password, csrf_token}. Generic failure message only
 * ("Invalid email or password.") — never reveals account existence.
 * On success: regenerates session id, stores admin_id/admin_name, returns
 * {success, data:{name, redirect}}. Non-POST → 405. Per-session throttle
 * (5 failures / 60s) → 429. No password ever logged or echoed.
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once NOVA_ROOT . '/includes/admin-auth.php';
if (!is_post()) {
    json_response(['success' => false, 'error' => 'Method not allowed.'], 405);
}
try {
    $raw = file_get_contents('php://input');
    $body = json_decode($raw === false ? '' : $raw, true);
    if (!is_array($body)) {
        json_response(['success' => false, 'error' => 'Invalid request.'], 400);
    }
    if (!nova_verify_csrf($body['csrf_token'] ?? null)) {
        json_response(['success' => false, 'error' => 'Session expired. Please refresh and try again.'], 400);
    }
    $wait = nova_admin_lockout_remaining();
    if ($wait > 0) {
        json_response(['success' => false, 'error' => 'Too many attempts. Please wait a moment and try again.'], 429);
    }
    $email = strtolower(trim((string) ($body['email'] ?? '')));
    $password = (string) ($body['password'] ?? '');
    if (!v_email($email) || strlen($password) < 6) {
        // Same generic failure as bad credentials — no field-level hints.
        nova_admin_login_failed();
        json_response(['success' => false, 'error' => 'Invalid email or password.'], 401);
    }
    $stmt = nova_pdo()->prepare(
        'SELECT `id`, `name`, `password_hash`, `active` FROM `admin_users` WHERE `email` = :email LIMIT 1'
    );
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();
    // Dummy verify when no row: equalizes timing so missing emails are not
    // distinguishable from wrong passwords by response time.
    $hash = $user ? (string) $user['password_hash'] : '$2y$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi';
    $ok = password_verify($password, $hash);
    if (!$user || (int) $user['active'] !== 1 || !$ok) {
        nova_admin_login_failed();
        json_response(['success' => false, 'error' => 'Invalid email or password.'], 401);
    }
    nova_admin_login(['id' => (int) $user['id'], 'name' => (string) $user['name']]);
    json_response(['success' => true, 'data' => [
        'name' => (string) $user['name'],
        'redirect' => '../admin/index.php',
    ]]);
} catch (Throwable $e) {
    // Diagnostics only — never include credentials or hashes in the message.
    error_log('[NOVA api/admin-login] ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Unable to sign in right now.'], 500);
}
