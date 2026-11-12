<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$password = (string) (getenv('NOVA_TEST_ADMIN_PASSWORD') ?: '');
if (strlen($password) < 16) {
    fwrite(STDERR, "Set NOVA_TEST_ADMIN_PASSWORD to a random value of at least 16 characters.\n");
    exit(2);
}

require_once __DIR__ . '/../includes/bootstrap.php';
$pdo = nova_pdo();

$delete = $pdo->prepare(
    "DELETE FROM admin_users WHERE email = :email AND name = 'Audit Admin'"
);
$delete->execute([':email' => 'audit_admin@novahome.eg']);

$insert = $pdo->prepare(
    'INSERT INTO admin_users (name, email, password_hash, active) VALUES (:name, :email, :hash, 1)'
);
$insert->execute([
    ':name' => 'Audit Admin',
    ':email' => 'audit_admin@novahome.eg',
    ':hash' => password_hash($password, PASSWORD_DEFAULT),
]);

echo "Created temporary audit administrator.\n";
