<?php
/** NOVA Home — GET /api/product.php?slug=sahara-vase (Phase 2A).
 * Returns product + category + images (sort_order) + specs (sort_order).
 * Missing/invalid slug → 404 JSON. Never falls back to another product.
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
try {
    $slug = isset($_GET['slug']) ? strtolower(trim((string) $_GET['slug'])) : '';
    if ($slug === '' || !v_slug($slug)) {
        json_response(['success' => false, 'error' => 'Product not found.'], 404);
    }
    $pdo = nova_pdo();
    $stmt = $pdo->prepare(
        'SELECT p.`id`, p.`slug`, p.`name`, p.`price`, p.`old_price`, p.`rating`,'
        . ' p.`reviews_count`, p.`is_new`, p.`is_best`, p.`description`, p.`active`,'
        . ' c.`slug` AS `category_slug`, c.`name` AS `category_name`'
        . ' FROM `products` p'
        . ' INNER JOIN `categories` c ON c.`id` = p.`category_id`'
        . ' WHERE p.`slug` = :slug AND p.`active` = 1 LIMIT 1'
    );
    $stmt->execute([':slug' => $slug]);
    $row = $stmt->fetch();
    if (!$row) {
        json_response(['success' => false, 'error' => 'Product not found.'], 404);
    }
    $pid = (int) $row['id'];
    $imgStmt = $pdo->prepare(
        'SELECT `image_path`, `sort_order`, `alt_text` FROM `product_images`'
        . ' WHERE `product_id` = :id ORDER BY `sort_order` ASC, `id` ASC'
    );
    $imgStmt->execute([':id' => $pid]);
    $images = [];
    foreach ($imgStmt->fetchAll() as $img) {
        $images[] = ['image_path' => (string) $img['image_path'],
            'sort_order' => (int) $img['sort_order'], 'alt_text' => (string) $img['alt_text']];
    }
    $specStmt = $pdo->prepare(
        'SELECT `spec_key`, `spec_value`, `sort_order` FROM `product_specifications`'
        . ' WHERE `product_id` = :id ORDER BY `sort_order` ASC, `id` ASC'
    );
    $specStmt->execute([':id' => $pid]);
    $specs = [];
    foreach ($specStmt->fetchAll() as $sp) {
        $specs[] = ['key' => (string) $sp['spec_key'],
            'value' => (string) $sp['spec_value'], 'sort_order' => (int) $sp['sort_order']];
    }
    $old = $row['old_price'] !== null ? (int) $row['old_price'] : null;
    json_response(['success' => true, 'data' => [
        'product' => [
            'id' => (string) $row['slug'], 'slug' => (string) $row['slug'],
            'category' => (string) $row['category_slug'], 'cat' => (string) $row['category_slug'],
            'name' => (string) $row['name'], 'price' => (int) $row['price'],
            'oldPrice' => $old, 'old' => $old, 'rating' => (float) $row['rating'],
            'reviews' => (int) $row['reviews_count'],
            'isNew' => (bool) $row['is_new'], 'isBest' => (bool) $row['is_best'],
            'best' => (bool) $row['is_best'],
            'description' => (string) $row['description'], 'desc' => (string) $row['description'],
        ],
        'category' => ['slug' => (string) $row['category_slug'], 'name' => (string) $row['category_name']],
        'images' => $images, 'specifications' => $specs,
    ]]);
} catch (Throwable $e) {
    error_log('[NOVA api/product] ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Unable to load product.'], 500);
}
