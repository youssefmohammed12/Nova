<?php
/**
 * NOVA Home - infrastructure health probe (Backend Phase 1, dev only).
 *
 * Verifies: bootstrap loads, PDO connects, expected tables exist with
 * expected seed counts. Returns JSON. No business logic, no secrets in output.
 * Phase 2+ may restrict or remove this endpoint before production.
 */
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
try {
    require_once __DIR__ . '/includes/bootstrap.php';
    if (NOVA_ENV !== 'development') {
        http_response_code(404);
        exit;
    }
    $pdo = nova_pdo();
    $expected = ['categories' => 5, 'products' => 14, 'product_images' => 14, 'product_specifications' => 42, 'settings' => 6];
    $counts = [];
    foreach ($expected as $table => $want) {
        $stmt = $pdo->query('SELECT COUNT(*) AS c FROM `' . $table . '`');
        $counts[$table] = (int) $stmt->fetch()['c'];
    }
    $ok = true;
    foreach ($expected as $table => $want) {
        if ($counts[$table] < $want) { $ok = false; break; }
    }
    // Foreign-key sanity: every product must resolve to a category.
    $orphans = (int) $pdo->query('SELECT COUNT(*) AS c FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE c.id IS NULL')->fetch()['c'];
    if ($orphans !== 0) { $ok = false; }
    http_response_code($ok ? 200 : 500);
    echo json_encode([
        'status' => $ok ? 'ok' : 'degraded',
        'phase' => 'backend-phase-11',
        'php' => PHP_VERSION,
        'db' => $pdo->query('SELECT VERSION() AS v')->fetch()['v'],
        'base_url' => nova_base_url(),
        'counts' => $counts,
        'expected_minimums' => $expected,
        'orphan_products' => $orphans,
        'settings_source' => 'database-with-config-fallback',
    ], JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    error_log('[NOVA health] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'phase' => 'backend-phase-1']);
}
