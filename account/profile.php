<?php
/** NOVA Home - account/profile.php (Phase 9). View + edit own profile.
 * Email is read-only this phase (no verified change flow). Saves via
 * api/customer-profile.php (POST, CSRF, session-owned id only).
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once NOVA_ROOT . '/includes/customer-auth.php';
require_customer(false);
$me = nova_customer_user();
$accountNav = 'profile';
$pageTitle = 'Profile | NOVA Home';
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
<body data-page="account-profile">
<a class="skip-link" href="#main">Skip to content</a>
<div id="site-header"></div>
<main id="main"><div class="container pb-5">
  <div class="page-head account-head"><nav aria-label="Breadcrumb"><ol class="breadcrumb"><li class="breadcrumb-item"><a href="../index.html">Home</a></li><li class="breadcrumb-item"><a href="index.php">My account</a></li><li class="breadcrumb-item active" aria-current="page">Profile</li></ol></nav><p class="eyebrow">My shopping space</p><h1>Profile</h1><p class="text-muted-nova mb-0">Your name and contact phone. Email cannot be changed yet.</p></div>
  <div class="account-layout">
    <?php require __DIR__ . '/../includes/account-side.php'; ?>
    <div class="account-main">
      <div class="account-card">
        <div class="account-card-header d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
          <h2 class="h5 mb-0"><i class="bi bi-person me-2 text-primary" aria-hidden="true"></i>Personal Details</h2>
          <span class="badge bg-light text-muted-nova">Verified Account</span>
        </div>
        <form id="cust-profile-form" novalidate data-csrf="<?= e(nova_csrf_token()) ?>">
          <div class="row g-3">
            <div class="col-12"><label class="form-label" for="p-name">Full name</label><input class="form-control" id="p-name" name="name" maxlength="120" autocomplete="name" required value="<?= e($me['name'] ?? '') ?>"><div class="invalid-feedback">Please enter your name.</div></div>
            <div class="col-md-6"><label class="form-label" for="p-email">Email address</label><input class="form-control bg-light" id="p-email" type="email" value="<?= e($me['email'] ?? '') ?>" readonly aria-describedby="p-email-help"><div class="form-text" id="p-email-help">Email cannot be changed directly for security reasons.</div></div>
            <div class="col-md-6"><label class="form-label" for="p-phone">Phone number</label><input class="form-control" id="p-phone" name="phone" type="tel" autocomplete="tel" pattern="^(\+20|0)?1[0125][0-9]{8}$" required value="<?= e($me['phone'] ?? '') ?>"><div class="invalid-feedback">Enter a valid Egyptian mobile number.</div></div>
          </div>
          <p class="alert alert-danger mt-3 mb-0" id="cust-profile-error" hidden tabindex="-1" role="alert"></p>
          <p class="alert alert-success mt-3 mb-0" id="cust-profile-ok" hidden role="status">Profile updated successfully.</p>
          <div class="d-flex align-items-center gap-3 mt-4">
            <button class="btn btn-nova" type="submit" id="cust-profile-btn">Save changes</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div></main>
<div id="site-footer"></div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
<script>
(function () {
  var form = document.getElementById('cust-profile-form');
  var errBox = document.getElementById('cust-profile-error');
  var okBox = document.getElementById('cust-profile-ok');
  var btn = document.getElementById('cust-profile-btn');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    form.classList.add('was-validated');
    errBox.hidden = true; okBox.hidden = true;
    if (!form.checkValidity()) { var bad = form.querySelector(':invalid'); if (bad) bad.focus(); return; }
    btn.disabled = true; btn.textContent = 'Saving...';
    var fd = new FormData(form);
    fd.append('csrf_token', form.dataset.csrf);
    fetch('../api/customer-profile.php', { method: 'POST', body: fd })
      .then(function (r) { return r.json().catch(function () { return null; }).then(function (j) { return { s: r.status, j: j }; }); })
      .then(function (res) {
        btn.disabled = false; btn.textContent = 'Save changes';
        if (res.s === 200 && res.j && res.j.success) {
          okBox.hidden = false; okBox.focus();
          return;
        }
        errBox.textContent = (res.j && res.j.error) || 'Unable to save your profile right now.';
        errBox.hidden = false; errBox.focus();
      })
      .catch(function () { btn.disabled = false; btn.textContent = 'Save changes'; errBox.textContent = 'Could not reach the server. Please try again.'; errBox.hidden = false; });
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
