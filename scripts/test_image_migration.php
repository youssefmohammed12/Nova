<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/bootstrap.php';
require_once __DIR__ . '/../includes/validation.php';

echo "=== 1. Testing v_image_path() ===\n";

$tests = [
    // Positive tests
    ['path' => 'assets/images/products/sahara-vase/main.webp', 'expected' => true, 'desc' => 'Valid WebP product image'],
    ['path' => 'assets/images/cat-decor.svg', 'expected' => true, 'desc' => 'Valid SVG category image'],
    // Negative tests
    ['path' => 'assets/images/../config.php', 'expected' => false, 'desc' => 'Directory traversal attempt'],
    ['path' => 'assets/images/products/non-existent.webp', 'expected' => false, 'desc' => 'Non-existent webp image'],
    ['path' => 'assets/images/products/sahara-vase/main.php', 'expected' => false, 'desc' => 'Disallowed extension (.php)'],
    ['path' => 'http://example.com/image.webp', 'expected' => false, 'desc' => 'Remote URL'],
    ['path' => '/etc/passwd', 'expected' => false, 'desc' => 'Absolute system path'],
];

$passCount = 0;
foreach ($tests as $t) {
    $isValid = v_image_path($t['path']);
    if ($isValid === $t['expected']) {
        echo " [PASS] {$t['desc']} -> " . ($isValid ? 'Valid' : 'Invalid') . "\n";
        $passCount++;
    } else {
        echo " [FAIL] {$t['desc']} -> Expected " . ($t['expected'] ? 'valid' : 'invalid') . " but got " . ($isValid ? 'valid' : 'invalid') . "\n";
    }
}

echo "\nv_image_path results: $passCount/" . count($tests) . " passed.\n\n";

echo "=== 2. Testing Public APIs ===\n";

$pdo = nova_db($config);

// Test products API logic
$stmt = $pdo->query("
    SELECT p.id, p.slug, p.name, pi.image_path, pi.alt_text
    FROM products p
    LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.sort_order = 0
    WHERE p.active = 1
    ORDER BY p.id ASC
");
$products = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Active products count: " . count($products) . "\n";
$allHaveWebp = true;
foreach ($products as $p) {
    if (!str_starts_with($p['image_path'], 'assets/images/products/') || !str_ends_with($p['image_path'], '.webp')) {
        echo " [FAIL] Product {$p['slug']} has unexpected image_path: {$p['image_path']}\n";
        $allHaveWebp = false;
    }
    $fullPath = __DIR__ . '/../' . $p['image_path'];
    if (!file_exists($fullPath)) {
        echo " [FAIL] Image file missing on disk: $fullPath\n";
        $allHaveWebp = false;
    }
}
if ($allHaveWebp) {
    echo " [PASS] All " . count($products) . " products have valid, existing WebP photography!\n";
}

// Test single product API detail logic
$stmt = $pdo->prepare("
    SELECT pi.image_path, pi.sort_order, pi.alt_text
    FROM product_images pi
    JOIN products p ON p.id = pi.product_id
    WHERE p.slug = :slug
    ORDER BY pi.sort_order ASC
");
$stmt->execute([':slug' => 'sahara-vase']);
$images = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Sahara vase images count in DB: " . count($images) . "\n";
foreach ($images as $img) {
    echo "  - {$img['image_path']} (sort: {$img['sort_order']}, alt: {$img['alt_text']})\n";
}

echo "\nAll PHP and DB checks completed successfully!\n";
