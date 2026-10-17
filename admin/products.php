<?php
/**
 * NOVA Home - admin/products.php (Phase 6/8).
 * Redesigned product catalog management interface.
 * Server-side MySQL reads with validated GET filters (q, cat, status, sort whitelist)
 * and POST+CSRF active/inactive toggle. Products are never deleted to preserve order integrity.
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once NOVA_ROOT . '/includes/admin-auth.php';
require_admin(false);
$admin = nova_admin_user();
$pdo = nova_pdo();

/* ----------------------------- toggle (POST) ----------------------------- */
if (is_post()) {
    if (!nova_verify_csrf($_POST['csrf_token'] ?? null)) {
        redirect('admin/products.php?err=csrf');
    }
    if (($_POST['action'] ?? '') === 'toggle') {
        $tid = v_int_range($_POST['id'] ?? null, 1, 1000000);
        if ($tid === null) {
            redirect('admin/products.php?err=not_found');
        }
        try {
            $upd = $pdo->prepare('UPDATE `products` SET `active` = 1 - `active` WHERE `id` = :id');
            $upd->execute([':id' => $tid]);
            redirect('admin/products.php?ok=toggled');
        } catch (PDOException $pe) {
            error_log('[NOVA admin/products toggle] ' . $pe->getMessage());
            redirect('admin/products.php?err=invalid');
        }
    }
    redirect('admin/products.php?err=invalid');
}

/* -------------------------- validated GET filters ------------------------ */
$q = isset($_GET['q']) ? trim((string) $_GET['q']) : '';
if (mb_strlen($q, 'UTF-8') > 60) {
    $q = mb_substr($q, 0, 60, 'UTF-8');
}
$catFilter = strtolower(trim((string) ($_GET['cat'] ?? 'all')));
if ($catFilter !== 'all' && !v_slug($catFilter)) {
    $catFilter = 'all';
}
$statusFilter = (string) ($_GET['status'] ?? 'all');
if (!in_array($statusFilter, ['all', 'active', 'inactive'], true)) {
    $statusFilter = 'all';
}
$sort = (string) ($_GET['sort'] ?? 'name');
$sortSql = [
    'name'       => 'p.`name` ASC',
    'price_asc'  => 'p.`price` ASC',
    'price_desc' => 'p.`price` DESC',
    'new'        => 'p.`is_new` DESC, p.`name` ASC',
][$sort] ?? 'p.`name` ASC';

$sql = 'SELECT p.`id`, p.`slug`, p.`name`, p.`price`, p.`old_price`, p.`rating`, p.`reviews_count`, p.`is_new`, p.`is_best`, p.`active`, c.`slug` AS `cat_slug`, c.`name` AS `cat_name`,'
     . ' (SELECT pi.`image_path` FROM `product_images` pi WHERE pi.`product_id` = p.`id` ORDER BY pi.`sort_order` ASC LIMIT 1) AS `image_path`'
     . ' FROM `products` p INNER JOIN `categories` c ON c.`id` = p.`category_id` WHERE 1 = 1';
$params = [];
if ($q !== '') {
    $sql .= ' AND (p.`name` LIKE :q1 OR p.`slug` LIKE :q2)';
    $params[':q1'] = '%' . $q . '%';
    $params[':q2'] = '%' . $q . '%';
}
if ($catFilter !== 'all') {
    $sql .= ' AND c.`slug` = :cat';
    $params[':cat'] = $catFilter;
}
if ($statusFilter === 'active') {
    $sql .= ' AND p.`active` = 1';
} elseif ($statusFilter === 'inactive') {
    $sql .= ' AND p.`active` = 0';
}
$sql .= ' ORDER BY ' . $sortSql;
$stmt = $pdo->prepare($sql);
foreach ($params as $k => $v) {
    $stmt->bindValue($k, $v, PDO::PARAM_STR);
}
$stmt->execute();
$products = $stmt->fetchAll();
$allCategories = $pdo->query('SELECT `slug`, `name` FROM `categories` ORDER BY `sort_order` ASC, `name` ASC')->fetchAll();

$flashes = [
    'toggled'   => ['success', 'Product visibility status updated successfully.'],
    'created'   => ['success', 'New product created and saved to database.'],
    'updated'   => ['success', 'Product changes saved successfully.'],
    'csrf'      => ['danger', 'Your session expired. Please refresh and try again.'],
    'not_found' => ['danger', 'Requested product could not be found.'],
    'invalid'   => ['danger', 'Unable to update product.'],
    'saved'     => ['success', 'Product saved.'],
];
$flash = $flashes[(string) ($_GET['err'] ?? '')] ?? $flashes[(string) ($_GET['ok'] ?? '')] ?? null;

