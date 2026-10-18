<?php
/**
 * NOVA Home — admin/login.php (Phase 5/8).
 * Redesigned administration portal sign-in page.
 * Already-authenticated visitors skip straight to the dashboard.
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once NOVA_ROOT . '/includes/admin-auth.php';
if (nova_admin_user() !== null) {
    header('Location: index.php', true, 302);
    exit;
}
$csrfToken = nova_csrf_token();
// Two independent demo switches: development-only (demo_access) and the
// hosted public demo (public_demo_access). Public wins for the button so the
// live demo works with env=production, debug=false. Both sign in the
// DEDICATED demo administrator rows — never the owner's personal account.
$devDemo = (NOVA_ENV === 'development' && nova_config('demo_access', false) === true);
$publicDemo = (nova_config('public_demo_access', false) === true);
$demoEnabled = ($devDemo || $publicDemo);
$demoEndpoint = $publicDemo ? '../api/public-demo-admin-login.php' : '../api/demo-admin-login.php';
$demoLabel = $publicDemo ? 'Explore Admin Demo' : 'Demo Admin Access';
$demoKicker = $publicDemo ? 'Public demo' : 'Development mode';
$pageTitle = 'Admin Sign In | NOVA Home';
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= e($pageTitle) ?></title>
<meta name="description" content="NOVA Home admin sign in.">
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
<body data-page="admin-login">
<a class="skip-link" href="#main">Skip to content</a>
<main id="main" class="admin-login-layout">
  <div class="admin-login-card">
    <div class="text-center mb-4">
      <a href="../index.html" class="admin-login-brand mb-2">NOVA <span>Home</span></a>
      <div class="d-flex align-items-center justify-content-center gap-2 mt-2">
        <span class="admin-badge"><i class="bi bi-shield-lock me-1"></i>Admin Portal</span>
      </div>
      <p class="text-muted-nova small mt-2 mb-0">Authorized store personnel only</p>
    </div>

    <form id="admin-login-form" novalidate data-csrf="<?= e($csrfToken) ?>">
      <div class="mb-3">
        <label class="form-label fw-medium small" for="a-email">Admin Email</label>
        <div class="input-group">
          <span class="input-group-text bg-white text-muted-nova"><i class="bi bi-envelope"></i></span>
          <input class="form-control" id="a-email" name="email" type="email" autocomplete="username" placeholder="name@novahome.eg" required>
        </div>
        <div class="invalid-feedback">Enter your admin email address.</div>
      </div>

      <div class="mb-3">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <label class="form-label fw-medium small mb-0" for="a-pass">Password</label>
        </div>
        <div class="input-group">
          <span class="input-group-text bg-white text-muted-nova"><i class="bi bi-key"></i></span>
          <input class="form-control" id="a-pass" name="password" type="password" autocomplete="current-password" minlength="6" placeholder="••••••••" required>
          <button class="btn btn-outline-secondary" type="button" id="toggle-pwd" aria-label="Toggle password visibility">
            <i class="bi bi-eye" id="toggle-pwd-icon"></i>
          </button>
        </div>
        <div class="invalid-feedback">Enter your password (6+ characters).</div>
      </div>

      <div class="alert alert-danger mb-3 small" id="admin-login-error" hidden tabindex="-1" role="alert"></div>

      <button class="btn btn-nova w-100 py-2 fw-semibold" type="submit" id="admin-login-btn">
        <span>Sign in to Dashboard</span>
        <i class="bi bi-arrow-right ms-2"></i>
      </button>
    </form>

    <div class="mt-4 pt-3 border-top text-center">
      <a href="../index.html" class="small text-muted-nova text-decoration-none hover-text-dark d-inline-flex align-items-center gap-1">
        <i class="bi bi-arrow-left"></i> Return to storefront
      </a>
    </div>

<?php if ($demoEnabled): ?>
    <div class="mt-3 pt-3 border-top text-center">
      <p class="small text-muted-nova mb-2"><i class="bi bi-wrench me-1" aria-hidden="true"></i><?= e($demoKicker) ?></p>
      <?php if ($publicDemo): ?>
      <p class="small mb-2"><strong>Editable demonstration environment.</strong> The full admin tools work on shared demo data — other visitors can change it and it may be reset at any time.</p>
      <?php endif; ?>
      <button class="btn btn-outline-secondary w-100 py-2" type="button" id="demo-admin-btn" data-csrf="<?= e($csrfToken) ?>" data-endpoint="<?= e($demoEndpoint) ?>" data-label="<?= e($demoLabel) ?>">
        <i class="bi bi-shield-check me-2" aria-hidden="true"></i><?= e($demoLabel) ?>
      </button>
      <p class="alert alert-danger mt-2 small" id="demo-admin-error" hidden role="alert"></p>
    </div>
<?php endif; ?>
  </div>
</main>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
<script>
(function () {
  var form = document.getElementById('admin-login-form');
  var errBox = document.getElementById('admin-login-error');
  var btn = document.getElementById('admin-login-btn');
  var passInput = document.getElementById('a-pass');
  var toggleBtn = document.getElementById('toggle-pwd');
  var toggleIcon = document.getElementById('toggle-pwd-icon');

  if (toggleBtn && passInput) {
    toggleBtn.addEventListener('click', function () {
      var isPass = passInput.type === 'password';
      passInput.type = isPass ? 'text' : 'password';
      if (toggleIcon) {
        toggleIcon.className = isPass ? 'bi bi-eye-slash' : 'bi bi-eye';
      }
    });
  }

  if (!form) return;
  var fail = function (msg) {
    errBox.textContent = msg;
    errBox.hidden = false;
    errBox.focus();
    btn.disabled = false;
    btn.innerHTML = '<span>Sign in to Dashboard</span><i class="bi bi-arrow-right ms-2"></i>';
  };

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    form.classList.add('was-validated');
    errBox.hidden = true;
    if (!form.checkValidity()) {
      var bad = form.querySelector(':invalid');
      if (bad) bad.focus();
      return;
    }
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Signing in…';
    fetch('../api/admin-login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('a-email').value.trim(),
        password: passInput.value,
        csrf_token: form.dataset.csrf
      })
    }).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (j) { return { s: r.status, j: j }; });
    }).then(function (res) {
      if (res.s === 200 && res.j && res.j.success) {
        location.href = (res.j.data && res.j.data.redirect) || 'index.php';
        return;
      }
      fail((res.j && res.j.error) || 'Unable to sign in right now.');
    }).catch(function () {
      fail('Could not reach the server. Check your connection and try again.');
    });
  });
})();
// Demo admin sign-in (server-gated: development demo_access OR public_demo_access)
(function () {
  var btn = document.getElementById('demo-admin-btn');
  if (!btn) return;
  var errBox = document.getElementById('demo-admin-error');
  var label = btn.dataset.label || 'Demo Admin Access';
  var icon = '<i class="bi bi-shield-check me-2" aria-hidden="true"></i>';
  btn.addEventListener('click', function () {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Signing in…';
    errBox.hidden = true;
    fetch(btn.dataset.endpoint || '../api/demo-admin-login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csrf_token: btn.dataset.csrf })
    }).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (j) { return { s: r.status, j: j }; });
    }).then(function (res) {
      if (res.s === 200 && res.j && res.j.success) {
        location.href = (res.j.data && res.j.data.redirect) || 'index.php';
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
</body>
</html>
