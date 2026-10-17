<?php
/** NOVA Home — GET /api/csrf.php (Phase 3). Same-origin CSRF token issuer.
 * Starts the secure session and returns the session-bound token as JSON.
 * The static checkout fetches this before POSTing to api/orders.php.
 * Never cached; never accepts POST here.
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
if (!isset($_SERVER['REQUEST_METHOD']) || strtoupper($_SERVER['REQUEST_METHOD']) !== 'GET') {
    json_response(['success' => false, 'error' => 'Method not allowed.'], 405);
}
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
try {
    json_response(['success' => true, 'data' => ['csrf_token' => nova_csrf_token()]]);
} catch (Throwable $e) {
    error_log('[NOVA api/csrf] ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Unable to start session.'], 500);
}
