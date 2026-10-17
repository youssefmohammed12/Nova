<?php
/**
 * NOVA Home - admin/index.php (Phase 6/8).
 * Redesigned administrative dashboard with real live MySQL metrics,
 * recent orders overview, and quick catalog management shortcuts.
 * No fake demo data or unbacked decorative charts.
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once NOVA_ROOT . '/includes/admin-auth.php';
require_admin(false);
$admin = nova_admin_user();
$pdo = nova_pdo();

$productCount       = (int) $pdo->query('SELECT COUNT(*) FROM `products`')->fetchColumn();
$activeProductCount = (int) $pdo->query('SELECT COUNT(*) FROM `products` WHERE `active` = 1')->fetchColumn();
$categoryCount      = (int) $pdo->query('SELECT COUNT(*) FROM `categories`')->fetchColumn();
$orderCount         = (int) $pdo->query('SELECT COUNT(*) FROM `orders`')->fetchColumn();
$pendingCount       = (int) $pdo->query("SELECT COUNT(*) FROM `orders` WHERE `status` = 'pending'")->fetchColumn();

$recentOrders = $pdo->query(
    'SELECT `order_ref`, `customer_name`, `total`, `status`, `created_at`'
    . ' FROM `orders` ORDER BY `id` DESC LIMIT 6'
)->fetchAll();

$adminTitle = 'Dashboard | NOVA Admin';
$adminNav = 'dashboard';
require __DIR__ . '/../includes/admin-head.php';
?>

<!-- Header Banner -->
<div class="d-flex flex-wrap gap-3 align-items-center justify-content-between mb-4">
  <div>
    <h1 class="h3 fw-semibold mb-1">Dashboard</h1>
    <p class="text-muted-nova mb-0 small">Live catalog overview, order fulfillment status, and store controls.</p>
  </div>
  <div class="d-flex align-items-center gap-2">
    <a class="btn btn-nova btn-sm d-inline-flex align-items-center gap-1 shadow-sm" href="product-form.php">
      <i class="bi bi-plus-lg" aria-hidden="true"></i>
      <span>Add Product</span>
    </a>
    <a class="btn btn-ghost btn-sm d-inline-flex align-items-center gap-1" href="orders.php">
      <i class="bi bi-receipt" aria-hidden="true"></i>
      <span>Manage Orders</span>
    </a>
  </div>
</div>

<!-- Metrics Grid -->
<div class="admin-metrics mb-4">
  <a href="products.php" class="admin-metric-card">
    <div class="admin-metric-card__head">
      <span class="admin-metric-card__label">Total Products</span>
      <div class="admin-metric-card__icon"><i class="bi bi-box-seam"></i></div>
    </div>
    <div>
      <div class="admin-metric-card__num"><?= e((string) $productCount) ?></div>
      <p class="admin-metric-card__sub"><?= e((string) $activeProductCount) ?> active in storefront</p>
    </div>
  </a>

  <a href="categories.php" class="admin-metric-card">
    <div class="admin-metric-card__head">
      <span class="admin-metric-card__label">Categories</span>
      <div class="admin-metric-card__icon"><i class="bi bi-tags"></i></div>
    </div>
    <div>
      <div class="admin-metric-card__num"><?= e((string) $categoryCount) ?></div>
      <p class="admin-metric-card__sub">Organized product taxonomy</p>
    </div>
  </a>

  <a href="orders.php" class="admin-metric-card">
    <div class="admin-metric-card__head">
      <span class="admin-metric-card__label">Total Orders</span>
      <div class="admin-metric-card__icon"><i class="bi bi-receipt"></i></div>
    </div>
    <div>
      <div class="admin-metric-card__num"><?= e((string) $orderCount) ?></div>
      <p class="admin-metric-card__sub">Lifetime recorded orders</p>
    </div>
  </a>

  <a href="orders.php?status=pending" class="admin-metric-card" style="<?= $pendingCount > 0 ? 'border-left: 3px solid #D97706;' : '' ?>">
    <div class="admin-metric-card__head">
      <span class="admin-metric-card__label">Pending Orders</span>
      <div class="admin-metric-card__icon" style="background: rgba(217, 119, 6, 0.1); color: #B45309;"><i class="bi bi-clock-history"></i></div>
    </div>
    <div>
      <div class="admin-metric-card__num"><?= e((string) $pendingCount) ?></div>
      <p class="admin-metric-card__sub"><?= $pendingCount > 0 ? 'Needs order confirmation' : 'All orders processed' ?></p>
    </div>
  </a>
</div>

<!-- Main Dashboard Grid -->
<div class="row g-4">
  <!-- Recent Orders Column -->
  <div class="col-lg-8">
    <div class="admin-table-wrap">
      <div class="p-3 border-bottom d-flex justify-content-between align-items-center">
        <div>
          <h2 class="admin-card-title h6 mb-0"><i class="bi bi-receipt-cutoff"></i> Recent Orders</h2>
        </div>
        <a class="btn btn-ghost btn-sm py-1 px-2" href="orders.php">
          View all orders <i class="bi bi-arrow-right ms-1"></i>
        </a>
      </div>
      <table class="table align-middle m-0">
        <thead>
          <tr>
            <th scope="col">Order Ref</th>
            <th scope="col">Customer</th>
            <th scope="col">Total</th>
            <th scope="col">Status</th>
            <th scope="col" class="text-end">Action</th>
          </tr>
        </thead>
        <tbody>
<?php if ($recentOrders): ?>
<?php foreach ($recentOrders as $o): ?>
          <tr>
            <td>
              <a href="order.php?ref=<?= e((string) $o['order_ref']) ?>" class="fw-medium text-decoration-none">
                <?= e((string) $o['order_ref']) ?>
              </a>
            </td>
            <td>
              <div class="fw-medium"><?= e((string) $o['customer_name']) ?></div>
              <div class="text-muted-nova small" style="font-size: 0.75rem;"><?= date('M j, Y', strtotime((string) $o['created_at'])) ?></div>
            </td>
            <td><strong><?= e(nova_money((int) $o['total'])) ?></strong></td>
            <td>
              <span class="status status--<?= e((string) $o['status']) ?>">
                <?= e(ucfirst((string) $o['status'])) ?>
              </span>
            </td>
            <td class="text-end">
              <a class="btn btn-ghost btn-sm" href="order.php?ref=<?= e((string) $o['order_ref']) ?>">Details</a>
            </td>
          </tr>
<?php endforeach; ?>
<?php else: ?>
          <tr><td colspan="5" class="text-muted-nova p-4 text-center">No orders recorded yet.</td></tr>
<?php endif; ?>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Store Shortcuts & System Status -->
  <div class="col-lg-4">
    <div class="admin-card mb-4">
      <div class="admin-card-header">
        <h2 class="admin-card-title h6"><i class="bi bi-lightning-charge"></i> Quick Actions</h2>
      </div>
      <div class="d-flex flex-column gap-2">
        <a href="product-form.php" class="btn btn-outline-secondary text-start d-flex align-items-center justify-content-between p-2">
          <span class="d-flex align-items-center gap-2"><i class="bi bi-box-seam text-terracotta"></i> Create New Product</span>
          <i class="bi bi-chevron-right small text-muted"></i>
        </a>
        <a href="categories.php?form=new" class="btn btn-outline-secondary text-start d-flex align-items-center justify-content-between p-2">
          <span class="d-flex align-items-center gap-2"><i class="bi bi-tags text-terracotta"></i> Add New Category</span>
          <i class="bi bi-chevron-right small text-muted"></i>
        </a>
        <a href="orders.php?status=pending" class="btn btn-outline-secondary text-start d-flex align-items-center justify-content-between p-2">
          <span class="d-flex align-items-center gap-2"><i class="bi bi-hourglass-split text-terracotta"></i> Review Pending Orders</span>
          <span class="badge bg-warning text-dark"><?= e((string) $pendingCount) ?></span>
        </a>
        <a href="settings.php" class="btn btn-outline-secondary text-start d-flex align-items-center justify-content-between p-2">
          <span class="d-flex align-items-center gap-2"><i class="bi bi-gear text-terracotta"></i> Store Delivery Settings</span>
          <i class="bi bi-chevron-right small text-muted"></i>
        </a>
      </div>
    </div>

    <div class="admin-card">
      <div class="admin-card-header">
        <h2 class="admin-card-title h6"><i class="bi bi-info-circle"></i> Catalog Health</h2>
      </div>
      <ul class="list-unstyled mb-0 d-flex flex-column gap-2 small">
        <li class="d-flex justify-content-between align-items-center py-1 border-bottom">
          <span class="text-muted-nova">Active Products Ratio</span>
          <span class="fw-semibold"><?= e((string) $activeProductCount) ?> / <?= e((string) $productCount) ?> (<?= $productCount > 0 ? round(($activeProductCount / $productCount) * 100) : 0 ?>%)</span>
        </li>
        <li class="d-flex justify-content-between align-items-center py-1 border-bottom">
          <span class="text-muted-nova">Taxonomy Depth</span>
          <span class="fw-semibold"><?= e((string) $categoryCount) ?> categories</span>
        </li>
        <li class="d-flex justify-content-between align-items-center py-1">
          <span class="text-muted-nova">Store Environment</span>
          <span class="badge bg-success-subtle text-success">Production / Live</span>
        </li>
      </ul>
    </div>
  </div>
</div>

<?php require __DIR__ . '/../includes/admin-foot.php'; ?>
