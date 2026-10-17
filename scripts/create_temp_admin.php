<?php
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
$pdo = nova_pdo();
$pdo->exec("DELETE FROM admin_users WHERE email = 'audit_admin@novahome.eg'");
$ins = $pdo->prepare("INSERT INTO admin_users (name, email, password_hash, active) VALUES ('Audit Admin', 'audit_admin@novahome.eg', :h, 1)");
$ins->execute([':h' => password_hash('TempAuditAdminPass123!', PASSWORD_DEFAULT)]);
echo "Created audit_admin@novahome.eg\n";
