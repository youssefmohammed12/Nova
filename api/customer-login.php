<?php
/** NOVA Home - POST /api/customer-login.php (Phase 9). Customer sign-in.
 * JSON: {email, password, csrf_token}. Generic 401 for unknown email, wrong
 * password and inactive accounts (dummy verify equalizes timing). Per-session
 * throttle: 5 failures / 60s -> 429. Session regenerated on success.
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once NOVA_ROOT . '/includes/customer-auth.php';
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
    $wait = nova_customer_lockout_remaining();
    if ($wait > 0) {
        json_response(['success' => false, 'error' => 'Too many attempts. Please wait a moment and try again.'], 429);
    }
    $email = strtolower(trim((string) ($body['email'] ?? '')));
    $password = (string) ($body['password'] ?? '');
    if (!v_email($email) || strlen($password) < 6) {
        nova_customer_login_failed();
        json_response(['success' => false, 'error' => 'Invalid email or password.'], 401);
    }
    $stmt = nova_pdo()->prepare(
        'SELECT `id`, `name`, `password_hash`, `active` FROM `customers` WHERE `email` = :email LIMIT 1'
    );
    $stmt->execute([':email' => $email]);
    $row = $stmt->fetch();
    $hash = $row ? (string) $row['password_hash'] : '$2y$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi';
    $ok = password_verify($password, $hash);
    if (!$row || (int) $row['active'] !== 1 || !$ok) {
        nova_customer_login_failed();
        json_response(['success' => false, 'error' => 'Invalid email or password.'], 401);
    }
    nova_customer_login(['id' => (int) $row['id'], 'name' => (string) $row['name']]);
    json_response(['success' => true, 'data' => ['name' => (string) $row['name'], 'redirect' => '../account/index.php']]);
} catch (Throwable $e) {
    error_log('[NOVA api/customer-login] ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Unable to sign in right now.'], 500);
}