$adminTitle = 'Products | NOVA Admin';
$adminNav = 'products';
require __DIR__ . '/../includes/admin-head.php';
?>

<!-- Header -->
<div class="d-flex flex-wrap gap-3 align-items-center justify-content-between mb-4">
  <div>
    <h1 class="h3 fw-semibold mb-1">Products</h1>
    <p class="text-muted-nova mb-0 small">Manage furniture and home decor catalog items, pricing, specs, and shop visibility.</p>
  </div>
  <a class="btn btn-nova btn-sm d-inline-flex align-items-center gap-1 shadow-sm" href="product-form.php">
    <i class="bi bi-plus-lg" aria-hidden="true"></i>
    <span>Add Product</span>
  </a>
</div>

<?php if ($flash): ?>
<div class="alert alert-<?= e($flash[0]) ?> alert-dismissible fade show d-flex align-items-center gap-2 mb-4" role="alert">
  <i class="bi <?= $flash[0] === 'success' ? 'bi-check-circle-fill text-success' : 'bi-exclamation-triangle-fill text-danger' ?>"></i>
  <div><?= e($flash[1]) ?></div>
  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
</div>
<?php endif; ?>

<!-- Filter & Search Bar -->
<form class="admin-filter-bar mb-4" method="get" action="products.php">
  <div class="input-group" style="min-width: 220px; flex: 1 1 220px;">
    <span class="input-group-text bg-white border-end-0 text-muted-nova"><i class="bi bi-search"></i></span>
    <input class="form-control border-start-0 ps-0" id="ap-q" name="q" type="search" placeholder="Search product name or slug…" value="<?= e($q) ?>">
  </div>

  <div style="min-width: 170px; flex: 0 1 180px;">
    <select class="form-select" id="ap-cat" name="cat" aria-label="Filter by category">
      <option value="all">All Categories</option>
<?php foreach ($allCategories as $c): ?>
      <option value="<?= e((string) $c['slug']) ?>"<?= $catFilter === $c['slug'] ? ' selected' : '' ?>><?= e((string) $c['name']) ?></option>
<?php endforeach; ?>
    </select>
  </div>

  <div style="min-width: 140px; flex: 0 1 150px;">
    <select class="form-select" id="ap-status" name="status" aria-label="Filter by status">
<?php foreach (['all' => 'All Statuses', 'active' => 'Active Only', 'inactive' => 'Inactive Only'] as $k => $lbl): ?>
      <option value="<?= e($k) ?>"<?= $statusFilter === $k ? ' selected' : '' ?>><?= e($lbl) ?></option>
<?php endforeach; ?>
    </select>
  </div>

  <div style="min-width: 170px; flex: 0 1 180px;">
    <select class="form-select" id="ap-sort" name="sort" aria-label="Sort products">
<?php foreach (['name' => 'Name (A to Z)', 'price_asc' => 'Price: Low to High', 'price_desc' => 'Price: High to Low', 'new' => 'New Arrivals First'] as $k => $lbl): ?>
      <option value="<?= e($k) ?>"<?= $sort === $k ? ' selected' : '' ?>><?= e($lbl) ?></option>
<?php endforeach; ?>
    </select>
  </div>

  <div class="d-flex align-items-center gap-2">
    <button class="btn btn-nova btn-sm px-3" type="submit">Apply</button>
    <?php if ($q !== '' || $catFilter !== 'all' || $statusFilter !== 'all' || $sort !== 'name'): ?>
    <a class="btn btn-ghost btn-sm" href="products.php" title="Clear filters">Reset</a>
    <?php endif; ?>
  </div>
</form>

<!-- Products Table Wrap -->
<div class="admin-table-wrap">
  <div class="p-3 border-bottom d-flex justify-content-between align-items-center">
    <span class="small text-muted-nova">Showing <strong><?= count($products) ?></strong> product<?= count($products) === 1 ? '' : 's' ?></span>
    <span class="small text-muted-nova">Click <em>Deactivate</em> to hide from shop without breaking order records</span>
  </div>

  <div class="table-responsive">
    <table class="table align-middle m-0">
      <thead>
        <tr>
          <th scope="col" style="min-width: 260px;">Product</th>
          <th scope="col">Category</th>
          <th scope="col">Price</th>
          <th scope="col">Rating</th>
          <th scope="col">Badges</th>
          <th scope="col">Visibility</th>
          <th scope="col" class="text-end" style="min-width: 160px;">Actions</th>
        </tr>
      </thead>
      <tbody>
