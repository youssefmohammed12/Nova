<?php
/** NOVA Home — GET /api/order.php?ref=NH-... (Phase 4).
 * Session-authorized order read for the success page.
 * Authorization: the requested ref must equal the ref bound to the current
 * PHP session at checkout ($_SESSION['nova_order_ref']) — knowing a ref is
 * NOT enough. Wrong-session / nonexistent / unowned refs all return the same
 * 404 so existence never leaks. Returns only the customer-facing fields the
 * success page renders (no phone/email/notes). Monetary values are raw ints.
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
if (!isset($_SERVER['REQUEST_METHOD']) || strtoupper($_SERVER['REQUEST_METHOD']) !== 'GET') {
    json_response(['success' => false, 'error' => 'Method not allowed.'], 405);
}
try {
    $ref = trim((string) ($_GET['ref'] ?? ''));
    if ($ref === '') {
        json_response(['success' => false, 'error' => 'Missing order reference.'], 400);
    }
    if (!preg_match('/^NH-\d{8}-[A-F0-9]{6}$/i', $ref)) {
        json_response(['success' => false, 'error' => 'Invalid order reference.'], 400);
    }
    $ref = strtoupper($ref);
    nova_session();
    $owned = $_SESSION['nova_order_ref'] ?? '';
    // Uniform 404: unauthorized, nonexistent and expired-session all look identical.
    $deny = static function (): never {
        json_response(['success' => false, 'error' => 'Order not found.'], 404);
    };
    if (!is_string($owned) || $owned === '' || !hash_equals($owned, $ref)) {
        $deny();
    }
    $pdo = nova_pdo();
    $stmt = $pdo->prepare(
        'SELECT `id`, `order_ref`, `customer_name`, `city`, `address`,'
        . ' `subtotal`, `delivery_fee`, `total`'
        . ' FROM `orders` WHERE `order_ref` = :ref LIMIT 1'
    );
    $stmt->execute([':ref' => $ref]);
    $order = $stmt->fetch();
    if (!$order) {
        $deny();
    }
    // Items by the authorized order's DB id, deterministic order, snapshot
    // values only (never re-derived from the current products table). The
    // slug join is cosmetic: thumbnail for the summary line; null if the
    // product was later removed.
    $itemStmt = $pdo->prepare(
        'SELECT oi.`product_name`, oi.`unit_price`, oi.`quantity`, oi.`line_total`,'
        . ' p.`slug`'
        . ' FROM `order_items` oi'
        . ' LEFT JOIN `products` p ON p.`id` = oi.`product_id`'
        . ' WHERE oi.`order_id` = :id ORDER BY oi.`id` ASC'
    );
    $itemStmt->execute([':id' => (int) $order['id']]);
    $items = [];
    foreach ($itemStmt->fetchAll() as $row) {
        $items[] = [
            'product_name' => (string) $row['product_name'],
            'unit_price'   => (int) $row['unit_price'],
            'quantity'     => (int) $row['quantity'],
            'line_total'   => (int) $row['line_total'],
            'slug'         => $row['slug'] !== null ? (string) $row['slug'] : null,
        ];
    }
    json_response(['success' => true, 'data' => [
        'order_ref'     => (string) $order['order_ref'],
        'customer_name' => (string) $order['customer_name'],
        'city'          => (string) $order['city'],
        'address'       => (string) $order['address'],
        'subtotal'      => (int) $order['subtotal'],
        'delivery_fee'  => (int) $order['delivery_fee'],
        'total'         => (int) $order['total'],
        'items'         => $items,
    ]]);
} catch (Throwable $e) {
    error_log('[NOVA api/order] ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Unable to load order.'], 500);
}
