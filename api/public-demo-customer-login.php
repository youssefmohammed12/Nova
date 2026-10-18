<?php
/**
 * NOVA Home — api/public-demo-customer-login.php
 * PUBLIC one-click demo customer sign-in for the hosted portfolio demo.
 *
 * This is a SEPARATE switch from the development-only demo endpoints:
 *   - api/demo-customer-login.php  → dev only (env === 'development' AND demo_access)
 *   - this endpoint                → public_demo_access === true (works with env=production)
 *
 * Guards (ALL must pass):
 *   1. config public_demo_access === true (independent of env/debug)
 *   2. POST method
 *   3. Valid CSRF token
 *   4. The DESIGNATED demo customer exists and is active
 *
 * The identity is fixed to demo.customer@novahome.eg — no customer id, email,
 * or role can be supplied by the client. Establishes a real customer session
 * via nova_customer_login() (same session_regenerate_id(true) + session fields
 * as normal authentication). Order ownership checks are unaffected.
 */

declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once NOVA_ROOT . '/includes/customer-auth.php';

// ── Gate 1: explicit public-demo configuration ────────────────────────────
if (nova_config('public_demo_access', false) !== true) {
    json_response(['success' => false, 'error' => 'Not available.'], 403);
}

// ── Gate 2: method ────────────────────────────────────────────────────────
if (!is_post()) {
    http_response_code(405);
    header('Allow: POST');
    exit;
}

// ── Gate 3: CSRF ──────────────────────────────────────────────────────────
$body = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];
if (!nova_verify_csrf($body['csrf_token'] ?? null)) {
    json_response(['success' => false, 'error' => 'Invalid request.'], 400);
}

// ── Gate 4: designated demo customer must exist and be active ─────────────
$demoEmail = 'demo.customer@novahome.eg';
$stmt = nova_pdo()->prepare(
    'SELECT id, name, active FROM customers WHERE email = :e LIMIT 1'
);
$stmt->execute([':e' => $demoEmail]);
$row = $stmt->fetch();

if (!$row || (int) $row['active'] !== 1) {
    json_response(['success' => false, 'error' => 'Demo account is not available. Import database/demo-data.infinityfree.sql first.'], 400);
}

// ── Establish session (same as normal login) ──────────────────────────────
nova_customer_login(['id' => (int) $row['id'], 'name' => (string) $row['name']]);

// Return the established demo wishlist for the client's localStorage
// (`nova_wish`). Product ids are slug strings since the Phase 2 catalogue
// migration — numeric legacy ids no longer resolve in NOVA.find().
json_response([
    'success' => true,
    'data'    => [
        'name'     => (string) $row['name'],
        'redirect' => '../account/index.php',
        'wishlist' => ['luna-floor-lamp', 'halo-mirror', 'oasis-pendant', 'aswan-side-table'],
    ],
]);
