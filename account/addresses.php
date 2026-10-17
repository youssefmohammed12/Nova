<?php
/** NOVA Home - account/addresses.php (Phase 9). Manage saved addresses.
 * Server-renders the OWN address list (session customer only) plus an add/edit
 * form; all mutations POST to api/customer-addresses.php (CSRF, ownership).
 * Cities come from the shared nova_cities() server list.
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once NOVA_ROOT . '/includes/customer-auth.php';
require_customer(false);
$me = nova_customer_user();
$accountNav = 'addresses';
$pageTitle = 'Addresses | NOVA Home';
$cities = nova_cities();
$addressRows = [];
try {
    $stmt = nova_pdo()->prepare(
        'SELECT `id`, `label`, `recipient_name`, `phone`, `city`, `address`, `apartment`, `is_default`'
        . ' FROM `customer_addresses` WHERE `customer_id` = :me ORDER BY `is_default` DESC, `id` ASC'
    );
    $stmt->execute([':me' => $me['id']]);
    $addressRows = $stmt->fetchAll();
} catch (Throwable $e) {
    error_log('[NOVA account/addresses] ' . $e->getMessage());
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
<body data-page="account-addresses">
<a class="skip-link" href="#main">Skip to content</a>
<div id="site-header"></div>
<main id="main"><div class="container pb-5">
  <div class="page-head account-head"><nav aria-label="Breadcrumb"><ol class="breadcrumb"><li class="breadcrumb-item"><a href="../index.html">Home</a></li><li class="breadcrumb-item"><a href="index.php">My account</a></li><li class="breadcrumb-item active" aria-current="page">Addresses</li></ol></nav><p class="eyebrow">My shopping space</p><h1>Addresses</h1><p class="text-muted-nova mb-0">Saved delivery addresses (up to 10). Your default address pre-fills checkout.</p></div>
  <div class="account-layout">
    <?php require __DIR__ . '/../includes/account-side.php'; ?>
    <div class="account-main">
      <p class="alert alert-success" id="addr-ok" hidden role="status"></p>
      <p class="alert alert-danger" id="addr-error" hidden tabindex="-1" role="alert"></p>
      <?php if (!$addressRows): ?>
        <div class="account-card mb-4 text-center py-4" id="addr-empty">
          <i class="bi bi-geo-alt text-primary mb-2" style="font-size: 2rem;" aria-hidden="true"></i>
          <h2 class="h5">No saved addresses yet</h2>
          <p class="text-muted-nova small mb-0">Add a delivery address below to make checkout fast and seamless.</p>
        </div>
      <?php endif; ?>
      <div id="addr-list" class="row g-3 mb-4">
<?php foreach ($addressRows as $a): ?>
        <div class="col-md-6" data-addr-id="<?= e((string) $a['id']) ?>">
          <div class="account-card h-100<?= (int)$a['is_default'] === 1 ? ' addr-card--default' : '' ?>">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div>
                <strong><?= e((string) $a['recipient_name']) ?></strong>
                <?php if ($a['label'] !== ''): ?><span class="badge bg-light text-dark ms-2"><?= e((string) $a['label']) ?></span><?php endif; ?>
              </div>
              <?php if ((int) $a['is_default'] === 1): ?>
                <span class="badge bg-success-subtle text-success border border-success-subtle"><i class="bi bi-check-circle me-1" aria-hidden="true"></i>Default</span>
              <?php endif; ?>
            </div>
            <p class="small text-muted-nova mb-1"><?= e((string) $a['city']) ?> &mdash; <?= e((string) $a['address']) ?><?= $a['apartment'] !== '' ? ', ' . e((string) $a['apartment']) : '' ?></p>
            <p class="small text-muted-nova mb-3"><i class="bi bi-telephone me-1" aria-hidden="true"></i><?= e((string) $a['phone']) ?></p>
            <div class="d-flex flex-wrap gap-2 pt-2 border-top">
              <button class="btn btn-ghost btn-sm" type="button" data-addr-edit="<?= e((string) $a['id']) ?>" data-rn="<?= e((string) $a['recipient_name']) ?>" data-ph="<?= e((string) $a['phone']) ?>" data-city="<?= e((string) $a['city']) ?>" data-lb="<?= e((string) $a['label']) ?>" data-st="<?= e((string) $a['address']) ?>" data-apt="<?= e((string) $a['apartment']) ?>" data-def="<?= e((string) $a['is_default']) ?>"><i class="bi bi-pencil me-1" aria-hidden="true"></i>Edit</button>
              <?php if ((int) $a['is_default'] !== 1): ?>
                <button class="btn btn-ghost btn-sm" type="button" data-addr-default="<?= e((string) $a['id']) ?>"><i class="bi bi-star me-1" aria-hidden="true"></i>Make default</button>
              <?php endif; ?>
              <button class="btn btn-ghost btn-sm text-danger" type="button" data-addr-delete="<?= e((string) $a['id']) ?>"><i class="bi bi-trash me-1" aria-hidden="true"></i>Delete</button>
            </div>
          </div>
        </div>
<?php endforeach; ?>
      </div>
      <form class="account-card" id="addr-form" novalidate data-csrf="<?= e(nova_csrf_token()) ?>">
        <h2 class="h5 mb-3" id="addr-form-title">Add address</h2>
        <input type="hidden" name="id" id="addr-id" value="">
        <div class="row g-3">
          <div class="col-md-6"><label class="form-label" for="a-recipient">Recipient name</label><input class="form-control" id="a-recipient" name="recipient_name" maxlength="120" autocomplete="name" required><div class="invalid-feedback">Recipient name is required.</div></div>
          <div class="col-md-6"><label class="form-label" for="a-phone">Phone</label><input class="form-control" id="a-phone" name="phone" type="tel" autocomplete="tel" pattern="^(\+20|0)?1[0125][0-9]{8}$" required><div class="invalid-feedback">Enter a valid Egyptian mobile number.</div></div>
          <div class="col-md-6"><label class="form-label" for="a-city">City</label><select class="form-select" id="a-city" name="city" required><option value="">Choose city</option><?php foreach ($cities as $key => $label): ?><option value="<?= e($label) ?>"><?= e($label) ?></option><?php endforeach; ?></select><div class="invalid-feedback">Please choose your city.</div></div>
          <div class="col-md-6"><label class="form-label" for="a-label">Label <span class="text-muted-nova">(optional)</span></label><input class="form-control" id="a-label" name="label" maxlength="60" placeholder="Home, Office..."></div>
          <div class="col-12"><label class="form-label" for="a-street">Street address</label><input class="form-control" id="a-street" name="address" maxlength="255" autocomplete="street-address" required><div class="invalid-feedback">Street address is required.</div></div>
          <div class="col-12"><label class="form-label" for="a-apt">Apartment / building <span class="text-muted-nova">(optional)</span></label><input class="form-control" id="a-apt" name="apartment" maxlength="120" autocomplete="address-line2"></div>
          <div class="col-12"><div class="form-check"><input class="form-check-input" type="checkbox" id="a-default" name="is_default" value="1"><label class="form-check-label" for="a-default">Set as my default address</label></div></div>
        </div>
        <div class="d-flex gap-2 mt-4"><button class="btn btn-nova" type="submit" id="addr-btn">Save address</button><button class="btn btn-ghost" type="button" id="addr-cancel" hidden>Cancel edit</button></div>
      </form>
    </div>
  </div>
</div></main>
<div id="site-footer"></div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
<script>
(function () {
  var form = document.getElementById('addr-form');
  var errBox = document.getElementById('addr-error');
  var okBox = document.getElementById('addr-ok');
  var btn = document.getElementById('addr-btn');
  var idField = document.getElementById('addr-id');
  var title = document.getElementById('addr-form-title');
  var cancel = document.getElementById('addr-cancel');
  if (!form) return;
  var say = function (isOk, msg) {
    (isOk ? okBox : errBox).textContent = msg;
    okBox.hidden = !isOk; errBox.hidden = isOk;
    (isOk ? okBox : errBox).focus();
  };
  var post = function (fields) {
    var fd = new FormData();
    fd.append('csrf_token', form.dataset.csrf);
    Object.keys(fields).forEach(function (k) { fd.append(k, fields[k]); });
    return fetch('../api/customer-addresses.php', { method: 'POST', body: fd })
      .then(function (r) { return r.json().catch(function () { return null; }).then(function (j) { return { s: r.status, j: j }; }); });
  };
  var resetForm = function () {
    form.reset(); idField.value = ''; title.textContent = 'Add address';
    cancel.hidden = true; form.classList.remove('was-validated');
  };
  cancel.addEventListener('click', resetForm);
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    form.classList.add('was-validated');
    okBox.hidden = true; errBox.hidden = true;
    if (!form.checkValidity()) { var bad = form.querySelector(':invalid'); if (bad) bad.focus(); return; }
    btn.disabled = true;
    var fields = {
      action: idField.value ? 'update' : 'create',
      id: idField.value,
      recipient_name: document.getElementById('a-recipient').value.trim(),
      phone: document.getElementById('a-phone').value.trim(),
      city: document.getElementById('a-city').value,
      label: document.getElementById('a-label').value.trim(),
      address: document.getElementById('a-street').value.trim(),
      apartment: document.getElementById('a-apt').value.trim(),
      is_default: document.getElementById('a-default').checked ? '1' : ''
    };
    post(fields).then(function (res) {
      btn.disabled = false;
      if (res.s === 200 && res.j && res.j.success) { location.reload(); return; }
      say(false, (res.j && res.j.error) || 'Unable to save the address right now.');
    }).catch(function () { btn.disabled = false; say(false, 'Could not reach the server. Please try again.'); });
  });
  document.addEventListener('click', function (e) {
    var edit = e.target.closest('[data-addr-edit]');
    var del = e.target.closest('[data-addr-delete]');
    var def = e.target.closest('[data-addr-default]');
    if (edit) {
      idField.value = edit.dataset.addrEdit;
      title.textContent = 'Edit address'; cancel.hidden = false;
      document.getElementById('a-recipient').value = edit.dataset.rn || '';
      document.getElementById('a-phone').value = edit.dataset.ph || '';
      document.getElementById('a-city').value = edit.dataset.city || '';
      document.getElementById('a-label').value = edit.dataset.lb || '';
      document.getElementById('a-street').value = edit.dataset.st || '';
      document.getElementById('a-apt').value = edit.dataset.apt || '';
      document.getElementById('a-default').checked = edit.dataset.def === '1';
      form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    if (del) {
      if (!confirm('Delete this address?')) return;
      post({ action: 'delete', id: del.dataset.addrDelete }).then(function (res) {
        if (res.s === 200 && res.j && res.j.success) { location.reload(); return; }
        say(false, (res.j && res.j.error) || 'Unable to delete the address.');
      }).catch(function () { say(false, 'Could not reach the server.'); });
      return;
    }
    if (def) {
      post({ action: 'default', id: def.dataset.addrDefault }).then(function (res) {
        if (res.s === 200 && res.j && res.j.success) { location.reload(); return; }
        say(false, (res.j && res.j.error) || 'Unable to set the default address.');
      }).catch(function () { say(false, 'Could not reach the server.'); });
    }
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
