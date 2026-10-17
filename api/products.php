<?php
/** NOVA Home — GET /api/products.php (Backend Phase 2A). Catalogue listing.
 * Params (all optional): category (slug), q (search), min_price/max_price
 * (int EGP), sort whitelist (featured|new|low|high), limit 1..100, offset.
 * Active products only. Prices always from DB — never trust client totals.
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
try {
    $rawCategory = isset($_GET['category']) ? trim((string) $_GET['category']) : '';
    $category = null;
    if ($rawCategory !== '' && strtolower($rawCategory) !== 'all') {
        if (!v_slug($rawCategory)) {
            json_response(['success' => false, 'error' => 'Invalid category.'], 400);
        }
        $category = strtolower($rawCategory);
    }
    $q = isset($_GET['q']) ? trim((string) $_GET['q']) : '';
    if (mb_strlen($q, 'UTF-8') > 120) {
        $q = mb_substr($q, 0, 120, 'UTF-8');
    }
    $minPrice = isset($_GET['min_price']) && $_GET['min_price'] !== ''
        ? v_int_range($_GET['min_price'], 0, 100000000) : null;
    $maxPrice = isset($_GET['max_price']) && $_GET['max_price'] !== ''
        ? v_int_range($_GET['max_price'], 0, 100000000) : null;
    if ((isset($_GET['min_price']) && $_GET['min_price'] !== '' && $minPrice === null)
        || (isset($_GET['max_price']) && $_GET['max_price'] !== '' && $maxPrice === null)) {
        json_response(['success' => false, 'error' => 'Invalid price range.'], 400);
    }
    if ($minPrice !== null && $maxPrice !== null && $minPrice > $maxPrice) {
        json_response(['success' => false, 'error' => 'Invalid price range.'], 400);
    }
    $sort = strtolower(trim((string) ($_GET['sort'] ?? 'featured')));
    if (!in_array($sort, ['featured', 'new', 'low', 'high', 'alpha'], true)) {
        $sort = 'featured';
    }
    $limit = isset($_GET['limit']) ? v_int_range($_GET['limit'], 1, 100) : 100;
    $offset = isset($_GET['offset']) ? v_int_range($_GET['offset'], 0, 10000) : 0;
    if ($limit === null) {
        $limit = 100;
    }
    if ($offset === null) {
        $offset = 0;
    }
    $sql = 'SELECT p.`slug`, c.`slug` AS `category`, p.`name`, p.`price`, p.`old_price`,'
        . ' p.`rating`, p.`reviews_count`, p.`is_new`, p.`is_best`, p.`description`,'
        . ' (SELECT pi.`image_path` FROM `product_images` pi'
        . ' WHERE pi.`product_id` = p.`id` ORDER BY pi.`sort_order` ASC LIMIT 1) AS `image`,'
        . ' (SELECT ps.`spec_value` FROM `product_specifications` ps'
        . ' WHERE ps.`product_id` = p.`id` AND ps.`spec_key` = \'Material\' LIMIT 1) AS `material`'
        . ' FROM `products` p'
        . ' INNER JOIN `categories` c ON c.`id` = p.`category_id`'
        . ' WHERE p.`active` = 1';
    $params = [];
    if ($category !== null) {
        $sql .= ' AND c.`slug` = :category';
        $params[':category'] = $category;
    }
    if ($q !== '') {
        $sql .= ' AND (p.`name` LIKE :q1 OR c.`name` LIKE :q2 OR p.`description` LIKE :q3)';
        $params[':q1'] = '%' . $q . '%';
        $params[':q2'] = '%' . $q . '%';
        $params[':q3'] = '%' . $q . '%';
    }
    if ($minPrice !== null) {
        $sql .= ' AND p.`price` >= :min_price';
        $params[':min_price'] = $minPrice;
    }
    if ($maxPrice !== null) {
        $sql .= ' AND p.`price` <= :max_price';
        $params[':max_price'] = $maxPrice;
    }
    if ($sort === 'low') {
        $sql .= ' ORDER BY p.`price` ASC, p.`name` ASC';
    } elseif ($sort === 'high') {
        $sql .= ' ORDER BY p.`price` DESC, p.`name` ASC';
    } elseif ($sort === 'new') {
        $sql .= ' ORDER BY p.`is_new` DESC, p.`id` ASC';
    } elseif ($sort === 'alpha') {
        $sql .= ' ORDER BY p.`name` ASC';
    } else {
        $sql .= ' ORDER BY p.`is_best` DESC, p.`id` ASC';
    }
    $sql .= ' LIMIT ' . (int) $limit . ' OFFSET ' . (int) $offset;
    $stmt = nova_pdo()->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
    }
    $stmt->execute();
    $data = [];
    foreach ($stmt->fetchAll() as $row) {
        $old = $row['old_price'] !== null ? (int) $row['old_price'] : null;
        $data[] = [
            'id' => (string) $row['slug'], 'slug' => (string) $row['slug'],
            'category' => (string) $row['category'], 'cat' => (string) $row['category'],
            'name' => (string) $row['name'], 'price' => (int) $row['price'],
            'oldPrice' => $old, 'old' => $old, 'rating' => (float) $row['rating'],
            'reviews' => (int) $row['reviews_count'],
            'isNew' => (bool) $row['is_new'], 'isBest' => (bool) $row['is_best'],
            'best' => (bool) $row['is_best'],
            'description' => (string) $row['description'], 'desc' => (string) $row['description'],
            'material' => $row['material'] !== null ? (string) $row['material'] : null,
            'image' => $row['image'] !== null ? (string) $row['image'] : null,
        ];
    }
    json_response(['success' => true, 'data' => $data,
        'meta' => ['count' => count($data), 'limit' => $limit, 'offset' => $offset, 'sort' => $sort]]);
} catch (Throwable $e) {
    error_log('[NOVA api/products] ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Unable to load products.'], 500);
}
