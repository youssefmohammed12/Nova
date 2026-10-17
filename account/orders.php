<?php
/** NOVA Home - account/orders.php (Phase 10). Customer order history.
 * Ownership enforced IN SQL: WHERE customer_id = session customer id
 * (nova_customer_user() re-checks MySQL). Newest first, plain list (tiny
 * dataset, no pagination). Guest orders (customer_id NULL) never appear.
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once NOVA_ROOT . '/includes/customer-auth.php';
require_customer(false);
$me = nova_customer_user();
$rows = [];
try {
    $stmt = nova_pdo()->prepare(
        'SELECT o.`order_ref`, o.`status`, o.`total`, o.`created_at`,'
        . ' (SELECT COUNT(*) FROM `order_items` oi WHERE oi.`order_id` = o.`id`) AS `item_count`'
        . ' FROM `orders` o WHERE o.`customer_id` = :me'
        . ' ORDER BY o.`created_at` DESC, o.`id` DESC'
    );
    $stmt->execute([':me' => $me['id']]);
    $rows = $stmt->fetchAll();
} catch (Throwable $e) {
    error_log('[NOVA account/orders] ' . $e->getMessage());
}
$accountNav = 'orders';
$pageTitle = 'Orders | NOVA Home';
$fmtDate = static function (string $dt): string { return date('d M Y', strtotime($dt)); };
$badge = static function (string $s): string {
    return '<span class="status status--' . e($s) . '">' . e(ucfirst($s)) . '</span>';
};
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= e($pageTitle) ?></title>
<meta name="robots" content="noindex, nofollow">
<link rel="icon" type="image/svg+xml" href="../favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Newsreader:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css" rel="stylesheet">
<link rel="stylesheet" href="../css/variables.css">
<link rel="stylesheet" href="../css/base.css">
<link rel="stylesheet" href="../css/components.css">
<link rel="stylesheet" href="../css/pages.css">
<link rel="stylesheet" href="../css/responsive.css">
</head>
<body data-page="account-orders">
<a class="skip-link" href="#main">Skip to content</a>
<div id="site-header"></div>
<main id="main"><div class="container pb-5">
  <div class="page-head account-head"><nav aria-label="Breadcrumb"><ol class="breadcrumb"><li class="breadcrumb-item"><a href="../index.html">Home</a></li><li class="breadcrumb-item"><a href="index.php">My account</a></li><li class="breadcrumb-item active" aria-current="page">Orders</li></ol></nav><p class="eyebrow">My shopping space</p><h1>Orders</h1><p class="text-muted-nova mb-0">Your order history, newest first.</p></div>
  <div class="account-layout">
    <?php require __DIR__ . '/../includes/account-side.php'; ?>
    <div class="account-main">
<?php if (!$rows): ?>
      <div class="account-card text-center py-5">
        <div class="account-avatar mx-auto mb-3" style="width: 56px; height: 56px; font-size: 1.5rem;">
          <i class="bi bi-box-seam" aria-hidden="true"></i>
        </div>
        <h2 class="h5 mb-2">No orders placed yet</h2>
        <p class="text-muted-nova small mb-3">When you purchase furniture and home decor while signed in, your order status and receipts will be tracked here.</p>
        <a class="btn btn-nova" href="../shop.html">Start shopping</a>
      </div>
<?php else: ?>
      <!-- Desktop orders table -->
      <div class="table-card table-card--orders mb-4">
        <table class="table align-middle m-0">
          <thead>
            <tr>
              <th scope="col">Order Ref</th>
              <th scope="col">Date</th>
              <th scope="col">Items</th>
              <th scope="col">Total</th>
              <th scope="col">Status</th>
              <th scope="col" class="text-end"><span class="visually-hidden">Action</span></th>
            </tr>
          </thead>
          <tbody>
<?php foreach ($rows as $r): ?>
            <tr>
              <td><strong class="font-monospace">#<?= e((string) $r['order_ref']) ?></strong></td>
              <td><?= e($fmtDate((string) $r['created_at'])) ?></td>
              <td><?= e((string) $r['item_count']) ?> <?= (int)$r['item_count'] === 1 ? 'item' : 'items' ?></td>
              <td><strong><?= e(nova_money((int) $r['total'])) ?></strong></td>
              <td><?= $badge((string) $r['status']) ?></td>
              <td class="text-end"><a class="btn btn-ghost btn-sm" href="order.php?ref=<?= e((string) $r['order_ref']) ?>">View details &rarr;</a></td>
            </tr>
<?php endforeach; ?>
          </tbody>
        </table>
      </div>

      <!-- Mobile orders list -->
      <div class="order-mobile-list mb-4">
<?php foreach ($rows as $r): ?>
        <div class="order-mobile-card">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="font-monospace fw-semibold small">#<?= e((string) $r['order_ref']) ?></span>
            <?= $badge((string) $r['status']) ?>
          </div>
          <div class="text-muted-nova small mb-2">
            <span><?= e($fmtDate((string) $r['created_at'])) ?></span> &bull;
            <span><?= e((string) $r['item_count']) ?> <?= (int)$r['item_count'] === 1 ? 'item' : 'items' ?></span>
          </div>
          <div class="d-flex justify-content-between align-items-center pt-2 border-top">
            <span class="fw-semibold"><?= e(nova_money((int) $r['total'])) ?></span>
            <a class="btn btn-ghost btn-sm" href="order.php?ref=<?= e((string) $r['order_ref']) ?>">View details &rarr;</a>
          </div>
        </div>
<?php endforeach; ?>
      </div>
<?php endif; ?>
    </div>
  </div>
</div></main>
<div id="site-footer"></div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
<script src="../js/products.js"></script>
<script src="../js/settings.js"></script>
<script src="../js/catalog.js"></script>
<script src="../js/cart.js"></script>
<script src="../js/ui.js"></script>
<script src="../js/main.js"></script>
</body>
</html>
