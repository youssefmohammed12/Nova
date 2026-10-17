<?php
/**
 * NOVA Home — api/demo-admin-login.php
 * Development-only one-click admin sign-in.
 *
 * Guards (ALL must pass):
 *   1. NOVA_ENV === 'development'
 *   2. config demo_access === true
 *   3. POST method
 *   4. Valid CSRF token
 *   5. At least one active admin account exists
 *
 * Authenticates as the first active admin_users row (the development admin).
 * Uses nova_admin_login() — same session_regenerate_id(true) + session
 * fields as the normal password-based login.
 *
 * No admin password is hardcoded, transmitted, or bypassed. The password-based
 * login path, throttling, and require_admin() guard remain unchanged.
 */

declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once NOVA_ROOT . '/includes/admin-auth.php';

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

// ── Gate 4: find the first active admin ─────────────────────────────────
$stmt = nova_pdo()->query(
    'SELECT id, name FROM admin_users WHERE active = 1 ORDER BY id ASC LIMIT 1'
);
$row = $stmt->fetch();

if (!$row) {
    json_response(['success' => false, 'error' => 'No active admin account found.'], 400);
}

// ── Establish session (same as normal login) ────────────────────────────
nova_admin_login(['id' => (int) $row['id'], 'name' => (string) $row['name']]);

json_response([
    'success' => true,
    'data'    => [
        'name'     => (string) $row['name'],
        'redirect' => '../admin/index.php',
    ],
]);
