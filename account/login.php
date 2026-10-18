<?php
/** NOVA Home - account/login.php (Phase 9). Real customer sign-in.
 * Visual clone of the former demo page (same auth-card markup). Already-
 * authenticated customers skip straight to the dashboard. Form posts JSON to
 * api/customer-login.php (CSRF embedded server-side).
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once NOVA_ROOT . '/includes/customer-auth.php';
// Safe return-to-checkout (2026-10-17): only the exact literal 'checkout' is
// honoured — never a raw URL — so no open redirect is possible.
$returnTo = (($_GET['return'] ?? '') === 'checkout') ? '../checkout.html' : null;
if (nova_customer_user() !== null) {
    header('Location: ' . ($returnTo ?? 'index.php'), true, 302);
    exit;
}
$csrfToken = nova_csrf_token();
// Two independent demo switches: development-only (demo_access) and the
// hosted public demo (public_demo_access). Public wins for the button so the
// live demo works with env=production, debug=false.
$devDemo = (NOVA_ENV === 'development' && nova_config('demo_access', false) === true);
$publicDemo = (nova_config('public_demo_access', false) === true);
$demoEnabled = ($devDemo || $publicDemo);
$demoEndpoint = $publicDemo ? '../api/public-demo-customer-login.php' : '../api/demo-customer-login.php';
$demoLabel = $publicDemo ? 'Explore Customer Demo' : 'Explore Demo Account';
$demoKicker = $publicDemo ? 'Public demo' : 'Development mode';
$pageTitle = 'Sign in | NOVA Home';
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= e($pageTitle) ?></title>
<meta name="description" content="Sign in to your NOVA Home account.">
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
<body data-page="account-login">
<a class="skip-link" href="#main">Skip to content</a>
<div id="site-header"></div>
<main id="main"><div class="container pb-5">
  <div class="page-head"><nav aria-label="Breadcrumb"><ol class="breadcrumb"><li class="breadcrumb-item"><a href="../index.html">Home</a></li><li class="breadcrumb-item active" aria-current="page">Sign in</li></ol></nav></div>
  <div class="row justify-content-center"><div class="col-md-7 col-lg-5">
    <div class="auth-card" data-reveal>
      <h1 class="h3">Welcome back</h1>
      <?php if ($returnTo !== null): ?>
      <p class="alert alert-info small" id="co-return-notice"><i class="bi bi-cart3 me-1" aria-hidden="true"></i><strong>An account is required to check out.</strong> Sign in or create one to complete your purchase — your cart is saved and will be waiting for you.</p>
      <?php endif; ?>
      <p class="text-muted-nova">Sign in to your NOVA Home account.<?php if ($returnTo === null): ?> Create an account to check out faster.<?php endif; ?></p>
      <form id="cust-login-form" novalidate data-csrf="<?= e($csrfToken) ?>">
        <div class="mb-3"><label class="form-label" for="l-email">Email</label><input class="form-control" id="l-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required><div class="invalid-feedback">Enter your email address.</div></div>
        <div class="mb-3"><label class="form-label" for="l-pass">Password</label><input class="form-control" id="l-pass" name="password" type="password" autocomplete="current-password" minlength="6" required><div class="invalid-feedback">Enter your password (6+ characters).</div></div>
        <p class="small text-muted-nova mb-3"><i class="bi bi-info-circle me-1" aria-hidden="true"></i>Password reset is not available yet.</p>
        <p class="alert alert-danger mb-3" id="cust-login-error" hidden tabindex="-1" role="alert"></p>
        <button class="btn btn-nova w-100" type="submit" id="cust-login-btn">Sign in</button>
      </form>
      <p class="mt-3 mb-0 text-center small">New here? <a href="register.php<?= $returnTo !== null ? '?return=checkout' : '' ?>">Create an account</a></p>
    </div>
<?php if ($demoEnabled): ?>
    <div class="demo-access-card mt-4 text-center" data-reveal>
      <p class="small text-muted-nova mb-2"><i class="bi bi-wrench me-1" aria-hidden="true"></i><?= e($demoKicker) ?></p>
      <h2 class="h6 mb-2">Try the demo</h2>
      <p class="small text-muted-nova mb-3">Explore a fully populated customer account with sample orders, addresses, and wishlist items.</p>
      <?php if ($publicDemo): ?>
      <p class="small mb-3"><strong>Shared demo account.</strong> Synthetic sample data only — other visitors may change it and it can be reset. Please don't enter real personal or payment details.</p>
      <?php endif; ?>
      <button class="btn btn-outline-nova w-100" type="button" id="demo-cust-btn" data-csrf="<?= e($csrfToken) ?>" data-endpoint="<?= e($demoEndpoint) ?>" data-label="<?= e($demoLabel) ?>">
        <i class="bi bi-person-badge me-2" aria-hidden="true"></i><?= e($demoLabel) ?>
      </button>
      <p class="alert alert-danger mt-2 small" id="demo-cust-error" hidden role="alert"></p>
    </div>
<?php endif; ?>
  </div></div>
</div></main>
<div id="site-footer"></div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
<script>
// Whitelisted return destination (null or '../checkout.html') — never a raw URL.
var CO_RETURN = <?= json_encode($returnTo, JSON_HEX_TAG | JSON_UNESCAPED_SLASHES) ?>;
(function () {
  var form = document.getElementById('cust-login-form');
  var errBox = document.getElementById('cust-login-error');
  var btn = document.getElementById('cust-login-btn');
  if (!form) return;
  var fail = function (msg) {
    errBox.textContent = msg; errBox.hidden = false; errBox.focus();
    btn.disabled = false; btn.textContent = 'Sign in';
  };
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    form.classList.add('was-validated');
    errBox.hidden = true;
    if (!form.checkValidity()) { var bad = form.querySelector(':invalid'); if (bad) bad.focus(); return; }
    btn.disabled = true; btn.textContent = 'Signing in...';
    fetch('../api/customer-login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('l-email').value.trim(),
        password: document.getElementById('l-pass').value,
        csrf_token: form.dataset.csrf
      })
    }).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (j) { return { s: r.status, j: j }; });
    }).then(function (res) {
      if (res.s === 200 && res.j && res.j.success) {
        location.href = CO_RETURN || (res.j.data && res.j.data.redirect) || 'index.php';
        return;
      }
      fail((res.j && res.j.error) || 'Unable to sign in right now.');
    }).catch(function () { fail('Could not reach the server. Please try again.'); });
  });
})();
// Demo customer sign-in (server-gated: development demo_access OR public_demo_access)
(function () {
  var btn = document.getElementById('demo-cust-btn');
  if (!btn) return;
  var errBox = document.getElementById('demo-cust-error');
  var label = btn.dataset.label || 'Explore Demo Account';
  var icon = '<i class="bi bi-person-badge me-2" aria-hidden="true"></i>';
  btn.addEventListener('click', function () {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Signing in…';
    errBox.hidden = true;
    fetch(btn.dataset.endpoint || '../api/demo-customer-login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csrf_token: btn.dataset.csrf })
    }).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (j) { return { s: r.status, j: j }; });
    }).then(function (res) {
      if (res.s === 200 && res.j && res.j.success) {
        // Populate wishlist in localStorage for the demo experience
        if (res.j.data && res.j.data.wishlist) {
          try { localStorage.setItem('nova_wish', JSON.stringify(res.j.data.wishlist.map(String))); } catch (e) {}
        }
        location.href = CO_RETURN || (res.j.data && res.j.data.redirect) || 'index.php';
        return;
      }
      errBox.textContent = (res.j && res.j.error) || 'Demo sign-in failed.';
      errBox.hidden = false;
      btn.disabled = false;
      btn.innerHTML = icon + label;
    }).catch(function () {
      errBox.textContent = 'Could not reach the server.';
      errBox.hidden = false;
      btn.disabled = false;
      btn.innerHTML = icon + label;
    });
  });
})();
</script>
<script src="../js/products.js"></script>
<script src="../js/settings.js"></script>
<script src="../js/catalog.js"></script>
<script src="../js/cart.js"></script>
<script src="../js/ui.js"></script>
<script src="../js/main.js"></script>
</body>
</html>
