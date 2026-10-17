<?php
/**
 * NOVA Home - GET /api/customer-auth.php.
 * Lightweight customer session inspector for the shared navbar and account UI.
 * Returns HTTP 200 in both states (no noisy 401s in console).
 * Provides CSRF token so logout/actions can execute safely.
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once NOVA_ROOT . '/includes/customer-auth.php';

if (!isset($_SERVER['REQUEST_METHOD']) || strtoupper($_SERVER['REQUEST_METHOD']) !== 'GET') {
    json_response(['success' => false, 'error' => 'Method not allowed.'], 405);
}

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

try {
    $cust = nova_customer_user();
    if ($cust !== null) {
        json_response([
            'success' => true,
            'data' => [
                'authenticated' => true,
                'customer' => [
                    'id' => $cust['id'],
                    'name' => $cust['name'],
                    'email' => $cust['email'],
                    'phone' => $cust['phone']
                ],
                'csrf_token' => nova_csrf_token()
            ]
        ]);
    } else {
        json_response([
            'success' => true,
            'data' => [
                'authenticated' => false,
                'customer' => null,
                'csrf_token' => nova_csrf_token()
            ]
        ]);
    }
} catch (Throwable $e) {
    error_log('[NOVA api/customer-auth] ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Unable to resolve authentication state.'], 500);
}
