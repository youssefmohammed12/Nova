<?php
/**
 * NOVA Home - admin/settings.php (Phase 7/8).
 * Redesigned store settings configuration interface:
 * Business profile, contact information, and delivery rate rules.
 * Whitelisted settings only, server-side validated, saved atomically with CSRF.
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once NOVA_ROOT . '/includes/admin-auth.php';
require_admin(false);
$admin = nova_admin_user();
$pdo = nova_pdo();

const NOVA_SETTING_KEYS = ['business_name', 'phone', 'email', 'address', 'delivery_fee', 'free_delivery_threshold'];

$old = [
    'business_name'           => '',
    'phone'                   => '',
    'email'                   => '',
    'address'                 => '',
    'delivery_fee'            => '60',
    'free_delivery_threshold' => '1500',
];
$load = $pdo->query('SELECT `key`, `value` FROM `settings`');
foreach ($load->fetchAll() as $row) {
    if (in_array((string) $row['key'], NOVA_SETTING_KEYS, true)) {
        $old[(string) $row['key']] = (string) $row['value'];
    }
}

$errs = [];
if (is_post()) {
    if (!nova_verify_csrf($_POST['csrf_token'] ?? null)) {
        redirect('admin/settings.php?err=csrf');
    }
    if (($_POST['action'] ?? '') !== 'save') {
        redirect('admin/settings.php?err=invalid');
    }
    $submitted = (array) ($_POST['setting'] ?? []);
    // Reject unknown keys outright (no silent creation of arbitrary settings).
    $unknown = array_diff(array_keys($submitted), NOVA_SETTING_KEYS);
    if ($unknown) {
        redirect('admin/settings.php?err=invalid_key');
    }
    $name = v_text($submitted['business_name'] ?? '', 120);
    $phone = trim((string) ($submitted['phone'] ?? ''));
    $email = trim((string) ($submitted['email'] ?? ''));
    $address = v_text($submitted['address'] ?? '', 255);
    $feeRaw = $submitted['delivery_fee'] ?? '';
    $thresholdRaw = $submitted['free_delivery_threshold'] ?? '';
    $fee = v_int_range($feeRaw, 0, 100000000);
    $threshold = v_int_range($thresholdRaw, 0, 100000000);
    $old = [
        'business_name'           => $name,
        'phone'                   => $phone,
        'email'                   => $email,
        'address'                 => $address,
        'delivery_fee'            => (string) $feeRaw,
        'free_delivery_threshold' => (string) $thresholdRaw
    ];

    if ($name === '') {
        $errs[] = 'Business name is required.';
    }
    if (!v_phone_eg($phone)) {
        $errs[] = 'Enter a valid Egyptian phone number (e.g. 01012345678 or +201012345678).';
    }
    if (!v_email($email)) {
        $errs[] = 'Enter a valid contact email address.';
    }
    if ($address === '') {
        $errs[] = 'Physical business address is required.';
    }
    if ($fee === null) {
        $errs[] = 'Delivery fee must be a whole number of 0 or more.';
    }
    if ($threshold === null) {
        $errs[] = 'Free-delivery threshold must be a whole number of 0 or more.';
    }
    if (!$errs) {
        try {
            $pdo->beginTransaction();
            $up = $pdo->prepare(
                'INSERT INTO `settings` (`key`, `value`) VALUES (:k, :v)'
                . ' ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)'
            );
            $values = [
                'business_name'           => $name,
                'phone'                   => $phone,
                'email'                   => $email,
                'address'                 => $address,
                'delivery_fee'            => (string) $fee,
                'free_delivery_threshold' => (string) $threshold,
            ];
            foreach ($values as $k => $v) {
                $up->execute([':k' => $k, ':v' => $v]);
            }
            $pdo->commit();
            redirect('admin/settings.php?ok=saved');
        } catch (PDOException $pe) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            error_log('[NOVA admin/settings] ' . $pe->getMessage());
            $errs[] = 'Unable to save settings.';
        }
    }
}

$flashes = [
    'saved'       => ['success', 'Settings saved successfully. New checkout orders will use these rules.'],
    'csrf'        => ['danger', 'Your session expired. Please refresh and try again.'],
    'invalid_key' => ['danger', 'Unknown configuration setting rejected.'],
    'invalid'     => ['danger', 'Unable to save settings.'],
];
$flash = $flashes[(string) ($_GET['err'] ?? '')] ?? $flashes[(string) ($_GET['ok'] ?? '')] ?? null;

$adminTitle = 'Settings | NOVA Admin';
$adminNav = 'settings';
require __DIR__ . '/../includes/admin-head.php';
?>

<!-- Header -->
<div class="d-flex flex-wrap gap-3 align-items-center justify-content-between mb-4">
  <div>
    <h1 class="h3 fw-semibold mb-1">Store Settings</h1>
    <p class="text-muted-nova mb-0 small">Business contact identity, delivery rates, and checkout threshold rules.</p>
  </div>
</div>

<?php if ($flash): ?>
<div class="alert alert-<?= e($flash[0]) ?> alert-dismissible fade show d-flex align-items-center gap-2 mb-4" role="alert">
  <i class="bi <?= $flash[0] === 'success' ? 'bi-check-circle-fill text-success' : 'bi-exclamation-triangle-fill text-danger' ?>"></i>
  <div><?= e($flash[1]) ?></div>
  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
</div>
<?php endif; ?>

<?php if ($errs): ?>
<div class="alert alert-danger mb-4" role="alert">
  <div class="fw-semibold mb-1"><i class="bi bi-exclamation-triangle-fill me-2"></i>Please fix the following errors:</div>
  <ul class="mb-0 ps-3">
    <?php foreach ($errs as $m): ?>
      <li><?= e($m) ?></li>
    <?php endforeach; ?>
  </ul>
</div>
<?php endif; ?>

<form method="post" action="settings.php" novalidate>
  <input type="hidden" name="csrf_token" value="<?= e(nova_csrf_token()) ?>">
  <input type="hidden" name="action" value="save">

  <div class="row g-4">
    <!-- Left Column: Business Profile -->
    <div class="col-lg-6">
      <div class="admin-card h-100">
        <div class="admin-card-header">
          <h2 class="admin-card-title h6"><i class="bi bi-building"></i> Business Identity</h2>
          <span class="badge bg-light text-dark border">Public Store Info</span>
        </div>

        <div class="row g-3">
          <div class="col-12">
            <label class="form-label fw-medium small" for="s-name">Business Legal / Brand Name <span class="text-danger">*</span></label>
            <input class="form-control" id="s-name" name="setting[business_name]" maxlength="120" required value="<?= e($old['business_name']) ?>">
            <div class="form-text small text-muted-nova">Appears in customer order receipts and email notifications.</div>
          </div>

          <div class="col-md-6">
            <label class="form-label fw-medium small" for="s-phone">Contact Phone <span class="text-danger">*</span></label>
            <div class="input-group">
              <span class="input-group-text bg-white text-muted-nova"><i class="bi bi-telephone"></i></span>
              <input class="form-control" id="s-phone" name="setting[phone]" type="tel" required placeholder="01012345678" value="<?= e($old['phone']) ?>">
            </div>
          </div>

          <div class="col-md-6">
            <label class="form-label fw-medium small" for="s-email">Support Email <span class="text-danger">*</span></label>
            <div class="input-group">
              <span class="input-group-text bg-white text-muted-nova"><i class="bi bi-envelope"></i></span>
              <input class="form-control" id="s-email" name="setting[email]" type="email" required placeholder="hello@novahome.eg" value="<?= e($old['email']) ?>">
            </div>
          </div>

          <div class="col-12">
            <label class="form-label fw-medium small" for="s-address">Showroom / Dispatch Address <span class="text-danger">*</span></label>
            <input class="form-control" id="s-address" name="setting[address]" maxlength="255" required value="<?= e($old['address']) ?>">
          </div>
        </div>
      </div>
    </div>

    <!-- Right Column: Delivery Rates & Thresholds -->
    <div class="col-lg-6">
      <div class="admin-card h-100 d-flex flex-column justify-content-between">
        <div>
          <div class="admin-card-header">
            <h2 class="admin-card-title h6"><i class="bi bi-truck"></i> Delivery Pricing Rules</h2>
            <span class="badge bg-light text-dark border">Order Calculation</span>
          </div>

          <div class="row g-3">
            <div class="col-12">
              <label class="form-label fw-medium small" for="s-fee">Standard Delivery Fee (EGP) <span class="text-danger">*</span></label>
              <div class="input-group">
                <span class="input-group-text bg-white text-muted-nova">EGP</span>
                <input class="form-control" id="s-fee" name="setting[delivery_fee]" type="number" min="0" step="1" required value="<?= e($old['delivery_fee']) ?>">
              </div>
              <div class="form-text small text-muted-nova">Applied to orders whose subtotal is below the free delivery threshold.</div>
            </div>

            <div class="col-12">
              <label class="form-label fw-medium small" for="s-over">Free Delivery Threshold (EGP) <span class="text-danger">*</span></label>
              <div class="input-group">
                <span class="input-group-text bg-white text-muted-nova">EGP</span>
                <input class="form-control" id="s-over" name="setting[free_delivery_threshold]" type="number" min="0" step="1" required value="<?= e($old['free_delivery_threshold']) ?>">
              </div>
              <div class="form-text small text-muted-nova">Orders with a subtotal at or exceeding this amount receive free delivery (0 EGP).</div>
            </div>
          </div>

          <div class="alert alert-info border-0 bg-light text-muted-nova small mt-3 p-3">
            <i class="bi bi-info-circle me-1 text-primary"></i>
            Changes to delivery rates affect <strong>new checkout sessions only</strong>. Existing historical orders preserve their original calculated totals permanently.
          </div>
        </div>

        <div class="pt-3 border-top mt-4">
          <button class="btn btn-nova px-4 py-2 fw-semibold" type="submit">
            <i class="bi bi-check-lg me-1"></i> Save Store Settings
          </button>
        </div>
      </div>
    </div>
  </div>
</form>

<?php require __DIR__ . '/../includes/admin-foot.php'; ?>
