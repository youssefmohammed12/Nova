<?php
/** NOVA Home — admin/logout.php (Phase 5). Real server-side logout.
 * POST + CSRF only (GET → 405): invalidates the admin session
 * (identity cleared, session id regenerated, session destroyed) and
 * redirects to admin/login.php. JavaScript logout is never sufficient —
 * the server session is what actually terminates.
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once NOVA_ROOT . '/includes/admin-auth.php';
if (!is_post()) {
    nova_admin_logout();
    header('Location: login.php', true, 302);
    exit;
}
$raw = file_get_contents('php://input');
$body = json_decode($raw === false ? '' : $raw, true);
$token = is_array($body) ? ($body['csrf_token'] ?? null) : ($_POST['csrf_token'] ?? null);
if (!nova_verify_csrf(is_string($token) ? $token : null)) {
    if (!empty($_SERVER['HTTP_ACCEPT']) && str_contains($_SERVER['HTTP_ACCEPT'], 'application/json')) {
        json_response(['success' => false, 'error' => 'Session expired. Please refresh and try again.'], 400);
    }
    header('Location: login.php', true, 302);
    exit;
}
nova_admin_logout();
if (!empty($_SERVER['HTTP_ACCEPT']) && str_contains($_SERVER['HTTP_ACCEPT'], 'application/json')) {
    json_response(['success' => true, 'data' => ['redirect' => 'login.php']]);
}
header('Location: login.php', true, 302);
exit;
