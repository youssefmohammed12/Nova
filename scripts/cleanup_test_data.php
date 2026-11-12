<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

/**
 * Remove only records created by scripts/playwright_audit.js.
 *
 * Usage:
 *   php scripts/cleanup_test_data.php e2e_cust_123456@novahome.eg --remove-temp-admin
 *
 * The exact generated customer email is required to remove customer data.
 * The temporary admin is removed only when the explicit flag is supplied.
 * No broad LIKE/name matching is used.
 */
require_once __DIR__ . '/../includes/bootstrap.php';

$customerEmail = '';
$removeTempAdmin = in_array('--remove-temp-admin', $argv, true);

foreach (array_slice($argv, 1) as $arg) {
    if ($arg !== '--remove-temp-admin') {
        $customerEmail = trim($arg);
    }
}

$validCustomerEmail = preg_match('/^e2e_cust_[0-9]+@novahome\.eg$/i', $customerEmail) === 1;
if (($customerEmail !== '' && !$validCustomerEmail) || (!$validCustomerEmail && !$removeTempAdmin)) {
    fwrite(STDERR, "Usage: php scripts/cleanup_test_data.php [e2e_cust_<timestamp>@novahome.eg] [--remove-temp-admin]\n");
    exit(2);
}

$pdo = nova_pdo();

try {
    $pdo->beginTransaction();

    if ($validCustomerEmail) {
        $customerStmt = $pdo->prepare(
            "SELECT id FROM customers WHERE email = :email AND name = 'E2E Account Customer' LIMIT 1"
        );
        $customerStmt->execute([':email' => $customerEmail]);
        $customerId = (int) ($customerStmt->fetchColumn() ?: 0);

        if ($customerId > 0) {
            $ordersStmt = $pdo->prepare(
                'SELECT id, order_ref FROM orders WHERE customer_id = :customer_id'
            );
            $ordersStmt->execute([':customer_id' => $customerId]);

            $deleteItems = $pdo->prepare('DELETE FROM order_items WHERE order_id = :order_id');
            $deleteOrder = $pdo->prepare('DELETE FROM orders WHERE id = :order_id AND customer_id = :customer_id');

            foreach ($ordersStmt->fetchAll() as $order) {
                $orderId = (int) $order['id'];
                $deleteItems->execute([':order_id' => $orderId]);
                $deleteOrder->execute([':order_id' => $orderId, ':customer_id' => $customerId]);
                echo "Cleaned test order {$order['order_ref']} (ID {$orderId})\n";
            }

            $deleteAddresses = $pdo->prepare('DELETE FROM customer_addresses WHERE customer_id = :customer_id');
            $deleteAddresses->execute([':customer_id' => $customerId]);

            $deleteCustomer = $pdo->prepare(
                "DELETE FROM customers WHERE id = :id AND email = :email AND name = 'E2E Account Customer'"
            );
            $deleteCustomer->execute([':id' => $customerId, ':email' => $customerEmail]);
            echo "Cleaned exact test customer {$customerEmail}\n";
        } else {
            echo "No matching test customer found; no customer records changed.\n";
        }
    }

    if ($removeTempAdmin) {
        $deleteAdmin = $pdo->prepare(
            "DELETE FROM admin_users WHERE email = 'audit_admin@novahome.eg' AND name = 'Audit Admin'"
        );
        $deleteAdmin->execute();
        echo "Removed temporary audit admin (if it existed).\n";
    }

    $pdo->commit();
    echo "Targeted test cleanup completed.\n";
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    fwrite(STDERR, "Test cleanup failed; all cleanup changes were rolled back.\n");
    error_log('[NOVA test cleanup] ' . $e->getMessage());
    exit(1);
}
