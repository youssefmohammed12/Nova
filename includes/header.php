<?php
declare(strict_types=1);
/**
 * NOVA Home - shared header partial.
 * Auth-aware: renders customer dropdown or guest sign-in/register actions,
 * matching js/ui.js header() contract.
 * Expected vars: $page (active key), $nova_categories (optional array).
 */
$nova_base = function_exists('nova_base_url') ? nova_base_url() : '/';
$B = $nova_base;
$page = $page ?? '';
$cur = static function (string $p) use ($page): string {
    return $page === $p ? ' aria-current="page"' : '';
};
$cats = $nova_categories ?? [
    ['slug' => 'decor', 'name' => 'Decor'],
    ['slug' => 'lighting', 'name' => 'Lighting'],
    ['slug' => 'kitchen', 'name' => 'Kitchen'],
    ['slug' => 'storage', 'name' => 'Storage'],
    ['slug' => 'furniture', 'name' => 'Furniture'],
];
$freeOver = function_exists('nova_money') ? nova_money((int) (function_exists('nova_setting') ? nova_setting('free_delivery_threshold', 1500) : 1500)) : 'EGP 1,500';
$esc = function_exists('e') ? 'e' : 'htmlspecialchars';
$cust = function_exists('nova_customer_user') ? nova_customer_user() : null;
$csrfToken = function_exists('nova_csrf_token') ? nova_csrf_token() : '';
?>
<div class="announcement" data-delivery-announcement>Free delivery over <?= $esc($freeOver) ?> across Cairo and Giza. Cash on delivery available.</div>
<header class="site-header" id="siteHeader"><div class="container site-header__inner">
  <button class="icon-btn site-header__menu" type="button" data-bs-toggle="offcanvas" data-bs-target="#navDrawer" aria-controls="navDrawer" aria-label="Open menu"><i class="bi bi-list" aria-hidden="true"></i></button>
  <a class="brand" href="<?= $esc($B) ?>index.html" aria-label="NOVA Home, homepage">NOVA <span>Home</span></a>
  <nav aria-label="Main"><ul class="main-nav">
    <li><a href="<?= $esc($B) ?>index.html"<?= $cur('home') ?>>Home</a></li>
    <li><a href="<?= $esc($B) ?>shop.html"<?= $cur('shop') ?>>Shop</a></li>
    <li class="dropdown"><button class="dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">Categories</button><ul class="dropdown-menu"><?php foreach ($cats as $c): ?>
      <li><a class="dropdown-item" href="<?= $esc($B) ?>shop.html?cat=<?= $esc($c['slug']) ?>"><?= $esc($c['name']) ?></a></li><?php endforeach; ?></ul></li>
    <li><a href="<?= $esc($B) ?>shop.html?sort=new">New Arrivals</a></li>
    <li><a href="<?= $esc($B) ?>index.html#why-nova">About</a></li>
    <li><a href="#contact">Contact</a></li>
  </ul></nav>
  <div class="header-actions">
    <button class="icon-btn" type="button" data-bs-toggle="modal" data-bs-target="#searchModal" aria-label="Search products"><i class="bi bi-search" aria-hidden="true"></i></button>
    <a class="icon-btn d-none d-lg-inline-flex" href="<?= $esc($B) ?>shop.html?wish=1" aria-label="Wishlist"><i class="bi bi-heart" aria-hidden="true"></i></a>
    <span id="navAuthSlot" class="nav-auth-slot d-none d-lg-inline-flex">
      <?php if ($cust): ?>
        <div class="nav-account-menu dropdown">
          <button class="nav-account-btn dropdown-toggle" type="button" id="navAccountDropdown" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="bi bi-person" aria-hidden="true"></i>
            <span class="nav-account-name"><?= $esc($cust['name'] ?? 'Account') ?></span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end shadow-sm" aria-labelledby="navAccountDropdown">
            <li><span class="dropdown-header small text-muted-nova"><?= $esc($cust['email'] ?? '') ?></span></li>
            <li><a class="dropdown-item" href="<?= $esc($B) ?>account/index.php"><i class="bi bi-grid-1x2 me-2" aria-hidden="true"></i>Dashboard</a></li>
            <li><a class="dropdown-item" href="<?= $esc($B) ?>account/orders.php"><i class="bi bi-box-seam me-2" aria-hidden="true"></i>Orders</a></li>
            <li><a class="dropdown-item" href="<?= $esc($B) ?>account/wishlist.html"><i class="bi bi-heart me-2" aria-hidden="true"></i>Wishlist</a></li>
            <li><a class="dropdown-item" href="<?= $esc($B) ?>account/addresses.php"><i class="bi bi-geo-alt me-2" aria-hidden="true"></i>Addresses</a></li>
            <li><a class="dropdown-item" href="<?= $esc($B) ?>account/profile.php"><i class="bi bi-person me-2" aria-hidden="true"></i>Profile</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item cust-logout-btn" href="<?= $esc($B) ?>account/logout.php"><i class="bi bi-box-arrow-right me-2 text-danger" aria-hidden="true"></i>Sign out</a></li>
          </ul>
        </div>
      <?php else: ?>
        <div class="nav-guest-actions">
          <a href="<?= $esc($B) ?>account/login.php" class="nav-auth-link">Sign in</a>
          <span class="nav-auth-divider" aria-hidden="true">/</span>
          <a href="<?= $esc($B) ?>account/register.php" class="btn btn-ghost btn-sm nav-register-btn">Register</a>
        </div>
      <?php endif; ?>
    </span>
    <a class="icon-btn" href="<?= $esc($B) ?>cart.html" aria-label="Cart"><i class="bi bi-bag" aria-hidden="true"></i><span class="cart-badge" data-cart-count data-count="0" aria-live="polite"></span></a>
  </div>
