<?php
/**
 * NOVA Home - admin/order.php (Phase 7/8).
 * Redesigned order detail view and controlled status transition workflow.
 * Authoritative snapshots for items and financial numbers.
 * Validated status transition state machine with CSRF protection.
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once NOVA_ROOT . '/includes/admin-auth.php';
require_admin(false);
$admin = nova_admin_user();
$pdo = nova_pdo();

$TRANSITIONS = [
    'pending'   => ['confirmed', 'cancelled'],
    'confirmed' => ['shipped', 'cancelled'],
    'shipped'   => ['delivered'],
    'delivered' => [],
    'cancelled' => [],
];

/* --------------------------- status update (POST) ------------------------ */
if (is_post()) {
    if (!nova_verify_csrf($_POST['csrf_token'] ?? null)) {
        redirect('admin/orders.php?err=csrf');
    }
    if (($_POST['action'] ?? '') === 'status') {
        $ref = strtoupper(trim((string) ($_POST['ref'] ?? '')));
        $new = strtolower(trim((string) ($_POST['status'] ?? '')));
        if (!preg_match('/^NH-\d{8}-[A-F0-9]{6}$/', $ref) || !isset($TRANSITIONS[$new])) {
            redirect('admin/orders.php?err=invalid_status');
        }
        try {
            $cur = $pdo->prepare('SELECT `status` FROM `orders` WHERE `order_ref` = :ref LIMIT 1');
            $cur->execute([':ref' => $ref]);
            $row = $cur->fetch();
            if (!$row) {
                redirect('admin/orders.php?err=not_found');
            }
            $current = (string) $row['status'];
            if (!in_array($new, $TRANSITIONS[$current] ?? [], true)) {
                redirect('admin/orders.php?err=invalid_status');
            }
            $upd = $pdo->prepare('UPDATE `orders` SET `status` = :new WHERE `order_ref` = :ref');
            $upd->execute([':new' => $new, ':ref' => $ref]);
            redirect('admin/order.php?ref=' . urlencode($ref) . '&ok=status');
        } catch (PDOException $pe) {
            error_log('[NOVA admin/order status] ' . $pe->getMessage());
            redirect('admin/orders.php?err=invalid');
        }
    }
    redirect('admin/orders.php?err=invalid');
}

/* ------------------------------ detail (GET) ----------------------------- */
$ref = strtoupper(trim((string) ($_GET['ref'] ?? '')));
$refOk = (bool) preg_match('/^NH-\d{8}-[A-F0-9]{6}$/', $ref);
$order = null;
$items = [];
if ($refOk) {
    $stmt = $pdo->prepare('SELECT * FROM `orders` WHERE `order_ref` = :ref LIMIT 1');
    $stmt->execute([':ref' => $ref]);
    $order = $stmt->fetch() ?: null;
}
if ($order) {
    $it = $pdo->prepare(
        'SELECT oi.`product_name`, oi.`unit_price`, oi.`quantity`, oi.`line_total`, p.`slug` AS `prod_slug`,
                (SELECT pi.`image_path` FROM `product_images` pi WHERE pi.`product_id` = oi.`product_id` ORDER BY pi.`sort_order` ASC, pi.`id` ASC LIMIT 1) AS `image_path`
         FROM `order_items` oi
         LEFT JOIN `products` p ON p.`id` = oi.`product_id`
         WHERE oi.`order_id` = :id ORDER BY oi.`id` ASC'
    );
    $it->execute([':id' => (int) $order['id']]);
    $items = $it->fetchAll();
}
$flashes = ['status' => ['success', 'Order status updated successfully.']];
$flash = $flashes[(string) ($_GET['ok'] ?? '')] ?? null;

$adminTitle = ($order ? (string) $order['order_ref'] : 'Order Details') . ' | NOVA Admin';
$adminNav = 'orders';
require __DIR__ . '/../includes/admin-head.php';

$badge = static function (string $s): string {
    return '<span class="status status--' . e($s) . '">' . e(ucfirst($s)) . '</span>';
};
?>

<!-- Header -->
<div class="d-flex flex-wrap gap-3 align-items-center justify-content-between mb-4">
  <div>
    <div class="d-flex align-items-center gap-2 mb-1">
      <a href="orders.php" class="text-muted-nova text-decoration-none small"><i class="bi bi-arrow-left me-1"></i>Back to Orders</a>
    </div>
    <div class="d-flex flex-wrap align-items-center gap-3">
      <h1 class="h3 fw-semibold mb-0" style="font-family: monospace;"><?= $order ? e((string) $order['order_ref']) : 'Order Not Found' ?></h1>
      <?php if ($order): ?>
        <?= $badge((string) $order['status']) ?>
      <?php endif; ?>
    </div>
  </div>
  <?php if ($order): ?>
  <div class="text-muted-nova small">
    <span>Placed on <?= date('M j, Y \a\t g:i A', strtotime((string) $order['created_at'])) ?></span>
    <?php if ($order['updated_at'] !== $order['created_at']): ?>
    <span class="d-block text-end small">Updated <?= date('M j, Y \a\t g:i A', strtotime((string) $order['updated_at'])) ?></span>
    <?php endif; ?>
  </div>
  <?php endif; ?>
