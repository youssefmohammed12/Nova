<?php
/** NOVA Home - account/order.php?ref= (Phase 10). Customer order detail.
 * Ownership enforced IN SQL: WHERE order_ref = :ref AND customer_id = :me —
 * missing / invalid-format / nonexistent / other-customer / guest orders all
 * produce the SAME safe not-found state (existence never disclosed). Items
 * come from order_items snapshots (historical truth); totals from the orders
 * row (never recalculated). Read-only: no mutations.
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once NOVA_ROOT . '/includes/customer-auth.php';
require_customer(false);
$me = nova_customer_user();
$ref = strtoupper(trim((string) ($_GET['ref'] ?? '')));
$order = null;
$items = [];
$refOk = (bool) preg_match('/^NH-\d{8}-[A-F0-9]{6}$/', $ref);
if ($refOk) {
    try {
        $pdo = nova_pdo();
        // Ownership is part of WHERE - never fetch-then-filter in PHP/JS.
        $stmt = $pdo->prepare(
            'SELECT `id`, `order_ref`, `status`, `payment_method`, `customer_name`, `city`, `address`,'
            . ' `subtotal`, `delivery_fee`, `total`, `created_at`'
            . ' FROM `orders` WHERE `order_ref` = :ref AND `customer_id` = :me LIMIT 1'
        );
        $stmt->execute([':ref' => $ref, ':me' => $me['id']]);
        $order = $stmt->fetch() ?: null;
        if ($order) {
            $it = $pdo->prepare(
                'SELECT oi.`product_name`, oi.`unit_price`, oi.`quantity`, oi.`line_total`, p.`slug` AS `prod_slug`,'
                . ' (SELECT pi.`image_path` FROM `product_images` pi WHERE pi.`product_id` = oi.`product_id` ORDER BY pi.`sort_order` ASC, pi.`id` ASC LIMIT 1) AS `image_path`'
                . ' FROM `order_items` oi LEFT JOIN `products` p ON p.`id` = oi.`product_id`'
                . ' WHERE oi.`order_id` = :id ORDER BY oi.`id` ASC'
            );
            $it->execute([':id' => (int) $order['id']]);
            $items = $it->fetchAll();
        }
    } catch (Throwable $e) {
        error_log('[NOVA account/order] ' . $e->getMessage());
    }
}
$accountNav = 'orders';
$pageTitle = ($order ? (string) $order['order_ref'] : 'Order') . ' | NOVA Home';
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
<body data-page="account-order">
<a class="skip-link" href="#main">Skip to content</a>
<div id="site-header"></div>
<main id="main"><div class="container pb-5">
  <div class="page-head account-head"><nav aria-label="Breadcrumb"><ol class="breadcrumb"><li class="breadcrumb-item"><a href="../index.html">Home</a></li><li class="breadcrumb-item"><a href="index.php">My account</a></li><li class="breadcrumb-item"><a href="orders.php">Orders</a></li><li class="breadcrumb-item active" aria-current="page"><?= e($order ? (string) $order['order_ref'] : 'Order') ?></li></ol></nav><?php if ($order): ?><p class="eyebrow">My shopping space</p><h1>Order <span><?= e((string) $order['order_ref']) ?></span></h1><p class="mb-0"><?= $badge((string) $order['status']) ?> <span class="text-muted-nova small">Placed <?= e(date('d M Y', strtotime((string) $order['created_at']))) ?> · <?= e(strtoupper((string) $order['payment_method'])) ?></span></p><?php endif; ?></div>
<?php if (!$order): ?>
  <div class="account-layout">
    <?php require __DIR__ . '/../includes/account-side.php'; ?>
    <div class="account-main"><div class="auth-card text-center"><i class="bi bi-search" aria-hidden="true" style="font-size:2rem"></i><h2 class="h5 mt-2">Order not found</h2><p class="text-muted-nova mb-3"><?= $refOk ? 'That order does not exist or does not belong to your account.' : 'That is not a valid order reference.' ?></p><a class="btn btn-nova" href="orders.php">Back to orders</a></div></div>
  </div>
<?php else: ?>
  <div class="row g-4 align-items-start">
    <div class="col-lg-8"><div class="table-card"><table class="table align-middle m-0">
      <thead><tr><th scope="col">Product</th><th scope="col">Unit price</th><th scope="col">Qty</th><th scope="col" class="text-end">Line total</th></tr></thead>
      <tbody>
<?php
$resolveItemImage = static function (?string $rawPath): string {
    $path = trim((string) $rawPath);
    if ($path === '' || strpos($path, '..') !== false || strpos($path, '://') !== false || ($path !== '' && $path[0] === '/')) {
        return '../assets/images/hero.svg';
    }
    $root = defined('NOVA_ROOT') ? NOVA_ROOT : dirname(__DIR__);
    $real = realpath($root . '/' . ltrim($path, '/'));
    $allowed = realpath($root . '/assets/images');
    if ($real !== false && $allowed !== false && str_starts_with($real, $allowed) && is_file($real)) {
        return '../' . ltrim($path, '/');
    }
    return '../assets/images/hero.svg';
};
?>
<?php foreach ($items as $it): ?>
        <tr>
          <td><span class="d-flex align-items-center gap-2"><img src="<?= e($resolveItemImage($it['image_path'] ?? null)) ?>" width="44" height="44" alt="" loading="lazy"><?= e((string) $it['product_name']) ?></span></td>
          <td><?= e(nova_money((int) $it['unit_price'])) ?></td>
          <td><?= e((string) $it['quantity']) ?></td>
          <td class="text-end"><?= e(nova_money((int) $it['line_total'])) ?></td>
        </tr>
<?php endforeach; ?>
      </tbody>
    </table></div>
      <div class="addr-card mt-3"><h2 class="h6">Shipping to</h2><p class="addr-name"><?= e((string) $order['customer_name']) ?></p><p class="addr-lines"><?= e((string) $order['address']) ?>, <?= e((string) $order['city']) ?><br><span class="text-muted-nova small">Historical delivery details recorded at checkout.</span></p></div>
    </div>
    <div class="col-lg-4"><div class="summary"><h2 class="h5 mb-3">Totals</h2>
      <div class="summary__row"><span>Subtotal</span><span><?= e(nova_money((int) $order['subtotal'])) ?></span></div>
      <div class="summary__row"><span>Delivery</span><span><?= (int) $order['delivery_fee'] === 0 ? 'Free' : e(nova_money((int) $order['delivery_fee'])) ?></span></div>
      <div class="summary__row summary__total"><span>Total</span><span><?= e(nova_money((int) $order['total'])) ?></span></div>
      <p class="small text-muted-nova mt-2 mb-0">Historical values recorded at checkout.</p>
      <a class="btn btn-ghost w-100 mt-3" href="orders.php">Back to orders</a>
    </div></div>
  </div>
<?php endif; ?>
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
