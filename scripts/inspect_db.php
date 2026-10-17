<?php
require dirname(__DIR__) . '/includes/bootstrap.php';

$pdo = nova_pdo();
$tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);

echo "TABLES AND ROW COUNTS:\n";
foreach ($tables as $t) {
    $c = $pdo->query("SELECT COUNT(*) FROM `{$t}`")->fetchColumn();
    echo "  {$t}: {$c}\n";
}

echo "\nSETTINGS:\n";
$stmt = $pdo->query("SELECT `key`, `value` FROM `settings` ORDER BY `key`");
while ($r = $stmt->fetch()) {
    echo "  {$r['key']} = {$r['value']}\n";
}

echo "\nADMIN USERS:\n";
$stmt = $pdo->query("SELECT id, name, email, active, created_at FROM `admin_users`");
while ($r = $stmt->fetch()) {
    echo "  ID: {$r['id']}, Name: {$r['name']}, Email: {$r['email']}, Active: {$r['active']}, Created: {$r['created_at']}\n";
}

echo "\nCUSTOMERS:\n";
$stmt = $pdo->query("SELECT id, name, email, active, created_at FROM `customers`");
while ($r = $stmt->fetch()) {
    echo "  ID: {$r['id']}, Name: {$r['name']}, Email: {$r['email']}, Active: {$r['active']}\n";
}

echo "\nCUSTOMER ADDRESSES:\n";
$stmt = $pdo->query("SELECT id, customer_id, recipient_name, city, is_default FROM `customer_addresses`");
while ($r = $stmt->fetch()) {
    echo "  ID: {$r['id']}, CustID: {$r['customer_id']}, Name: {$r['recipient_name']}, City: {$r['city']}, Default: {$r['is_default']}\n";
}

echo "\nORDERS:\n";
$stmt = $pdo->query("SELECT id, order_ref, customer_id, customer_name, total, delivery_fee, status, created_at FROM `orders` ORDER BY id");
while ($r = $stmt->fetch()) {
    echo "  ID: {$r['id']}, Ref: {$r['order_ref']}, Cust: " . ($r['customer_id'] ?? 'NULL') . ", Status: {$r['status']}, Total: {$r['total']}, Fee: {$r['delivery_fee']}, Date: {$r['created_at']}\n";
}

echo "\nORDER ITEMS COUNT BY ORDER:\n";
$stmt = $pdo->query("SELECT order_id, COUNT(*) as cnt, SUM(line_total) as sum_lines FROM `order_items` GROUP BY order_id");
while ($r = $stmt->fetch()) {
    echo "  Order ID: {$r['order_id']}, Items: {$r['cnt']}, LineTotalSum: {$r['sum_lines']}\n";
}
