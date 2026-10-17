<?php
/**
 * NOVA Home — shared admin page shell TOP (Phase 6/8).
 * Renders doctype → head → body → offcanvas drawer → .admin-shell → sidebar → topbar → content open.
 * Pages using this partial must have already called require_admin().
 *
 * Expected vars: $adminTitle (string), $adminNav (dashboard|products|categories|orders|settings|'').
 * Content page markup goes between this partial and includes/admin-foot.php.
 */
declare(strict_types=1);
if (!isset($adminTitle) || !isset($adminNav)) {
    http_response_code(500);
    exit('Admin layout misconfigured.');
}
$navCurrent = static function (string $key) use ($adminNav): string {
    return $adminNav === $key ? ' aria-current="page"' : '';
};

$adminUser = $_SESSION['admin_name'] ?? 'Admin';
$adminInitials = 'AD';
if (!empty($adminUser)) {
    $parts = explode(' ', trim((string) $adminUser));
    if (count($parts) >= 2) {
        $adminInitials = mb_substr($parts[0], 0, 1) . mb_substr($parts[count($parts) - 1], 0, 1);
    } else {
        $adminInitials = mb_substr($parts[0], 0, 2);
    }
}
$adminInitials = strtoupper($adminInitials);

// Clean title for topbar breadcrumb (strip " | NOVA Admin")
$adminSectionTitle = preg_replace('/\s*\|\s*NOVA\s*Admin$/i', '', $adminTitle);
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= e($adminTitle) ?></title>
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
<body data-page="admin-<?= e($adminNav !== '' ? $adminNav : 'page') ?>">
<a class="skip-link" href="#main">Skip to content</a>

<!-- Mobile Navigation Drawer -->
<div class="offcanvas offcanvas-start" tabindex="-1" id="adminNavDrawer" aria-labelledby="adminNavDrawerLabel">
  <div class="offcanvas-header border-bottom">
    <div class="d-flex align-items-center gap-2">
      <span class="admin-brand-logo mb-0">NOVA <span>Home</span></span>
      <span class="admin-badge">Admin</span>
    </div>
    <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close menu"></button>
  </div>
  <div class="offcanvas-body d-flex flex-column justify-content-between p-3">
    <div>
      <div class="admin-user-card">
        <div class="admin-avatar"><?= e($adminInitials) ?></div>
        <div class="admin-user-meta">
          <p class="admin-user-name" title="<?= e($adminUser) ?>"><?= e($adminUser) ?></p>
          <p class="admin-user-role">Administrator</p>
        </div>
      </div>
      <nav class="admin-nav" aria-label="Mobile admin navigation">
        <a href="index.php"<?= $navCurrent('dashboard') ?>><i class="bi bi-grid" aria-hidden="true"></i><span>Dashboard</span></a>
        <a href="products.php"<?= $navCurrent('products') ?>><i class="bi bi-box-seam" aria-hidden="true"></i><span>Products</span></a>
        <a href="categories.php"<?= $navCurrent('categories') ?>><i class="bi bi-tags" aria-hidden="true"></i><span>Categories</span></a>
        <a href="orders.php"<?= $navCurrent('orders') ?>><i class="bi bi-receipt" aria-hidden="true"></i><span>Orders</span></a>
        <a href="settings.php"<?= $navCurrent('settings') ?>><i class="bi bi-gear" aria-hidden="true"></i><span>Settings</span></a>
        <div class="admin-nav-divider"></div>
        <a href="../index.html" target="_blank" rel="noopener"><i class="bi bi-shop" aria-hidden="true"></i><span>View store</span></a>
      </nav>
    </div>
    <div class="pt-3 border-top mt-3">
      <a href="logout.php" class="admin-logout-btn btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2" data-csrf="<?= e(nova_csrf_token()) ?>"><i class="bi bi-box-arrow-right" aria-hidden="true"></i><span>Sign out</span></a>
    </div>
  </div>
</div>

<main id="main">
  <div class="container-fluid px-3 px-md-4 py-3 py-md-4">
    <div class="admin-shell">
      <!-- Desktop Sidebar -->
      <aside class="admin-side admin-side--desktop" aria-label="Admin navigation">
        <div class="admin-brand">
          <a href="index.php" class="admin-brand-logo">NOVA <span>Home</span></a>
          <span class="admin-badge">Admin</span>
        </div>
        <div class="admin-user-card">
          <div class="admin-avatar"><?= e($adminInitials) ?></div>
          <div class="admin-user-meta">
            <p class="admin-user-name" title="<?= e($adminUser) ?>"><?= e($adminUser) ?></p>
            <p class="admin-user-role">Administrator</p>
          </div>
        </div>
        <nav class="admin-nav" aria-label="Desktop admin navigation">
          <a href="index.php"<?= $navCurrent('dashboard') ?>><i class="bi bi-grid" aria-hidden="true"></i><span>Dashboard</span></a>
          <a href="products.php"<?= $navCurrent('products') ?>><i class="bi bi-box-seam" aria-hidden="true"></i><span>Products</span></a>
          <a href="categories.php"<?= $navCurrent('categories') ?>><i class="bi bi-tags" aria-hidden="true"></i><span>Categories</span></a>
          <a href="orders.php"<?= $navCurrent('orders') ?>><i class="bi bi-receipt" aria-hidden="true"></i><span>Orders</span></a>
          <a href="settings.php"<?= $navCurrent('settings') ?>><i class="bi bi-gear" aria-hidden="true"></i><span>Settings</span></a>
          <div class="admin-nav-divider"></div>
          <a href="../index.html" target="_blank" rel="noopener"><i class="bi bi-shop" aria-hidden="true"></i><span>View store</span></a>
          <a href="logout.php" id="admin-logout" class="admin-logout-btn" data-csrf="<?= e(nova_csrf_token()) ?>"><i class="bi bi-box-arrow-right" aria-hidden="true"></i><span>Sign out</span></a>
        </nav>
      </aside>

      <!-- Main Content Column -->
      <div class="admin-main-col">
        <!-- Shared Topbar -->
        <header class="admin-topbar">
          <div class="d-flex align-items-center gap-2">
            <button class="btn btn-outline-secondary btn-sm admin-topbar__menu-btn d-lg-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#adminNavDrawer" aria-controls="adminNavDrawer" aria-label="Toggle navigation">
              <i class="bi bi-list fs-5"></i>
            </button>
            <div class="admin-topbar__title">
              <span class="text-muted-nova small d-none d-sm-inline">Admin / </span>
              <span class="fw-semibold"><?= e($adminSectionTitle) ?></span>
            </div>
          </div>
          <div class="d-flex align-items-center gap-2 gap-sm-3">
            <a class="btn btn-ghost btn-sm d-none d-md-inline-flex align-items-center gap-1" href="../index.html" target="_blank" rel="noopener">
              <i class="bi bi-arrow-up-right-square me-1"></i>Storefront
            </a>
            <div class="vr d-none d-sm-block"></div>
            <span class="text-muted-nova small d-none d-sm-inline">Signed in as <strong><?= e($adminUser) ?></strong></span>
            <a href="logout.php" class="admin-logout-btn btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1" data-csrf="<?= e(nova_csrf_token()) ?>" title="Sign out">
              <i class="bi bi-box-arrow-right"></i><span class="d-none d-md-inline">Sign out</span>
            </a>
          </div>
        </header>
