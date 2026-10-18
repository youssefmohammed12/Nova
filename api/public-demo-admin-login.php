<?php
/**
 * NOVA Home — api/public-demo-admin-login.php
 * PUBLIC one-click demo administrator sign-in for the hosted portfolio demo.
 *
 * This is a SEPARATE switch from the development-only demo endpoints:
 *   - api/demo-admin-login.php  → dev only (env === 'development' AND demo_access)
 *   - this endpoint              → public_demo_access === true (works with env=production)
 *
 * Guards (ALL must pass):
 *   1. config public_demo_access === true (independent of env/debug)
 *   2. POST method
 *   3. Valid CSRF token
 *   4. The DESIGNATED demo administrator exists and is active
 *
 * The identity is fixed to demo.admin@novahome.eg — NOT "the first admin in
 * the table" and never the owner's personal administrator account. No user id
 * or role can be supplied by the client. Establishes a NORMAL admin session
 * via nova_admin_login() (same session_regenerate_id(true) + session fields
 * as password-based login), so the full administrative functionality applies
 * through the unchanged require_admin() gateway.
 *
 * No admin password is hardcoded, transmitted, or bypassed. The password-based
 * login path, throttling, and authorization guards remain unchanged.
 */

declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once NOVA_ROOT . '/includes/admin-auth.php';

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

// ── Gate 4: designated demo administrator must exist and be active ────────
$demoEmail = 'demo.admin@novahome.eg';
$stmt = nova_pdo()->prepare(
    'SELECT id, name FROM admin_users WHERE email = :e AND active = 1 LIMIT 1'
);
$stmt->execute([':e' => $demoEmail]);
$row = $stmt->fetch();

if (!$row) {
    json_response(['success' => false, 'error' => 'Demo administrator is not available. Import database/demo-data.infinityfree.sql first.'], 400);
}

// ── Establish session (same as normal login) ──────────────────────────────
nova_admin_login(['id' => (int) $row['id'], 'name' => (string) $row['name']]);

json_response([
    'success' => true,
    'data'    => [
        'name'     => (string) $row['name'],
        'redirect' => '../admin/index.php',
    ],
]);