</div></header>
<div class="offcanvas offcanvas-start" tabindex="-1" id="navDrawer" aria-labelledby="navDrawerLabel">
  <div class="offcanvas-header"><span class="brand" id="navDrawerLabel">NOVA <span>Home</span></span><button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close menu"></button></div>
  <div class="offcanvas-body">
    <ul class="drawer-nav">
      <li><a href="<?= $esc($B) ?>index.html">Home</a></li><li><a href="<?= $esc($B) ?>shop.html">Shop</a></li>
      <?php foreach ($cats as $c): ?><li><a href="<?= $esc($B) ?>shop.html?cat=<?= $esc($c['slug']) ?>"><?= $esc($c['name']) ?></a></li><?php endforeach; ?>
      <li><a href="<?= $esc($B) ?>shop.html?sort=new">New Arrivals</a></li><li><a href="<?= $esc($B) ?>index.html#why-nova">About</a></li>
      <?php if ($cust): ?><li><a href="<?= $esc($B) ?>account/index.php">My account</a></li><?php endif; ?>
      <li><a href="#contact">Contact</a></li>
    </ul>
    <div class="drawer-footer">
      <?php if ($cust): ?>
        <div class="drawer-user-info mb-3 p-2 bg-light rounded">
          <div class="fw-medium small"><?= $esc($cust['name'] ?? 'Customer') ?></div>
          <div class="text-muted-nova small"><?= $esc($cust['email'] ?? '') ?></div>
        </div>
        <div class="d-flex flex-column gap-2 mb-3">
          <a href="<?= $esc($B) ?>shop.html?wish=1" class="btn btn-ghost btn-sm justify-content-start"><i class="bi bi-heart me-2" aria-hidden="true"></i>Saved Wishlist</a>
          <a href="<?= $esc($B) ?>account/index.php" class="btn btn-ghost btn-sm justify-content-start"><i class="bi bi-grid-1x2 me-2" aria-hidden="true"></i>Dashboard</a>
          <a href="<?= $esc($B) ?>account/logout.php" class="btn btn-ghost btn-sm justify-content-start text-danger cust-logout-btn"><i class="bi bi-box-arrow-right me-2" aria-hidden="true"></i>Sign out</a>
        </div>
      <?php else: ?>
        <div class="d-flex flex-column gap-2 mb-3">
          <a href="<?= $esc($B) ?>shop.html?wish=1" class="btn btn-ghost btn-sm justify-content-start"><i class="bi bi-heart me-2" aria-hidden="true"></i>Saved Wishlist</a>
          <a href="<?= $esc($B) ?>account/login.php" class="btn btn-primary btn-sm justify-content-center"><i class="bi bi-box-arrow-in-right me-2" aria-hidden="true"></i>Sign in</a>
          <a href="<?= $esc($B) ?>account/register.php" class="btn btn-outline-dark btn-sm justify-content-center"><i class="bi bi-person-plus me-2" aria-hidden="true"></i>Create account</a>
        </div>
      <?php endif; ?>
      <p class="small text-muted-nova mb-0" data-delivery-note>Free delivery on orders over <?= $esc($freeOver) ?>.</p>
    </div>
  </div>
</div>
<script>
window.NOVA_CUSTOMER = <?= json_encode($cust ? ['id' => $cust['id'], 'name' => $cust['name'], 'email' => $cust['email'], 'phone' => $cust['phone'] ?? ''] : null) ?>;
window.NOVA_CSRF = <?= json_encode($csrfToken) ?>;
</script>