</div>

<?php if ($flash): ?>
<div class="alert alert-<?= e($flash[0]) ?> alert-dismissible fade show d-flex align-items-center gap-2 mb-4" role="alert">
  <i class="bi bi-check-circle-fill text-success"></i>
  <div><?= e($flash[1]) ?></div>
  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
</div>
<?php endif; ?>

<?php if (!$order): ?>
<div class="admin-card text-center py-5">
  <i class="bi bi-exclamation-circle text-warning fs-1 d-block mb-3"></i>
  <h2 class="h5"><?= $refOk ? 'No order exists with reference ' . e($ref) : 'Invalid order reference format.' ?></h2>
  <p class="text-muted-nova mb-4">Please check the reference number and try again.</p>
  <a class="btn btn-nova btn-sm" href="orders.php">Back to Orders</a>
</div>
<?php else: ?>

<!-- Overview Cards -->
<div class="row g-4 mb-4">
  <!-- Customer Information -->
  <div class="col-lg-4">
    <div class="admin-card h-100">
      <div class="admin-card-header">
        <h2 class="admin-card-title h6"><i class="bi bi-person"></i> Customer Details</h2>
      </div>
      <div class="d-flex flex-column gap-2 small">
        <div class="fw-semibold fs-6 text-dark"><?= e((string) $order['customer_name']) ?></div>
        <div class="d-flex align-items-center gap-2 text-muted-nova">
          <i class="bi bi-telephone text-terracotta"></i>
          <span><?= e((string) $order['phone']) ?></span>
        </div>
        <?php if ($order['email'] !== ''): ?>
        <div class="d-flex align-items-center gap-2 text-muted-nova">
          <i class="bi bi-envelope text-terracotta"></i>
          <span><?= e((string) $order['email']) ?></span>
        </div>
        <?php endif; ?>
        <div class="d-flex align-items-start gap-2 text-muted-nova pt-2 border-top mt-1">
          <i class="bi bi-geo-alt text-terracotta mt-1"></i>
          <div>
            <strong><?= e((string) $order['city']) ?></strong><br>
            <span><?= e((string) $order['address']) ?></span>
          </div>
        </div>
        <?php if ($order['notes'] !== ''): ?>
        <div class="pt-2 border-top mt-1">
          <span class="text-muted-nova fw-semibold">Delivery Instructions:</span>
          <p class="mb-0 text-dark fst-italic">"<?= e((string) $order['notes']) ?>"</p>
        </div>
        <?php endif; ?>
      </div>
    </div>
  </div>

  <!-- Order & Payment Info -->
  <div class="col-lg-4">
    <div class="admin-card h-100">
      <div class="admin-card-header">
        <h2 class="admin-card-title h6"><i class="bi bi-credit-card"></i> Payment & Status</h2>
      </div>
      <div class="d-flex flex-column gap-2 small">
        <div class="d-flex justify-content-between align-items-center py-1 border-bottom">
          <span class="text-muted-nova">Payment Method</span>
          <span class="badge bg-light text-dark border"><?= e(strtoupper((string) $order['payment_method'])) ?></span>
        </div>
        <div class="d-flex justify-content-between align-items-center py-1 border-bottom">
          <span class="text-muted-nova">Fulfillment Status</span>
          <div><?= $badge((string) $order['status']) ?></div>
        </div>
        <div class="d-flex justify-content-between align-items-center py-1 border-bottom">
          <span class="text-muted-nova">Items Count</span>
          <span class="fw-semibold"><?= count($items) ?> unique items</span>
        </div>
        <div class="d-flex justify-content-between align-items-center py-1">
          <span class="text-muted-nova">Customer Account</span>
          <span class="fw-semibold"><?= $order['customer_id'] ? 'Customer #' . e((string) $order['customer_id']) : 'Guest Checkout' ?></span>
        </div>
      </div>
    </div>
  </div>

  <!-- Financials Summary -->
  <div class="col-lg-4">
    <div class="admin-card h-100">
      <div class="admin-card-header">
        <h2 class="admin-card-title h6"><i class="bi bi-receipt"></i> Recorded Financials</h2>
      </div>
      <div class="d-flex flex-column gap-2 small">
        <div class="d-flex justify-content-between align-items-center">
          <span class="text-muted-nova">Subtotal</span>
          <span><?= e(nova_money((int) $order['subtotal'])) ?></span>
        </div>
        <div class="d-flex justify-content-between align-items-center">
          <span class="text-muted-nova">Delivery Fee</span>
          <span><?= (int) $order['delivery_fee'] === 0 ? '<span class="text-success fw-medium">Free</span>' : e(nova_money((int) $order['delivery_fee'])) ?></span>
        </div>
        <div class="d-flex justify-content-between align-items-center pt-2 border-top mt-2 fs-6">
          <span class="fw-bold">Total Amount</span>
          <strong class="text-dark fs-5"><?= e(nova_money((int) $order['total'])) ?></strong>
        </div>
        <p class="text-muted-nova mt-2 mb-0" style="font-size: 0.75rem;">
          <i class="bi bi-lock me-1"></i>Server-recorded snapshots. Never recomputed from catalog pricing.
        </p>
      </div>
    </div>
  </div>
