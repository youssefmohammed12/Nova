<?php
declare(strict_types=1);
/**
 * NOVA Home — admin authentication & authorization (Backend Phase 5).
 * Single gateway for every protected admin page/API. Uses the existing
 * nova_session() infrastructure only — no second session system.
 *
 * Session fields owned by this module (and nothing else):
 *   $_SESSION['admin_id']   int    admin_users.id
 *   $_SESSION['admin_name'] string display name for the sidebar
 *   $_SESSION['admin_login_attempts'] int   per-session brute-force counter
 * No password/hash/profile data is ever stored in the session.
 */

/** Per-session login attempt policy (dev-safe mitigation, not distributed). */
const NOVA_ADMIN_MAX_ATTEMPTS = 5;
const NOVA_ADMIN_LOCKOUT_SECONDS = 60;

/**
 * Resolve the currently authenticated admin from the session, re-checking
 * the database so deactivating/disabling an account takes effect immediately.
 * Returns ['id'=>int,'name'=>string] or null. Never throws for missing rows.
 */
function nova_admin_user(): ?array
{
    nova_session();
    $id = $_SESSION['admin_id'] ?? null;
    if (!is_int($id) || $id < 1) {
        return null;
    }
    try {
        $stmt = nova_pdo()->prepare(
            'SELECT `id`, `name`, `active` FROM `admin_users` WHERE `id` = :id LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
    } catch (Throwable $e) {
        error_log('[NOVA admin-auth] ' . $e->getMessage());
        return null;
    }
    if (!$row || (int) $row['active'] !== 1) {
        // Account gone or deactivated: drop the stale identity immediately.
        unset($_SESSION['admin_id'], $_SESSION['admin_name']);
        return null;
    }
    $_SESSION['admin_name'] = (string) $row['name'];
    return ['id' => (int) $row['id'], 'name' => (string) $row['name']];
}

/**
 * Establish an authenticated admin session after password verification.
 * Regenerates the session ID (fixation protection) BEFORE storing identity.
 */
function nova_admin_login(array $user): void
{
    nova_session();
    session_regenerate_id(true);
    $_SESSION['admin_id'] = (int) $user['id'];
    $_SESSION['admin_name'] = (string) $user['name'];
    unset($_SESSION['admin_login_attempts']);
}

/**
 * Terminate admin authentication server-side: clear identity + attempts,
 * regenerate the session ID so the old cookie value is void, then wipe data.
 */
function nova_admin_logout(): void
{
    nova_session();
    unset($_SESSION['admin_id'], $_SESSION['admin_name'], $_SESSION['admin_login_attempts'], $_SESSION['admin_login_last']);
    session_regenerate_id(true);
}

/**
 * Single authorization gateway for protected admin resources.
 * $api = true  → JSON 401 (for future admin endpoints)
 * $api = false → 302 redirect to admin/login.php (for pages)
 */
function require_admin(bool $api = false): void
{
    if (nova_admin_user() === null) {
        if ($api) {
            json_response(['success' => false, 'error' => 'Authentication required.'], 401);
        }
        header('Location: login.php', true, 302);
        exit;
    }
}

/** Simple per-session login throttle. Returns seconds to wait (0 = allowed). */
function nova_admin_lockout_remaining(): int
{
    nova_session();
    $attempts = (int) ($_SESSION['admin_login_attempts'] ?? 0);
    $last = (int) ($_SESSION['admin_login_last'] ?? 0);
    if ($attempts < NOVA_ADMIN_MAX_ATTEMPTS) {
        return 0;
    }
    $elapsed = time() - $last;
    if ($elapsed >= NOVA_ADMIN_LOCKOUT_SECONDS) {
        // Window expired: give a fresh allowance.
        unset($_SESSION['admin_login_attempts'], $_SESSION['admin_login_last']);
        return 0;
    }
    return NOVA_ADMIN_LOCKOUT_SECONDS - $elapsed;
}

/** Record one failed login attempt (per session). */
function nova_admin_login_failed(): void
{
    nova_session();
    $_SESSION['admin_login_attempts'] = (int) ($_SESSION['admin_login_attempts'] ?? 0) + 1;
    $_SESSION['admin_login_last'] = time();
}
