<?php
/**
 * NOVA Home - account/index.php (Customer Dashboard).
 * Protected customer area. Displays metrics (orders, addresses, wishlist),
 * latest order overview, profile/address quick views, and shopping prompt.
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once NOVA_ROOT . '/includes/customer-auth.php';
require_customer(false);

$me = nova_customer_user();
$accountNav = 'dashboard';
$pageTitle = 'Dashboard | NOVA Home';

$orderCount = 0;
$latestOrder = null;
try {
    $stmt = nova_pdo()->prepare(
        'SELECT `order_ref`, `status`, `total`, `created_at` FROM `orders` WHERE `customer_id` = :me ORDER BY `created_at` DESC, `id` DESC LIMIT 1'
    );
    $stmt->execute([':me' => $me['id']]);
    $latestOrder = $stmt->fetch();

    $stmt2 = nova_pdo()->prepare('SELECT COUNT(*) FROM `orders` WHERE `customer_id` = :me');
    $stmt2->execute([':me' => $me['id']]);
    $orderCount = (int) $stmt2->fetchColumn();
} catch (Throwable $e) {
    error_log('[NOVA account/dashboard orders] ' . $e->getMessage());
}

$addressCount = 0;
$defaultAddress = null;
try {
    $stmt = nova_pdo()->prepare(
        'SELECT `recipient_name`, `phone`, `city`, `address`, `apartment` FROM `customer_addresses` WHERE `customer_id` = :me ORDER BY `is_default` DESC, `id` ASC LIMIT 1'
    );
    $stmt->execute([':me' => $me['id']]);
    $defaultAddress = $stmt->fetch();

    $stmt2 = nova_pdo()->prepare('SELECT COUNT(*) FROM `customer_addresses` WHERE `customer_id` = :me');
    $stmt2->execute([':me' => $me['id']]);
    $addressCount = (int) $stmt2->fetchColumn();
} catch (Throwable $e) {
    error_log('[NOVA account/dashboard addresses] ' . $e->getMessage());
}
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
<body data-page="account">
<a class="skip-link" href="#main">Skip to content</a>
<div id="site-header"></div>
<main id="main"><div class="container pb-5">
  <div class="page-head account-head">
    <nav aria-label="Breadcrumb">
      <ol class="breadcrumb">
        <li class="breadcrumb-item"><a href="../index.html">Home</a></li>
        <li class="breadcrumb-item active" aria-current="page">Dashboard</li>
      </ol>
    </nav>
    <p class="eyebrow">Customer Account</p>
    <h1>Welcome, <?= e($me['name'] ?? 'Friend') ?></h1>
    <p class="text-muted-nova mb-0">Manage your orders, saved addresses, and profile details in one place.</p>
  </div>

  <div class="account-layout">
    <?php require __DIR__ . '/../includes/account-side.php'; ?>
    <div class="account-main">
      <!-- Metrics row -->
      <div class="account-metrics mb-4">
        <a href="orders.php" class="account-metric text-decoration-none">
          <div class="account-metric-num"><?= $orderCount ?></div>
          <div class="account-metric-label"><i class="bi bi-box-seam me-1" aria-hidden="true"></i>Orders placed</div>
        </a>
        <a href="addresses.php" class="account-metric text-decoration-none">
          <div class="account-metric-num"><?= $addressCount ?></div>
          <div class="account-metric-label"><i class="bi bi-geo-alt me-1" aria-hidden="true"></i>Saved addresses</div>
        </a>
        <a href="wishlist.html" class="account-metric text-decoration-none">
          <div class="account-metric-num" id="dashWishCount">0</div>
          <div class="account-metric-label"><i class="bi bi-heart me-1" aria-hidden="true"></i>Wishlist items</div>
        </a>
      </div>

      <!-- Recent order card -->
      <div class="account-card mb-4">
        <div class="account-card-header d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <h2 class="h5 mb-0"><i class="bi bi-clock-history me-2 text-primary" aria-hidden="true"></i>Recent Order</h2>
          <a href="orders.php" class="btn btn-ghost btn-sm">View all orders &rarr;</a>
        </div>
        <?php if ($latestOrder): ?>
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <div class="fw-semibold font-monospace mb-1">#<?= e((string) $latestOrder['order_ref']) ?></div>
              <div class="small text-muted-nova mb-1">Placed on <?= date('d M Y', strtotime((string) $latestOrder['created_at'])) ?> &bull; Total: <strong><?= e(nova_money((int) $latestOrder['total'])) ?></strong></div>
              <div><span class="status status--<?= e((string) $latestOrder['status']) ?>"><?= e(ucfirst((string) $latestOrder['status'])) ?></span></div>
            </div>
            <a href="order.php?ref=<?= e((string) $latestOrder['order_ref']) ?>" class="btn btn-ghost btn-sm">View order details</a>
          </div>
        <?php else: ?>
          <div class="text-center py-3">
            <p class="text-muted-nova mb-2">You haven't placed any orders with this account yet.</p>
            <a href="../shop.html" class="btn btn-ghost btn-sm">Browse catalog</a>
          </div>
        <?php endif; ?>
      </div>

      <!-- Account info split cards -->
      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <div class="account-card h-100">
            <div class="account-card-header d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <h2 class="h5 mb-0"><i class="bi bi-person me-2 text-primary" aria-hidden="true"></i>Profile</h2>
              <a href="profile.php" class="btn btn-ghost btn-sm">Edit</a>
            </div>
            <div class="mb-2"><strong><?= e($me['name'] ?? '') ?></strong></div>
            <div class="small text-muted-nova mb-1"><i class="bi bi-envelope me-2" aria-hidden="true"></i><?= e($me['email'] ?? '') ?></div>
            <div class="small text-muted-nova mb-3"><i class="bi bi-telephone me-2" aria-hidden="true"></i><?= !empty($me['phone']) ? e((string)$me['phone']) : 'No phone saved' ?></div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="account-card h-100">
            <div class="account-card-header d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <h2 class="h5 mb-0"><i class="bi bi-geo-alt me-2 text-primary" aria-hidden="true"></i>Default Address</h2>
              <a href="addresses.php" class="btn btn-ghost btn-sm"><?= $defaultAddress ? 'Manage' : 'Add' ?></a>
            </div>
            <?php if ($defaultAddress): ?>
              <div class="mb-1"><strong><?= e((string) $defaultAddress['recipient_name']) ?></strong></div>
              <div class="small text-muted-nova mb-1"><?= e((string) $defaultAddress['city']) ?> &mdash; <?= e((string) $defaultAddress['address']) ?><?= !empty($defaultAddress['apartment']) ? ', ' . e((string) $defaultAddress['apartment']) : '' ?></div>
              <div class="small text-muted-nova mb-3"><i class="bi bi-telephone me-2" aria-hidden="true"></i><?= e((string) $defaultAddress['phone']) ?></div>
            <?php else: ?>
              <p class="small text-muted-nova mb-3">No saved address yet. Add one to speed up checkout on your future orders.</p>
            <?php endif; ?>
          </div>
        </div>
      </div>

      <!-- Continue shopping banner -->
      <div class="account-banner p-4 rounded-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div>
          <h3 class="h5 mb-1">Looking for inspiration?</h3>
          <p class="small text-muted-nova mb-0">Explore our curated collections of warm neutrals, natural materials, and solid wood furniture.</p>
        </div>
        <a href="../shop.html" class="btn btn-nova">Browse Catalog</a>
      </div>
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
<script>
(function() {
  try {
    var wish = JSON.parse(localStorage.getItem('nova_wish') || '[]');
    var el = document.getElementById('dashWishCount');
    if (el) el.textContent = Array.isArray(wish) ? wish.length : 0;
  } catch(e) {}
})();
</script>
</body>
</html>
