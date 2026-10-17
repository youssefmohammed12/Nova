<?php
/** NOVA Home - POST /api/customer-register.php (Phase 9). Create an account
 * and sign the customer in. JSON: {name, email, phone, password,
 * password_confirm, csrf_token}. Email normalized (trim+lowercase), UNIQUE
 * enforced by the DB (23000 -> safe message, no duplicate accounts), bcrypt
 * via password_hash(). Session regenerated after success. Generic errors only.
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once NOVA_ROOT . '/includes/customer-auth.php';
if (!is_post()) {
    json_response(['success' => false, 'error' => 'Method not allowed.'], 405);
}
try {
    $raw = file_get_contents('php://input');
    $body = json_decode($raw === false ? '' : $raw, true);
    if (!is_array($body)) {
        json_response(['success' => false, 'error' => 'Invalid request.'], 400);
    }
    if (!nova_verify_csrf($body['csrf_token'] ?? null)) {
        json_response(['success' => false, 'error' => 'Session expired. Please refresh and try again.'], 400);
    }
    $name = v_text($body['name'] ?? '', 120);
    $email = strtolower(trim((string) ($body['email'] ?? '')));
    $phone = trim((string) ($body['phone'] ?? ''));
    $password = (string) ($body['password'] ?? '');
    $confirm = (string) ($body['password_confirm'] ?? '');
    if ($name === '') {
        json_response(['success' => false, 'error' => 'Please enter your full name.'], 400);
    }
    if (!v_email($email)) {
        json_response(['success' => false, 'error' => 'Enter a valid email address.'], 400);
    }
    if (!v_phone_eg($phone)) {
        json_response(['success' => false, 'error' => 'Enter a valid phone number.'], 400);
    }
    if (strlen($password) < 8) {
        json_response(['success' => false, 'error' => 'Use a password of at least 8 characters.'], 400);
    }
    if ($password !== $confirm) {
        json_response(['success' => false, 'error' => 'Passwords do not match.'], 400);
    }
    try {
        $ins = nova_pdo()->prepare(
            'INSERT INTO `customers` (`name`, `email`, `password_hash`, `phone`, `active`)'
            . ' VALUES (:name, :email, :hash, :phone, 1)'
        );
        $ins->execute([':name' => $name, ':email' => $email,
            ':hash' => password_hash($password, PASSWORD_DEFAULT), ':phone' => $phone]);
    } catch (PDOException $pe) {
        if ($pe->getCode() === '23000') {
            // Duplicate email: safe predictable message, no account disclosure.
            json_response(['success' => false, 'error' => 'An account with that email already exists. Try signing in instead.'], 409);
        }
        throw $pe;
    }
    $id = (int) nova_pdo()->lastInsertId();
    nova_customer_login(['id' => $id, 'name' => $name]);
    json_response(['success' => true, 'data' => ['name' => $name, 'redirect' => '../account/index.php']]);
} catch (Throwable $e) {
    error_log('[NOVA api/customer-register] ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Unable to create your account right now.'], 500);
}
