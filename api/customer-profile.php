<?php
/** NOVA Home - /api/customer-profile.php (Phase 9).
 * GET  -> own profile {name, email, phone} (email read-only this phase).
 * POST -> update name + phone for the SESSION customer only. Any submitted
 *         customer id field is ignored — ownership comes from the session.
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once NOVA_ROOT . '/includes/customer-auth.php';
require_customer(true);
$me = nova_customer_user();
if ($me === null) {
    json_response(['success' => false, 'error' => 'Authentication required.'], 401);
}
try {
    if (is_post()) {
        if (!nova_verify_csrf($_POST['csrf_token'] ?? null)) {
            json_response(['success' => false, 'error' => 'Session expired. Please refresh and try again.'], 400);
        }
        $name = v_text($_POST['name'] ?? '', 120);
        $phone = trim((string) ($_POST['phone'] ?? ''));
        if ($name === '') {
            json_response(['success' => false, 'error' => 'Please enter your full name.'], 400);
        }
        if (!v_phone_eg($phone)) {
            json_response(['success' => false, 'error' => 'Enter a valid phone number.'], 400);
        }
        // Ownership: WHERE id = session customer. Never trusts request data.
        $upd = nova_pdo()->prepare('UPDATE `customers` SET `name` = :name, `phone` = :phone WHERE `id` = :id');
        $upd->execute([':name' => $name, ':phone' => $phone, ':id' => $me['id']]);
        $_SESSION['nova_customer_name'] = $name;
        json_response(['success' => true, 'data' => ['name' => $name, 'phone' => $phone]]);
    }
    if (strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        json_response(['success' => false, 'error' => 'Method not allowed.'], 405);
    }
    json_response(['success' => true, 'data' => ['name' => $me['name'], 'email' => $me['email'], 'phone' => $me['phone']]]);
} catch (Throwable $e) {
    error_log('[NOVA api/customer-profile] ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Unable to update your profile right now.'], 500);
}
