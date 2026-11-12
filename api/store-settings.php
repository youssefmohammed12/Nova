<?php
/** NOVA Home — GET /api/store-settings.php (Phase 8). Public, read-only
 * business settings for the storefront. Allowlist: public business fields,
 * delivery pricing, and the controlled delivery-city map — never arbitrary
 * settings rows or HTML/strings of money.
 * Non-GET → 405. no-store so admin edits appear on the next page load.
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
if (!isset($_SERVER['REQUEST_METHOD']) || strtoupper($_SERVER['REQUEST_METHOD']) !== 'GET') {
    json_response(['success' => false, 'error' => 'Method not allowed.'], 405);
}
try {
    // Mandatory allowlist — only public business fields leave this endpoint.
    $stringKeys = ['business_name', 'phone', 'email', 'address'];
    $data = [];
    foreach ($stringKeys as $key) {
        $data[$key] = (string) nova_setting($key, '');
    }
    // Financial values as integers — the client formats currency itself.
    $data['delivery_fee'] = (int) nova_setting('delivery_fee', 60);
    $data['free_delivery_threshold'] = (int) nova_setting('free_delivery_threshold', 1500);
    // Share the controlled city keys/labels with every storefront selector.
    $data['delivery_cities'] = nova_cities();

    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    json_response(['success' => true, 'data' => $data]);
} catch (Throwable $e) {
    error_log('[NOVA api/store-settings] ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Unable to load settings.'], 500);
}
