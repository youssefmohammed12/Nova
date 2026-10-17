<?php
/**
 * NOVA Home - admin/orders.php (Phase 7/8).
 * Redesigned order management interface.
 * Validated GET filters (q, status, sort), responsive desktop table + mobile cards,
 * with status badges and deep order reference links.
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once NOVA_ROOT . '/includes/admin-auth.php';
require_admin(false);
$admin = nova_admin_user();
$pdo = nova_pdo();

/* ------------------------------ validated GET ---------------------------- */
$q = isset($_GET['q']) ? trim((string) $_GET['q']) : '';
if (mb_strlen($q, 'UTF-8') > 60) {
    $q = mb_substr($q, 0, 60, 'UTF-8');
}
$validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
$status = (string) ($_GET['status'] ?? 'all');
if ($status !== 'all' && !in_array($status, $validStatuses, true)) {
    $status = 'all';
}
$sort = (string) ($_GET['sort'] ?? 'newest');
$sortSql = ($sort === 'oldest') ? 'o.`created_at` ASC' : 'o.`created_at` DESC';

$sql = 'SELECT o.`id`, o.`order_ref`, o.`customer_name`, o.`phone`, o.`city`, o.`total`,
 o.`payment_method`, o.`status`, o.`created_at`,
 (SELECT COUNT(*) FROM `order_items` oi WHERE oi.`order_id` = o.`id`) AS `item_count`
 FROM `orders` o WHERE 1 = 1';
$params = [];
if ($q !== '') {
    $sql .= ' AND (o.`order_ref` LIKE :q1 OR o.`customer_name` LIKE :q2)';
    $params[':q1'] = '%' . $q . '%';
    $params[':q2'] = '%' . $q . '%';
}
if ($status !== 'all') {
    $sql .= ' AND o.`status` = :status';
    $params[':status'] = $status;
}
$sql .= ' ORDER BY ' . $sortSql;
$stmt = $pdo->prepare($sql);
foreach ($params as $k => $v) {
    $stmt->bindValue($k, $v, PDO::PARAM_STR);
}
$stmt->execute();
$orders = $stmt->fetchAll();

$flashes = [
    'status'         => ['success', 'Order status updated successfully.'],
    'csrf'           => ['danger', 'Your session expired. Please refresh and try again.'],
    'not_found'      => ['danger', 'Order not found.'],
    'invalid_status' => ['danger', 'That status change is not allowed according to the workflow.'],
    'invalid'        => ['danger', 'Unable to update the order.'],
];
$flash = $flashes[(string) ($_GET['err'] ?? '')] ?? $flashes[(string) ($_GET['ok'] ?? '')] ?? null;

$adminTitle = 'Orders | NOVA Admin';
$adminNav = 'orders';
require __DIR__ . '/../includes/admin-head.php';

$fmtDate = static function (string $dt): string {
    return date('M j, Y \a\t g:i A', strtotime($dt));
};
$fmtDateShort = static function (string $dt): string {
    return date('d M Y', strtotime($dt));
};
$badge = static function (string $s): string {
    return '<span class="status status--' . e($s) . '">' . e(ucfirst($s)) . '</span>';
};
?>

<!-- Header -->
<div class="d-flex flex-wrap gap-3 align-items-center justify-content-between mb-4">
  <div>
    <h1 class="h3 fw-semibold mb-1">Orders</h1>
    <p class="text-muted-nova mb-0 small">Fulfillment tracking, customer delivery addresses, and authoritative order records.</p>
  </div>
</div>

<?php if ($flash): ?>
<div class="alert alert-<?= e($flash[0]) ?> alert-dismissible fade show d-flex align-items-center gap-2 mb-4" role="alert">
  <i class="bi <?= $flash[0] === 'success' ? 'bi-check-circle-fill text-success' : 'bi-exclamation-triangle-fill text-danger' ?>"></i>
  <div><?= e($flash[1]) ?></div>
  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
</div>
<?php endif; ?>

<!-- Filter Bar -->
<form class="admin-filter-bar mb-4" method="get" action="orders.php">
  <div class="input-group" style="min-width: 220px; flex: 1 1 220px;">
    <span class="input-group-text bg-white border-end-0 text-muted-nova"><i class="bi bi-search"></i></span>
    <input class="form-control border-start-0 ps-0" id="o-q" name="q" type="search" placeholder="Search order reference or customer name…" value="<?= e($q) ?>">
  </div>

  <div style="min-width: 170px; flex: 0 1 180px;">
    <select class="form-select" id="o-status" name="status" aria-label="Filter by status">
      <option value="all">All Statuses</option>
<?php foreach ($validStatuses as $s): ?>
      <option value="<?= e($s) ?>"<?= $status === $s ? ' selected' : '' ?>><?= e(ucfirst($s)) ?></option>
