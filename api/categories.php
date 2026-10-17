<?php
/**
 * NOVA Home — GET /api/categories.php (Backend Phase 2A).
 *
 * Returns active categories from MySQL in frontend-compatible shape.
 * No parameters. PDO prepared query (no user input by design).
 * Response: { "success": true, "data": [ {id, slug, name, image, sort_order} ] }
 */

declare(strict_types=1);

require_once __DIR__ . '/../includes/bootstrap.php';

try {
    // Prepared statement even with no user input (project rule).
    $stmt = nova_pdo()->prepare(
        'SELECT `slug` AS `id`, `slug`, `name`, `image`, `sort_order`
         FROM `categories`
         ORDER BY `sort_order` ASC, `name` ASC'
    );
    $stmt->execute();
    $rows = $stmt->fetchAll();

    $data = [];
    foreach ($rows as $row) {
        $data[] = [
            'id'         => (string) $row['slug'],
            'slug'       => (string) $row['slug'],
            'name'       => (string) $row['name'],
            'image'      => (string) $row['image'],
            'sort_order' => (int) $row['sort_order'],
        ];
    }

    json_response(['success' => true, 'data' => $data]);
} catch (Throwable $e) {
    error_log('[NOVA api/categories] ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Unable to load categories.'], 500);
}
