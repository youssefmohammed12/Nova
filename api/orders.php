<?php
/** NOVA Home — POST /api/orders.php (Phase 3). Guest COD checkout.
 * JSON: customer_name, phone, email (optional), city (controlled list),
 * address (+apartment merged), notes (optional), payment_method ('cod'),
 * items [{slug, qty 1..10}], csrf_token. Prices/delivery from MySQL only.
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
    $name = v_text($body['customer_name'] ?? '', 120);
    if ($name === '') {
        json_response(['success' => false, 'error' => 'Please enter your full name.'], 400);
    }
    $phone = trim((string) ($body['phone'] ?? ''));
    if (!v_phone_eg($phone)) {
        json_response(['success' => false, 'error' => 'Enter a valid phone number.'], 400);
    }
    $emailRaw = trim((string) ($body['email'] ?? ''));
    if ($emailRaw !== '' && !v_email($emailRaw)) {
        json_response(['success' => false, 'error' => 'Enter a valid email address.'], 400);
    }
    $city = v_city($body['city'] ?? null);
    if ($city === null) {
        json_response(['success' => false, 'error' => 'Please choose a valid city.'], 400);
    }
    $addr = v_text($body['address'] ?? '', 255);
    $apt = v_text($body['apartment'] ?? '', 120);
    $address = $apt !== '' ? $addr . ', ' . $apt : $addr;
    if ($addr === '') {
        json_response(['success' => false, 'error' => 'Please enter your street address.'], 400);
    }
    if (mb_strlen($address, 'UTF-8') > 255) {
        $address = mb_substr($address, 0, 255, 'UTF-8');
    }
    $notes = v_text($body['notes'] ?? '', 500);
    $pm = strtolower(trim((string) ($body['payment_method'] ?? 'cod')));
    if ($pm !== 'cod') {
        json_response(['success' => false, 'error' => 'Unsupported payment method.'], 400);
    }
    $items = $body['items'] ?? null;
    if (!is_array($items) || $items === []) {
        json_response(['success' => false, 'error' => 'Your cart is empty.'], 400);
    }
    if (count($items) > 50) {
        json_response(['success' => false, 'error' => 'Too many items.'], 400);
    }
    // Normalise duplicates: aggregate qty per slug, cap enforced below.
    $wanted = [];
    foreach ($items as $entry) {
        if (!is_array($entry)) {
            json_response(['success' => false, 'error' => 'Invalid cart item.'], 400);
        }
        $slug = strtolower(trim((string) ($entry['slug'] ?? $entry['id'] ?? '')));
        if ($slug === '' || !v_slug($slug)) {
            json_response(['success' => false, 'error' => 'Some cart items are no longer available.'], 400);
        }
        $qty = filter_var($entry['qty'] ?? $entry['quantity'] ?? null, FILTER_VALIDATE_INT);
        if ($qty === false) {
            json_response(['success' => false, 'error' => 'Invalid quantity.'], 400);
        }
        $wanted[$slug] = ($wanted[$slug] ?? 0) + (int) $qty;
    }
    foreach ($wanted as $qty) {
        if ($qty < 1 || $qty > 10) {
            json_response(['success' => false, 'error' => 'Quantity must be between 1 and 10.'], 400);
        }
    }
    // Batch-resolve active products (one query, no N+1).
    $slugs = array_keys($wanted);
    $placeholders = implode(',', array_fill(0, count($slugs), '?'));
    $stmt = nova_pdo()->prepare(
        'SELECT `id`, `slug`, `name`, `price` FROM `products`'
        . ' WHERE `slug` IN (' . $placeholders . ') AND `active` = 1'
    );
    $stmt->execute($slugs);
    $found = [];
    foreach ($stmt->fetchAll() as $row) {
        $found[$row['slug']] = $row;
    }
    $lines = [];
    $subtotal = 0;
    foreach ($wanted as $slug => $qty) {
        if (!isset($found[$slug])) {
            json_response(['success' => false, 'error' => 'Some cart items are no longer available.'], 400);
        }
        $price = (int) $found[$slug]['price'];
        $lineTotal = $price * $qty;
        $subtotal += $lineTotal;
        $lines[] = ['product_id' => (int) $found[$slug]['id'],
            'product_name' => (string) $found[$slug]['name'],
            'unit_price' => $price, 'quantity' => $qty, 'line_total' => $lineTotal];
    }
    // Server-side delivery from the settings source of truth.
    $fee = (int) nova_setting('delivery_fee', 60);
    $threshold = (int) nova_setting('free_delivery_threshold', 1500);
    $deliveryFee = ($subtotal >= $threshold) ? 0 : $fee;
    $total = $subtotal + $deliveryFee;
    // Phase 9: associate the order with the session customer when signed in.
    // Guests stay NULL. Any customer_id submitted by the browser is IGNORED —
    // ownership comes only from the re-checked server-side session.
    $me = nova_customer_user();
    $customerId = $me !== null ? $me['id'] : null;
    // Transactional insert with collision-safe reference.
    $pdo = nova_pdo();
    try {
        $pdo->beginTransaction();
        $orderId = null;
        $orderRef = '';
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $orderRef = 'NH-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));
            try {
                $ins = $pdo->prepare(
                    'INSERT INTO `orders` (`order_ref`, `customer_id`, `customer_name`, `phone`, `email`,'
                    . ' `city`, `address`, `notes`, `payment_method`, `subtotal`,'
                    . ' `delivery_fee`, `total`, `status`) VALUES'
                    . ' (:ref, :cust, :name, :phone, :email, :city, :address, :notes,'
                    . ' :pm, :sub, :fee, :total, :status)'
                );
                $ins->execute([':ref' => $orderRef, ':cust' => $customerId, ':name' => $name,
                    ':phone' => $phone, ':email' => $emailRaw, ':city' => $city,
                    ':address' => $address, ':notes' => $notes, ':pm' => 'cod',
                    ':sub' => $subtotal, ':fee' => $deliveryFee, ':total' => $total,
                    ':status' => 'pending']);
                $orderId = (int) $pdo->lastInsertId();
                break;
            } catch (PDOException $e) {
                if ($e->getCode() === '23000') {
                    continue;
                }
                throw $e;
            }
        }
        if ($orderId === null) {
            throw new RuntimeException('ref allocation failed');
        }
        $itemStmt = $pdo->prepare(
            'INSERT INTO `order_items` (`order_id`, `product_id`, `product_name`,'
            . ' `unit_price`, `quantity`, `line_total`) VALUES'
            . ' (:oid, :pid, :pname, :price, :qty, :line)'
        );
        foreach ($lines as $ln) {
            $itemStmt->execute([':oid' => $orderId, ':pid' => $ln['product_id'],
                ':pname' => $ln['product_name'], ':price' => $ln['unit_price'],
                ':qty' => $ln['quantity'], ':line' => $ln['line_total']]);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
    // Phase 4: bind this order to the checkout session (minimal — ref only)
    // so api/order.php can authorize the success-page read server-side.
    nova_session();
    $_SESSION['nova_order_ref'] = $orderRef;
    json_response(['success' => true, 'data' => ['order_id' => $orderId,
        'order_ref' => $orderRef, 'subtotal' => $subtotal,
        'delivery_fee' => $deliveryFee, 'total' => $total]]);
} catch (Throwable $e) {
    error_log('[NOVA api/orders] ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Unable to create order.'], 500);
}
