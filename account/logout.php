<?php
/**
 * NOVA Home — account/logout.php. Real server-side customer logout.
 * POST + CSRF only: clears customer session fields and session ID
 * and redirects to the public storefront (../index.html).
 * Preserves admin state and latest-order references.
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once NOVA_ROOT . '/includes/customer-auth.php';

if (!is_post()) {
    nova_customer_logout();
    header('Location: ../index.html', true, 302);
    exit;
}

$raw = file_get_contents('php://input');
$body = json_decode($raw === false ? '' : $raw, true);
$token = is_array($body) ? ($body['csrf_token'] ?? null) : ($_POST['csrf_token'] ?? null);

if (!nova_verify_csrf(is_string($token) ? $token : null)) {
    if (isset($_SERVER['HTTP_ACCEPT']) && str_contains($_SERVER['HTTP_ACCEPT'], 'application/json')) {
        json_response(['success' => false, 'error' => 'Session expired. Please refresh and try again.'], 400);
    }
    header('Location: ../index.html', true, 302);
    exit;
}

nova_customer_logout();

if (isset($_SERVER['HTTP_ACCEPT']) && str_contains($_SERVER['HTTP_ACCEPT'], 'application/json')) {
    json_response(['success' => true, 'data' => ['redirect' => '../index.html']]);
}

header('Location: ../index.html', true, 302);
exit;
