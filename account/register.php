<?php
/** NOVA Home - account/register.php (Phase 9). Real customer registration.
 * Visual clone of the former demo page. Posts to api/customer-register.php;
 * successful registration signs the customer in (session regenerated).
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
$pageTitle = 'Create account | NOVA Home';
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= e($pageTitle) ?></title>
<meta name="description" content="Create your NOVA Home account.">
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
<body data-page="account-register">
<a class="skip-link" href="#main">Skip to content</a>
<div id="site-header"></div>
<main id="main"><div class="container pb-5">
  <div class="page-head"><nav aria-label="Breadcrumb"><ol class="breadcrumb"><li class="breadcrumb-item"><a href="../index.html">Home</a></li><li class="breadcrumb-item active" aria-current="page">Create account</li></ol></nav></div>
  <div class="row justify-content-center"><div class="col-md-8 col-lg-6">
    <div class="auth-card" data-reveal>
      <h1 class="h3">Create your account</h1>
      <?php if ($returnTo !== null): ?>
      <p class="alert alert-info small" id="co-return-notice"><i class="bi bi-cart3 me-1" aria-hidden="true"></i><strong>An account is required to check out.</strong> Create your account to complete your purchase — your cart is saved and will be waiting for you.</p>
      <?php endif; ?>
      <p class="text-muted-nova">Save addresses and check out faster.<?php if ($returnTo === null): ?> Create an account to keep your wishlist and orders in one place.<?php endif; ?></p>
      <form id="cust-register-form" novalidate data-csrf="<?= e($csrfToken) ?>">
        <div class="mb-3"><label class="form-label" for="r-name">Full name</label><input class="form-control" id="r-name" name="name" autocomplete="name" maxlength="120" required><div class="invalid-feedback">Please enter your name.</div></div>
        <div class="row g-3">
          <div class="col-md-6"><label class="form-label" for="r-email">Email</label><input class="form-control" id="r-email" name="email" type="email" autocomplete="email" required><div class="invalid-feedback">Enter a valid email.</div></div>
          <div class="col-md-6"><label class="form-label" for="r-phone">Phone</label><input class="form-control" id="r-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="01012345678" pattern="^(\+20|0)?1[0125][0-9]{8}$" required><div class="invalid-feedback">Enter a valid Egyptian mobile number.</div></div>
          <div class="col-md-6"><label class="form-label" for="r-pass">Password</label><input class="form-control" id="r-pass" name="password" type="password" autocomplete="new-password" minlength="8" required><div class="invalid-feedback">Use at least 8 characters.</div></div>
          <div class="col-md-6"><label class="form-label" for="r-pass2">Confirm password</label><input class="form-control" id="r-pass2" name="password_confirm" type="password" autocomplete="new-password" minlength="8" required><div class="invalid-feedback">Passwords must match.</div></div>
        </div>
        <p class="alert alert-danger mt-3 mb-0" id="cust-register-error" hidden tabindex="-1" role="alert"></p>
        <button class="btn btn-nova w-100 mt-4" type="submit" id="cust-register-btn">Create account</button>
      </form>
      <p class="mt-3 mb-0 text-center small">Already have an account? <a href="login.php<?= $returnTo !== null ? '?return=checkout' : '' ?>">Sign in</a></p>
    </div>
  </div></div>
</div></main>
<div id="site-footer"></div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
<script>
// Whitelisted return destination (null or '../checkout.html') — never a raw URL.
var CO_RETURN = <?= json_encode($returnTo, JSON_HEX_TAG | JSON_UNESCAPED_SLASHES) ?>;
(function () {
  var form = document.getElementById('cust-register-form');
  var errBox = document.getElementById('cust-register-error');
  var btn = document.getElementById('cust-register-btn');
  if (!form) return;
  var fail = function (msg) {
    errBox.textContent = msg; errBox.hidden = false; errBox.focus();
    btn.disabled = false; btn.textContent = 'Create account';
  };
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    form.classList.add('was-validated');
    errBox.hidden = true;
    var pass = document.getElementById('r-pass'), pass2 = document.getElementById('r-pass2');
    if (pass.value !== pass2.value) { pass2.setCustomValidity('mismatch'); } else { pass2.setCustomValidity(''); }
    if (!form.checkValidity()) { var bad = form.querySelector(':invalid'); if (bad) bad.focus(); return; }
    btn.disabled = true; btn.textContent = 'Creating account...';
    fetch('../api/customer-register.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('r-name').value.trim(),
        email: document.getElementById('r-email').value.trim(),
        phone: document.getElementById('r-phone').value.trim(),
        password: pass.value,
        password_confirm: pass2.value,
        csrf_token: form.dataset.csrf
      })
    }).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (j) { return { s: r.status, j: j }; });
    }).then(function (res) {
      if (res.s === 200 && res.j && res.j.success) {
        location.href = CO_RETURN || (res.j.data && res.j.data.redirect) || 'index.php';
        return;
      }
      fail((res.j && res.j.error) || 'Unable to create your account right now.');
    }).catch(function () { fail('Could not reach the server. Please try again.'); });
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