</div>

<!-- Order Items Snapshot Table -->
<div class="admin-table-wrap mb-4">
  <div class="p-3 border-bottom d-flex justify-content-between align-items-center">
    <h2 class="admin-card-title h6 mb-0"><i class="bi bi-box"></i> Order Items (Snapshot)</h2>
    <span class="small text-muted-nova">Authoritative customer purchase record</span>
  </div>

  <div class="table-responsive">
    <table class="table align-middle m-0">
      <thead>
        <tr>
          <th scope="col" style="width: 60px;">Image</th>
          <th scope="col">Product Name</th>
          <th scope="col" class="text-end">Unit Price</th>
          <th scope="col" class="text-center">Qty</th>
          <th scope="col" class="text-end">Line Total</th>
        </tr>
      </thead>
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
          <td>
            <img class="admin-prod-thumb" src="<?= e($resolveItemImage($it['image_path'] ?? null)) ?>" width="44" height="44" alt="" loading="lazy">
          </td>
          <td>
            <div class="fw-medium text-dark"><?= e((string) $it['product_name']) ?></div>
            <?php if (!empty($it['prod_slug'])): ?>
            <a href="product-form.php?id=<?= e((string) $it['prod_slug']) ?>" class="small text-muted-nova text-decoration-none">
              <i class="bi bi-box-arrow-up-right me-1"></i>View in catalog
            </a>
            <?php endif; ?>
          </td>
          <td class="text-end"><?= e(nova_money((int) $it['unit_price'])) ?></td>
          <td class="text-center"><span class="badge bg-light text-dark border"><?= e((string) $it['quantity']) ?></span></td>
          <td class="text-end fw-semibold"><?= e(nova_money((int) $it['line_total'])) ?></td>
        </tr>
<?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>

<!-- Status Transition Workflow Card -->
<div class="admin-card">
  <div class="admin-card-header">
    <h2 class="admin-card-title h6"><i class="bi bi-arrow-repeat"></i> Fulfillment Workflow</h2>
  </div>
<?php $next = $TRANSITIONS[(string) $order['status']] ?? []; ?>
<?php if ($next): ?>
  <form method="post" action="order.php" novalidate>
    <input type="hidden" name="csrf_token" value="<?= e(nova_csrf_token()) ?>">
    <input type="hidden" name="action" value="status">
    <input type="hidden" name="ref" value="<?= e((string) $order['order_ref']) ?>">

    <div class="row g-3 align-items-center">
      <div class="col-sm-auto">
        <label class="form-label fw-medium small mb-0" for="o-newstatus">Advance Status:</label>
      </div>
      <div class="col-sm-auto">
        <select class="form-select" id="o-newstatus" name="status">
<?php foreach ($next as $ns): ?>
          <option value="<?= e($ns) ?>">Mark as <?= e(ucfirst($ns)) ?></option>
<?php endforeach; ?>
        </select>
      </div>
      <div class="col-sm-auto">
        <button class="btn btn-nova btn-sm px-3" type="submit" onclick="return confirm('Confirm updating this order status?');">
          <i class="bi bi-check-lg me-1"></i>Apply Transition
        </button>
      </div>
    </div>
    <div class="form-text small text-muted-nova mt-2">
      Allowed transitions from <strong><?= e(ucfirst((string) $order['status'])) ?></strong>: <?= implode(', ', array_map('ucfirst', $next)) ?>.
    </div>
  </form>
<?php else: ?>
  <div class="d-flex align-items-center gap-2 text-muted-nova small">
    <i class="bi bi-lock-fill text-muted"></i>
    <span>This order is in terminal state (<strong><?= e(ucfirst((string) $order['status'])) ?></strong>) and cannot transition further.</span>
  </div>
<?php endif; ?>
</div>

<?php endif; ?>

<?php require __DIR__ . '/../includes/admin-foot.php'; ?>
