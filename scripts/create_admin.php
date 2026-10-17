<?php
/** NOVA Home — development admin creator (Phase 5). CLI ONLY.
 *
 * Usage:
 *   php scripts/create_admin.php "Full Name" "admin@example.com"
 *   Password is read from STDIN (piped or interactive prompt) so it never
 *   appears in argv/shell history:
 *     php scripts/create_admin.php "Full Name" "admin@example.com" < pw.txt
 *
 * Hard safety rails (Step 29):
 *   - Refuses to run outside the PHP CLI (web requests get a bare 404).
 *   - Never prints or stores plaintext passwords; hash via password_hash().
 *   - Refuses duplicate emails.
 *   - No account is ever created automatically by any web request.
 * Remove this file before deployment if your policy requires it.
 */
declare(strict_types=1);
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
require_once __DIR__ . '/../includes/bootstrap.php';

$name = trim((string) ($argv[1] ?? ''));
$email = strtolower(trim((string) ($argv[2] ?? '')));
if ($name === '' || !v_email($email)) {
    fwrite(STDERR, "Usage: php scripts/create_admin.php \"Full Name\" \"admin@example.com\"  (password piped via STDIN)\n");
    exit(1);
}
// Password from STDIN: interactive prompt when a TTY, plain read otherwise.
if (function_exists('stream_isatty') && stream_isatty(STDIN)) {
    fwrite(STDERR, 'Password (min 8 chars): ');
    $password = rtrim((string) fgets(STDIN));
} else {
    $password = rtrim((string) stream_get_contents(STDIN));
}
if (strlen($password) < 8) {
    fwrite(STDERR, "Error: password must be at least 8 characters.\n");
    exit(1);
}
try {
    $pdo = nova_pdo();
    $check = $pdo->prepare('SELECT `id` FROM `admin_users` WHERE `email` = :email LIMIT 1');
    $check->execute([':email' => $email]);
    if ($check->fetch()) {
        fwrite(STDERR, "Error: an admin with that email already exists.\n");
        exit(1);
    }
    $ins = $pdo->prepare(
        'INSERT INTO `admin_users` (`name`, `email`, `password_hash`, `active`) VALUES (:name, :email, :hash, 1)'
    );
    $ins->execute([
        ':name' => $name,
        ':email' => $email,
        ':hash' => password_hash($password, PASSWORD_DEFAULT),
    ]);
    fwrite(STDOUT, "Admin created: {$email} (id " . $pdo->lastInsertId() . ", active=1)\n");
    exit(0);
} catch (Throwable $e) {
    error_log('[NOVA create_admin] ' . $e->getMessage());
    fwrite(STDERR, "Error: could not create the admin account.\n");
    exit(1);
}
