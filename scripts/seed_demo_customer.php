<?php
/**
 * NOVA Home — Seed demo customer account with realistic sample data.
 *
 * SAFE TO RERUN: skips creation when the demo customer already exists and
 * existing demo orders already cover the expected count.
 *
 * Usage (CLI only):
 *   php scripts/seed_demo_customer.php
 *
 * Creates:
 *   - 1 demo customer  (demo.customer@novahome.eg)
 *   - 2 saved addresses
 *   - 5 demo orders with assorted statuses and realistic items
 *
 * Demo orders use the notes field 'NOVA_DEMO_ORDER' as a soft marker so
 * cleanup scripts can identify them without ambiguity.
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require dirname(__DIR__) . '/includes/bootstrap.php';

$pdo = nova_pdo();

// ── Demo customer identity ──────────────────────────────────────────────
$demoEmail    = 'demo.customer@novahome.eg';
$demoName     = 'Sarah El-Masry';
$demoPhone    = '+20 112 345 6789';
$demoPassword = 'DemoCustomer2026!';   // bcrypt-hashed below; never sent to client

// ── 1. Create customer (skip if exists) ─────────────────────────────────
$stmt = $pdo->prepare('SELECT id FROM customers WHERE email = :e LIMIT 1');
$stmt->execute([':e' => $demoEmail]);
$existing = $stmt->fetchColumn();

if ($existing) {
    $customerId = (int) $existing;
    echo "Demo customer already exists (ID {$customerId}). Skipping customer creation.\n";
} else {
    $hash = password_hash($demoPassword, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare(
        'INSERT INTO customers (name, email, password_hash, phone, active) VALUES (:n, :e, :h, :p, 1)'
    );
    $stmt->execute([':n' => $demoName, ':e' => $demoEmail, ':h' => $hash, ':p' => $demoPhone]);
    $customerId = (int) $pdo->lastInsertId();
    echo "Created demo customer: {$demoName} <{$demoEmail}> (ID {$customerId})\n";
}

// ── 2. Create addresses (skip if any exist for this customer) ───────────
$addrCount = (int) $pdo->prepare('SELECT COUNT(*) FROM customer_addresses WHERE customer_id = :id')
    ->execute([':id' => $customerId]) ? $pdo->query("SELECT COUNT(*) FROM customer_addresses WHERE customer_id = {$customerId}")->fetchColumn() : 0;

if ((int) $addrCount >= 2) {
    echo "Demo customer already has {$addrCount} addresses. Skipping address creation.\n";
} else {
    // Remove any partial leftover before re-seeding
    $pdo->prepare('DELETE FROM customer_addresses WHERE customer_id = :id')->execute([':id' => $customerId]);

    $addresses = [
        [
            'label' => 'Home',
            'recipient_name' => 'Sarah El-Masry',
            'phone' => '+20 112 345 6789',
            'city' => 'Cairo',
            'address' => '14 Hassan Sabry Street, Zamalek',
            'apartment' => 'Apt 7B, 3rd Floor',
            'is_default' => 1,
        ],
        [
            'label' => 'Office',
            'recipient_name' => 'Sarah El-Masry',
            'phone' => '+20 100 987 6543',
            'city' => 'Cairo',
            'address' => '28 Mohamed Farid Street, Downtown',
            'apartment' => 'Suite 402',
            'is_default' => 0,
        ],
    ];

    $ins = $pdo->prepare(
        'INSERT INTO customer_addresses (customer_id, label, recipient_name, phone, city, address, apartment, is_default)
         VALUES (:cid, :label, :rn, :ph, :city, :addr, :apt, :def)'
    );
    foreach ($addresses as $a) {
        $ins->execute([
            ':cid'   => $customerId,
            ':label' => $a['label'],
            ':rn'    => $a['recipient_name'],
            ':ph'    => $a['phone'],
            ':city'  => $a['city'],
            ':addr'  => $a['address'],
            ':apt'   => $a['apartment'],
            ':def'   => $a['is_default'],
        ]);
    }
    echo "Created 2 demo addresses (Home + Office).\n";
}

// ── 3. Create demo orders (skip if we already have enough) ──────────────
$demoOrderCount = (int) $pdo->prepare(
    "SELECT COUNT(*) FROM orders WHERE customer_id = :id AND notes = 'NOVA_DEMO_ORDER'"
)->execute([':id' => $customerId])
    ? (int) $pdo->query("SELECT COUNT(*) FROM orders WHERE customer_id = {$customerId} AND notes = 'NOVA_DEMO_ORDER'")->fetchColumn()
    : 0;

if ($demoOrderCount >= 5) {
    echo "Demo customer already has {$demoOrderCount} demo orders. Skipping order creation.\n";
} else {
    // Remove partial demo orders before clean re-seed
    $pdo->prepare("DELETE FROM orders WHERE customer_id = :id AND notes = 'NOVA_DEMO_ORDER'")->execute([':id' => $customerId]);

    // Load real product data for realistic order items
    $products = $pdo->query('SELECT id, name, price FROM products ORDER BY id')->fetchAll();
    $byId = [];
    foreach ($products as $p) {
        $byId[(int) $p['id']] = $p;
    }

    // Delivery fee logic (from settings)
    $deliveryFee = 60;
    $freeThreshold = 1500;

    // Helper: generate an order ref in the existing format
    $makeRef = function (string $dateStr) use ($pdo): string {
        // NH-YYYYMMDD-XXXXXX format
        return 'NH-' . str_replace('-', '', $dateStr) . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
    };

    // Define 5 demo orders with varied statuses and dates
    $demoOrders = [
        // Order 1: Delivered — large order, free delivery
        [
            'date'   => '2026-09-15 14:30:00',
            'status' => 'delivered',
            'city'   => 'Cairo',
            'address'=> '14 Hassan Sabry Street, Zamalek',
            'items'  => [
                ['product_id' => 9, 'qty' => 1],  // Cairo Boucle Accent Chair — 6800
                ['product_id' => 5, 'qty' => 1],  // Halo Round Wall Mirror — 1650
            ],
        ],
        // Order 2: Shipped — mid-range
        [
            'date'   => '2026-10-02 10:15:00',
            'status' => 'shipped',
            'city'   => 'Cairo',
            'address'=> '14 Hassan Sabry Street, Zamalek',
            'items'  => [
                ['product_id' => 8, 'qty' => 1],  // Aswan Oak Side Table — 2900
                ['product_id' => 6, 'qty' => 1],  // Dune Bedside Table Lamp — 990
            ],
        ],
        // Order 3: Confirmed — decor items
        [
            'date'   => '2026-10-10 16:45:00',
            'status' => 'confirmed',
            'city'   => 'Cairo',
            'address'=> '28 Mohamed Farid Street, Downtown',
            'items'  => [
                ['product_id' => 1, 'qty' => 2],  // Sahara Ceramic Vase ×2 — 1780
                ['product_id' => 14, 'qty' => 1], // Minimal Wall Clock — 560
            ],
        ],
        // Order 4: Pending — kitchen items, has delivery fee
        [
            'date'   => '2026-10-14 09:20:00',
            'status' => 'pending',
            'city'   => 'Cairo',
            'address'=> '14 Hassan Sabry Street, Zamalek',
            'items'  => [
                ['product_id' => 3, 'qty' => 1],  // Olive Wood Serving Board — 480
                ['product_id' => 7, 'qty' => 2],  // Terra Stoneware Mug Set ×2 — 1080
            ],
        ],
        // Order 5: Cancelled — single item
        [
            'date'   => '2026-10-08 11:00:00',
            'status' => 'cancelled',
            'city'   => 'Cairo',
            'address'=> '14 Hassan Sabry Street, Zamalek',
            'items'  => [
                ['product_id' => 11, 'qty' => 3], // Pillar Soy Candle Trio ×3 — 1260
            ],
        ],
    ];

    $orderIns = $pdo->prepare(
        'INSERT INTO orders (order_ref, customer_id, customer_name, phone, email, city, address, notes, payment_method, subtotal, delivery_fee, total, status, created_at)
         VALUES (:ref, :cid, :cname, :phone, :email, :city, :addr, :notes, :pay, :sub, :fee, :total, :status, :created)'
    );
    $itemIns = $pdo->prepare(
        'INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
         VALUES (:oid, :pid, :pname, :uprice, :qty, :ltotal)'
    );

    foreach ($demoOrders as $o) {
        $dateStr = substr($o['date'], 0, 10);
        $ref = $makeRef($dateStr);

        // Calculate subtotal from items
        $subtotal = 0;
        $itemData = [];
        foreach ($o['items'] as $item) {
            $p = $byId[$item['product_id']];
            $lineTotal = (int) $p['price'] * $item['qty'];
            $subtotal += $lineTotal;
            $itemData[] = [
                'product_id'   => $item['product_id'],
                'product_name' => $p['name'],
                'unit_price'   => (int) $p['price'],
                'quantity'     => $item['qty'],
                'line_total'   => $lineTotal,
            ];
        }

        $fee = $subtotal >= $freeThreshold ? 0 : $deliveryFee;
        $total = $subtotal + $fee;

        $orderIns->execute([
            ':ref'     => $ref,
            ':cid'     => $customerId,
            ':cname'   => $demoName,
            ':phone'   => $demoPhone,
            ':email'   => $demoEmail,
            ':city'    => $o['city'],
            ':addr'    => $o['address'],
            ':notes'   => 'NOVA_DEMO_ORDER',
            ':pay'     => 'cod',
            ':sub'     => $subtotal,
            ':fee'     => $fee,
            ':total'   => $total,
            ':status'  => $o['status'],
            ':created' => $o['date'],
        ]);

        $orderId = (int) $pdo->lastInsertId();
        foreach ($itemData as $it) {
            $itemIns->execute([
                ':oid'    => $orderId,
                ':pid'    => $it['product_id'],
                ':pname'  => $it['product_name'],
                ':uprice' => $it['unit_price'],
                ':qty'    => $it['quantity'],
                ':ltotal' => $it['line_total'],
            ]);
        }

        echo "  Created demo order {$ref} — {$o['status']} — EGP {$total}\n";
    }
    echo "Created 5 demo orders.\n";
}

// ── 4. Suggested wishlist product slugs (localStorage, seeded by client) ──
// These are printed so the seed script's output documents what the login
// handler should populate in localStorage. Product ids are slug strings
// since the Phase 2 catalogue migration (numeric legacy ids no longer resolve).
$wishlistIds = ['luna-floor-lamp', 'halo-mirror', 'oasis-pendant', 'aswan-side-table']; // Luna Arc Floor Lamp, Halo Mirror, Oasis Pendant, Aswan Oak Side Table
echo "\nSuggested wishlist product slugs (for localStorage): " . implode(', ', $wishlistIds) . "\n";

echo "\n✓ Demo customer seed complete.\n";
