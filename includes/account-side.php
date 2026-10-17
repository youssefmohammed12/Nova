<?php
declare(strict_types=1);
/**
 * NOVA Home - shared customer account sidebar.
 * Expects $accountNav (dashboard|orders|wishlist|addresses|profile|'')
 * and the customer session from nova_customer_user().
 */
$acCur = static function (string $key) use ($accountNav): string {
    return ($accountNav ?? '') === $key ? ' aria-current="page"' : '';
};
$acCustomer = function_exists('nova_customer_user') ? (nova_customer_user() ?? []) : [];
$custName = trim((string)($acCustomer['name'] ?? 'Customer'));
$nameParts = preg_split('/\s+/', $custName) ?: [];
$initials = '';
if (!empty($nameParts[0])) {
    $initials .= mb_strtoupper(mb_substr($nameParts[0], 0, 1));
}
if (count($nameParts) > 1 && !empty($nameParts[count($nameParts) - 1])) {
    $initials .= mb_strtoupper(mb_substr($nameParts[count($nameParts) - 1], 0, 1));
}
if ($initials === '') {
    $initials = 'C';
}
?>
<aside class="account-side" aria-label="Account navigation">
  <div class="account-user-card">
    <div class="account-avatar" aria-hidden="true"><?= e($initials) ?></div>
    <div class="account-user-meta">
      <div class="account-user-name" title="<?= e($custName) ?>"><?= e($custName) ?></div>
      <div class="account-user-email" title="<?= e((string)($acCustomer['email'] ?? '')) ?>"><?= e((string)($acCustomer['email'] ?? '')) ?></div>
    </div>
  </div>
  <nav>
    <a href="index.php"<?= $acCur('dashboard') ?>><i class="bi bi-grid-1x2" aria-hidden="true"></i><span>Dashboard</span></a>
    <a href="orders.php"<?= $acCur('orders') ?>><i class="bi bi-box-seam" aria-hidden="true"></i><span>Orders</span></a>
    <a href="wishlist.html"<?= $acCur('wishlist') ?>><i class="bi bi-heart" aria-hidden="true"></i><span>Wishlist</span></a>
    <a href="addresses.php"<?= $acCur('addresses') ?>><i class="bi bi-geo-alt" aria-hidden="true"></i><span>Addresses</span></a>
    <a href="profile.php"<?= $acCur('profile') ?>><i class="bi bi-person" aria-hidden="true"></i><span>Profile</span></a>
    <a href="../shop.html"><i class="bi bi-shop" aria-hidden="true"></i><span>Continue shopping</span></a>
    <a href="logout.php" class="cust-logout-btn text-danger"><i class="bi bi-box-arrow-right" aria-hidden="true"></i><span>Sign out</span></a>
  </nav>
</aside>
