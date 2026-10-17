<?php
/** NOVA Home - POST /api/customer-logout.php (Phase 9). Clears ONLY customer
 * session fields (nova_order_ref for order-success and any admin state are
 * preserved) and regenerates the session ID. CSRF required.
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
    $token = is_array($body) ? ($body['csrf_token'] ?? null) : ($_POST['csrf_token'] ?? null);
    if (!nova_verify_csrf($token)) {
        json_response(['success' => false, 'error' => 'Session expired. Please refresh and try again.'], 400);
    }
    nova_customer_logout();
    json_response(['success' => true, 'data' => []]);
} catch (Throwable $e) {
    error_log('[NOVA api/customer-logout] ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Unable to sign out right now.'], 500);
}