<?php endforeach; ?>
    </select>
  </div>

  <div style="min-width: 160px; flex: 0 1 170px;">
    <select class="form-select" id="o-sort" name="sort" aria-label="Sort orders">
      <option value="newest"<?= $sort === 'newest' ? ' selected' : '' ?>>Newest First</option>
      <option value="oldest"<?= $sort === 'oldest' ? ' selected' : '' ?>>Oldest First</option>
    </select>
  </div>

  <div class="d-flex align-items-center gap-2">
    <button class="btn btn-nova btn-sm px-3" type="submit">Apply</button>
    <?php if ($q !== '' || $status !== 'all' || $sort !== 'newest'): ?>
    <a class="btn btn-ghost btn-sm" href="orders.php" title="Clear filters">Reset</a>
    <?php endif; ?>
  </div>
</form>

<!-- Desktop Orders Table -->
<div class="admin-table-wrap d-none d-md-block">
  <div class="p-3 border-bottom d-flex justify-content-between align-items-center">
    <span class="small text-muted-nova">Showing <strong><?= count($orders) ?></strong> order<?= count($orders) === 1 ? '' : 's' ?></span>
    <span class="small text-muted-nova">Click order ref to view full details and update fulfillment status</span>
  </div>

  <div class="table-responsive">
    <table class="table align-middle m-0">
      <thead>
        <tr>
          <th scope="col" style="min-width: 170px;">Reference</th>
          <th scope="col" style="min-width: 180px;">Customer</th>
          <th scope="col">Phone</th>
          <th scope="col">City</th>
          <th scope="col">Date</th>
          <th scope="col" class="text-center">Items</th>
          <th scope="col">Total</th>
          <th scope="col">Status</th>
          <th scope="col" class="text-end">Action</th>
        </tr>
      </thead>
      <tbody>
<?php foreach ($orders as $o): ?>
        <tr>
          <td>
            <a href="order.php?ref=<?= e((string) $o['order_ref']) ?>" class="fw-semibold text-decoration-none" style="font-family: monospace;">
              <?= e((string) $o['order_ref']) ?>
            </a>
          </td>
          <td>
            <div class="fw-medium"><?= e((string) $o['customer_name']) ?></div>
          </td>
          <td><span class="small text-muted-nova"><?= e((string) $o['phone']) ?></span></td>
          <td><span class="badge bg-light text-dark border"><?= e((string) $o['city']) ?></span></td>
          <td><span class="small text-muted-nova"><?= e($fmtDateShort((string) $o['created_at'])) ?></span></td>
          <td class="text-center"><span class="badge bg-secondary-subtle text-secondary-emphasis"><?= e((string) $o['item_count']) ?></span></td>
          <td><strong><?= e(nova_money((int) $o['total'])) ?></strong></td>
          <td><?= $badge((string) $o['status']) ?></td>
          <td class="text-end">
            <a class="btn btn-ghost btn-sm" href="order.php?ref=<?= e((string) $o['order_ref']) ?>">Details</a>
          </td>
        </tr>
<?php endforeach; ?>
<?php if (!$orders): ?>
        <tr><td colspan="9" class="text-center py-5 text-muted-nova">No orders match your criteria.</td></tr>
<?php endif; ?>
      </tbody>
    </table>
  </div>
</div>

<!-- Mobile Order Cards -->
<div class="d-md-none d-grid gap-3">
<?php foreach ($orders as $o): ?>
  <article class="admin-card">
    <div class="d-flex justify-content-between align-items-start mb-2">
      <div>
        <a href="order.php?ref=<?= e((string) $o['order_ref']) ?>" class="fw-bold text-decoration-none" style="font-family: monospace; font-size: 0.95rem;">
          <?= e((string) $o['order_ref']) ?>
        </a>
        <div class="text-muted-nova small" style="font-size: 0.75rem;"><?= e($fmtDate((string) $o['created_at'])) ?></div>
      </div>
      <div><?= $badge((string) $o['status']) ?></div>
    </div>

    <div class="py-2 border-top border-bottom my-2 small">
      <div class="d-flex justify-content-between mb-1">
        <span class="text-muted-nova">Customer</span>
        <span class="fw-medium"><?= e((string) $o['customer_name']) ?></span>
      </div>
      <div class="d-flex justify-content-between mb-1">
        <span class="text-muted-nova">Phone</span>
        <span><?= e((string) $o['phone']) ?></span>
      </div>
      <div class="d-flex justify-content-between mb-1">
        <span class="text-muted-nova">Location</span>
        <span><?= e((string) $o['city']) ?></span>
      </div>
      <div class="d-flex justify-content-between">
        <span class="text-muted-nova">Total (<?= e((string) $o['item_count']) ?> items)</span>
        <strong class="text-dark"><?= e(nova_money((int) $o['total'])) ?></strong>
      </div>
    </div>

    <div class="d-flex justify-content-end">
      <a class="btn btn-nova btn-sm w-100" href="order.php?ref=<?= e((string) $o['order_ref']) ?>">View Order Details</a>
    </div>
  </article>
<?php endforeach; ?>
<?php if (!$orders): ?>
  <div class="admin-card text-center py-4 text-muted-nova">No orders match your criteria.</div>
<?php endif; ?>
</div>

<?php require __DIR__ . '/../includes/admin-foot.php'; ?>
