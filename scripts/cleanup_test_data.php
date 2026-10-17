<?php
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
$pdo = nova_pdo();

// Delete ONLY test orders created during tests
$stmt = $pdo->query("SELECT id, order_ref FROM orders WHERE customer_name IN ('Guest E2E Tester', 'E2E Account Customer', 'Audit Customer A', 'Audit Customer B') OR email LIKE '%e2e%'");
$orders = $stmt->fetchAll();
foreach ($orders as $o) {
    $pdo->exec("DELETE FROM order_items WHERE order_id = " . (int)$o['id']);
    $pdo->exec("DELETE FROM orders WHERE id = " . (int)$o['id']);
    echo "Cleaned test order: {$o['order_ref']} (ID {$o['id']})\n";
}

// Delete ONLY test addresses
$pdo->exec("DELETE FROM customer_addresses WHERE recipient_name IN ('E2E Recipient', 'Customer A Recipient', 'Customer B Recipient') OR label IN ('Beach House', 'A Home', 'B Home')");

// Delete ONLY test customers
$pdo->exec("DELETE FROM customers WHERE email LIKE '%e2e%' OR email LIKE '%audit%'");

// Delete ONLY test admin
$pdo->exec("DELETE FROM admin_users WHERE email = 'audit_admin@novahome.eg'");

echo "Cleanup completed successfully.\n";