<?php foreach ($products as $p): ?>
  <?php
    $pImg = (string) ($p['image_path'] ?? '');
    $pSrc = $pImg !== '' ? '../' . ltrim($pImg, '/') : '../assets/images/hero.svg';
  ?>
        <tr>
          <td>
            <div class="d-flex align-items-center gap-3">
              <img class="admin-prod-thumb" src="<?= e($pSrc) ?>" width="44" height="44" alt="" loading="lazy">
              <div class="overflow-hidden">
                <a href="product-form.php?id=<?= e((string) $p['slug']) ?>" class="fw-semibold text-decoration-none text-dark d-block text-truncate" title="<?= e((string) $p['name']) ?>">
                  <?= e((string) $p['name']) ?>
                </a>
                <span class="text-muted-nova small" style="font-size: 0.78rem; font-family: monospace;"><?= e((string) $p['slug']) ?></span>
              </div>
            </div>
          </td>
          <td><span class="badge bg-light text-dark border"><?= e((string) $p['cat_name']) ?></span></td>
          <td>
            <div class="fw-semibold"><?= e(nova_money((int) $p['price'])) ?></div>
            <?php if ($p['old_price'] !== null): ?>
            <span class="small text-muted-nova text-decoration-line-through" style="font-size: 0.78rem;"><?= e(nova_money((int) $p['old_price'])) ?></span>
            <?php endif; ?>
          </td>
          <td>
            <div class="d-flex align-items-center gap-1">
              <i class="bi bi-star-fill text-warning small"></i>
              <span class="fw-medium small"><?= e((string) $p['rating']) ?></span>
              <span class="text-muted-nova small" style="font-size: 0.75rem;">(<?= e((string) $p['reviews_count']) ?>)</span>
            </div>
          </td>
          <td>
            <div class="d-flex flex-wrap gap-1">
              <?php if ((int) $p['is_new'] === 1): ?><span class="badge bg-info-subtle text-info-emphasis border border-info-subtle">New</span><?php endif; ?>
              <?php if ((int) $p['is_best'] === 1): ?><span class="badge bg-success-subtle text-success-emphasis border border-success-subtle">Best</span><?php endif; ?>
              <?php if ((int) $p['is_new'] === 0 && (int) $p['is_best'] === 0): ?><span class="text-muted small">—</span><?php endif; ?>
            </div>
          </td>
          <td>
            <?php if ((int) $p['active'] === 1): ?>
              <span class="status status--active"><i class="bi bi-check-circle me-1"></i>Active</span>
            <?php else: ?>
              <span class="status status--inactive"><i class="bi bi-eye-slash me-1"></i>Inactive</span>
            <?php endif; ?>
          </td>
          <td class="text-end">
            <div class="d-inline-flex align-items-center gap-1">
              <a class="btn btn-ghost btn-sm" href="product-form.php?id=<?= e((string) $p['slug']) ?>" title="Edit product">
                <i class="bi bi-pencil me-1"></i>Edit
              </a>
              <form method="post" action="products.php" class="m-0 d-inline">
                <input type="hidden" name="csrf_token" value="<?= e(nova_csrf_token()) ?>">
                <input type="hidden" name="action" value="toggle">
                <input type="hidden" name="id" value="<?= e((string) $p['id']) ?>">
                <?php if ((int) $p['active'] === 1): ?>
                  <button class="btn btn-outline-secondary btn-sm" type="submit" title="Hide from storefront">Deactivate</button>
                <?php else: ?>
                  <button class="btn btn-outline-success btn-sm" type="submit" title="Publish to storefront">Activate</button>
                <?php endif; ?>
              </form>
            </div>
          </td>
        </tr>
<?php endforeach; ?>
<?php if (!$products): ?>
        <tr>
          <td colspan="7" class="text-center py-5 text-muted-nova">
            <i class="bi bi-search fs-3 d-block mb-2"></i>
            <p class="mb-2">No products found matching the selected filters.</p>
            <a class="btn btn-ghost btn-sm" href="products.php">Clear Filters</a>
          </td>
        </tr>
<?php endif; ?>
      </tbody>
    </table>
  </div>
</div>

<?php require __DIR__ . '/../includes/admin-foot.php'; ?>
