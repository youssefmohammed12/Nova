<?php
/** NOVA Home - customer authentication & authorization (Backend Phase 9).
 * Fully separate from admin auth: distinct session fields, separate throttle
 * counters. Uses the existing nova_session() infrastructure only.
 *
 * Session fields owned by this module:
 *   $_SESSION['nova_customer_id']    int    customers.id
 *   $_SESSION['nova_customer_name']  string display name
 *   $_SESSION['cust_login_attempts'] int    brute-force counter
 *   $_SESSION['cust_login_last']     int    last failure timestamp
 * Never stores password/hash/address data in the session. Logging out clears
 * ONLY these fields (nova_order_ref and admin state are preserved).
 */

/** Per-session customer login throttle (dev-safe, not distributed). */
const NOVA_CUST_MAX_ATTEMPTS = 5;
const NOVA_CUST_LOCKOUT_SECONDS = 60;

/**
 * Resolve the authenticated customer from the session, re-checking MySQL so
 * disabled/removed accounts lose access immediately. Returns
 * ['id'=>int,'name'=>string,'phone'=>string,'email'=>string] or null.
 */
function nova_customer_user(): ?array
{
    nova_session();
    $id = $_SESSION['nova_customer_id'] ?? null;
    if (!is_int($id) || $id < 1) {
        return null;
    }
    try {
        $stmt = nova_pdo()->prepare(
            'SELECT `id`, `name`, `email`, `phone`, `active` FROM `customers` WHERE `id` = :id LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
    } catch (Throwable $e) {
        error_log('[NOVA customer-auth] ' . $e->getMessage());
        return null;
    }
    if (!$row || (int) $row['active'] !== 1) {
        unset($_SESSION['nova_customer_id'], $_SESSION['nova_customer_name']);
        return null;
    }
    $_SESSION['nova_customer_name'] = (string) $row['name'];
    return ['id' => (int) $row['id'], 'name' => (string) $row['name'],
        'email' => (string) $row['email'], 'phone' => (string) $row['phone']];
}

/** Establish a customer session after registration/verification.
 *  Regenerates the session ID (fixation protection) before storing identity. */
function nova_customer_login(array $customer): void
{
    nova_session();
    session_regenerate_id(true);
    $_SESSION['nova_customer_id'] = (int) $customer['id'];
    $_SESSION['nova_customer_name'] = (string) $customer['name'];
    unset($_SESSION['cust_login_attempts'], $_SESSION['cust_login_last']);
}

/** Clear ONLY customer authentication state. Unlike admin logout we do NOT
 *  destroy the whole session: nova_order_ref (order-success authorization)
 *  and any admin state must survive a customer logout. */
function nova_customer_logout(): void
{
    nova_session();
    unset($_SESSION['nova_customer_id'], $_SESSION['nova_customer_name'],
        $_SESSION['cust_login_attempts'], $_SESSION['cust_login_last']);
    // New session ID so the pre-logout cookie value cannot be replayed.
    session_regenerate_id(true);
}

/** Authorization gateway for customer pages/APIs. Page mode: 302 to the
 *  account login. API mode: 401 JSON. Never treated as admin authorization. */
function require_customer(bool $api = false): void
{
    if (nova_customer_user() === null) {
        if ($api) {
            json_response(['success' => false, 'error' => 'Authentication required.'], 401);
        }
        header('Location: login.php', true, 302);
        exit;
    }
}

/** Seconds until a throttled customer may retry (0 = allowed now). */
function nova_customer_lockout_remaining(): int
{
    nova_session();
    $attempts = (int) ($_SESSION['cust_login_attempts'] ?? 0);
    $last = (int) ($_SESSION['cust_login_last'] ?? 0);
    if ($attempts < NOVA_CUST_MAX_ATTEMPTS) {
        return 0;
    }
    $elapsed = time() - $last;
    if ($elapsed >= NOVA_CUST_LOCKOUT_SECONDS) {
        unset($_SESSION['cust_login_attempts'], $_SESSION['cust_login_last']);
        return 0;
    }
    return NOVA_CUST_LOCKOUT_SECONDS - $elapsed;
}

/** Record one failed customer login attempt (per session). */
function nova_customer_login_failed(): void
{
    nova_session();
    $_SESSION['cust_login_attempts'] = (int) ($_SESSION['cust_login_attempts'] ?? 0) + 1;
    $_SESSION['cust_login_last'] = time();
}
