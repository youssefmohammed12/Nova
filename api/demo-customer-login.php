<?php
/**
 * NOVA Home — api/demo-customer-login.php
 * Development-only one-click demo customer sign-in.
 *
 * Guards (ALL must pass):
 *   1. NOVA_ENV === 'development'
 *   2. config demo_access === true
 *   3. POST method
 *   4. Valid CSRF token
 *   5. Demo customer exists and is active
 *
 * Establishes a real customer session via nova_customer_login() — same
 * session_regenerate_id(true) + session fields as normal authentication.
 */

declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once NOVA_ROOT . '/includes/customer-auth.php';

// ── Gate 1: environment ─────────────────────────────────────────────────
if (NOVA_ENV !== 'development' || !nova_config('demo_access', false)) {
    json_response(['success' => false, 'error' => 'Not available.'], 403);
}

// ── Gate 2: method ──────────────────────────────────────────────────────
if (!is_post()) {
    http_response_code(405);
    header('Allow: POST');
    exit;
}

// ── Gate 3: CSRF ────────────────────────────────────────────────────────
$body = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];
if (!nova_verify_csrf($body['csrf_token'] ?? null)) {
    json_response(['success' => false, 'error' => 'Invalid request.'], 400);
}

// ── Gate 4: demo customer must exist and be active ──────────────────────
$demoEmail = 'demo.customer@novahome.eg';
$stmt = nova_pdo()->prepare(
    'SELECT id, name, active FROM customers WHERE email = :e LIMIT 1'
);
$stmt->execute([':e' => $demoEmail]);
$row = $stmt->fetch();

if (!$row || (int) $row['active'] !== 1) {
    json_response(['success' => false, 'error' => 'Demo account is not available. Run the seed script first.'], 400);
}

// ── Establish session (same as normal login) ────────────────────────────
nova_customer_login(['id' => (int) $row['id'], 'name' => (string) $row['name']]);

// Return wishlist product IDs for the client to populate localStorage.
// Product ids are slug strings since the Phase 2 catalogue migration —
// numeric legacy ids no longer resolve in NOVA.find().
json_response([
    'success' => true,
    'data'    => [
        'name'     => (string) $row['name'],
        'redirect' => '../account/index.php',
        'wishlist' => ['luna-floor-lamp', 'halo-mirror', 'oasis-pendant', 'aswan-side-table'],
    ],
]);
