<?php
/**
 * NOVA Home - admin/product-form.php (Phase 6/8).
 * Redesigned product create/edit form organized into logical sections:
 * Basic Details, Pricing & Flags, Specifications, and Images.
 * Atomic transaction upsert with CSRF and server-side validation.
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once NOVA_ROOT . '/includes/admin-auth.php';
require_admin(false);
$admin = nova_admin_user();
$pdo = nova_pdo();

$categories = $pdo->query('SELECT `id`, `slug`, `name` FROM `categories` ORDER BY `sort_order` ASC, `name` ASC')->fetchAll();
$catById = [];
foreach ($categories as $c) {
    $catById[(int) $c['id']] = $c;
}

$errs = [];
$mode = 'create';
$productId = null;
$old = [
    'name' => '', 'slug' => '', 'category_id' => '', 'price' => '', 'old_price' => '',
    'rating' => '0', 'reviews_count' => '0', 'is_new' => '', 'is_best' => '', 'description' => '', 'active' => '1'
];
$oldSpecs = [];
$oldImages = [];

/* ---------------------------- find edit target --------------------------- */
$slugParam = trim((string) ($_GET['id'] ?? $_POST['edit_slug'] ?? ''));
if ($slugParam !== '' && v_slug($slugParam)) {
    $find = $pdo->prepare('SELECT * FROM `products` WHERE `slug` = :slug LIMIT 1');
    $find->execute([':slug' => $slugParam]);
    $prod = $find->fetch();
    if ($prod) {
        $mode = 'update';
        $productId = (int) $prod['id'];
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            $old = [
                'name' => (string) $prod['name'],
                'slug' => (string) $prod['slug'],
                'category_id' => (string) $prod['category_id'],
                'price' => (string) $prod['price'],
                'old_price' => $prod['old_price'] !== null ? (string) $prod['old_price'] : '',
                'rating' => (string) $prod['rating'],
                'reviews_count' => (string) $prod['reviews_count'],
                'is_new' => (int) $prod['is_new'] === 1 ? '1' : '',
                'is_best' => (int) $prod['is_best'] === 1 ? '1' : '',
                'description' => (string) $prod['description'],
                'active' => (int) $prod['active'] === 1 ? '1' : '',
            ];
            $s = $pdo->prepare('SELECT `spec_key`, `spec_value` FROM `product_specifications` WHERE `product_id` = :id ORDER BY `sort_order` ASC, `id` ASC');
            $s->execute([':id' => $productId]);
            foreach ($s->fetchAll() as $row) {
                $oldSpecs[] = ['key' => (string) $row['spec_key'], 'value' => (string) $row['spec_value']];
            }
            $im = $pdo->prepare('SELECT `image_path`, `alt_text` FROM `product_images` WHERE `product_id` = :id ORDER BY `sort_order` ASC, `id` ASC');
            $im->execute([':id' => $productId]);
            foreach ($im->fetchAll() as $row) {
                $oldImages[] = ['path' => (string) $row['image_path'], 'alt' => (string) $row['alt_text']];
            }
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        redirect('admin/products.php?err=not_found');
    }
}

/* ------------------------------- save (POST) ----------------------------- */
if (is_post()) {
    if (!nova_verify_csrf($_POST['csrf_token'] ?? null)) {
        redirect('admin/products.php?err=csrf');
    }
    $mode = ($_POST['mode'] ?? 'create') === 'update' ? 'update' : 'create';
    if ($mode === 'update') {
        $pid = v_int_range($_POST['product_id'] ?? null, 1, 1000000);
        if ($pid === null) {
            redirect('admin/products.php?err=not_found');
        }
        $productId = $pid;
    }
    $name = v_text($_POST['name'] ?? '', 160);
    $slug = strtolower(trim((string) ($_POST['slug'] ?? '')));
    $categoryId = v_int_range($_POST['category_id'] ?? null, 1, 1000000);
    $price = v_int_range($_POST['price'] ?? null, 1, 100000000);
    $oldPrice = ($_POST['old_price'] ?? '') === '' ? null : v_int_range($_POST['old_price'], 0, 100000000);
    $ratingRaw = $_POST['rating'] ?? '0';
    $rating = is_numeric($ratingRaw) ? round((float) $ratingRaw, 1) : null;
    $reviews = v_int_range($_POST['reviews_count'] ?? '0', 0, 1000000) ?? 0;
    $description = v_text($_POST['description'] ?? '', 5000);
    $isNew = isset($_POST['is_new']) ? 1 : 0;
    $isBest = isset($_POST['is_best']) ? 1 : 0;
    $active = isset($_POST['active']) ? 1 : 0;
    $old = [
        'name' => $name, 'slug' => $slug,
        'category_id' => $categoryId !== null ? (string) $categoryId : '',
        'price' => $price !== null ? (string) $price : (string) ($_POST['price'] ?? ''),
        'old_price' => (string) ($_POST['old_price'] ?? ''),
        'rating' => (string) $ratingRaw,
        'reviews_count' => (string) ($_POST['reviews_count'] ?? ''),
        'is_new' => $isNew ? '1' : '',
        'is_best' => $isBest ? '1' : '',
        'description' => $description,
        'active' => $active ? '1' : ''
    ];

    if ($name === '') {
        $errs[] = 'Product name is required.';
    }
    if (!v_slug($slug)) {
        $errs[] = 'Slug must be lowercase letters, numbers and dashes (e.g. sahara-vase).';
    }
    if ($categoryId === null || !isset($catById[$categoryId])) {
        $errs[] = 'Category is invalid.';
    }
    if ($price === null) {
        $errs[] = 'Price must be a valid amount (1 or more EGP).';
    }
    if (($_POST['old_price'] ?? '') !== '' && $oldPrice === null) {
        $errs[] = 'Old price must be a valid amount.';
    }
    if ($rating === null || $rating < 0 || $rating > 5) {
        $errs[] = 'Rating must be between 0 and 5.';
    }
    if ($description === '') {
        $errs[] = 'Description is required.';
    }

    // Collect specification rows (skip fully empty rows).
    $specKeys = (array) ($_POST['spec_key'] ?? []);
    $specVals = (array) ($_POST['spec_value'] ?? []);
    $specs = [];
    foreach ($specKeys as $i => $k) {
        $k = v_text($k, 80);
        $v = v_text($specVals[$i] ?? '', 255);
        if ($k === '' && $v === '') {
            continue;
        }
        if ($k === '' || $v === '') {
            $errs[] = 'Each specification needs both a label and a value.';
            break;
        }
        $specs[] = ['key' => $k, 'value' => $v];
    }
    if (count($specs) > 20) {
        $errs[] = 'A product can have at most 20 specifications.';
    }
    $oldSpecs = [];
    foreach ($specKeys as $i => $k) {
        $v = $specVals[$i] ?? '';
        if (trim((string) $k) !== '' || trim((string) $v) !== '') {
            $oldSpecs[] = ['key' => (string) $k, 'value' => (string) $v];
        }
    }

    // Collect image rows (skip fully empty rows).
    $imgPaths = (array) ($_POST['image_path'] ?? []);
    $imgAlts = (array) ($_POST['alt_text'] ?? []);
    $images = [];
    foreach ($imgPaths as $i => $p) {
        $p = trim((string) $p);
        $a = v_text($imgAlts[$i] ?? '', 200);
        if ($p === '' && $a === '') {
            continue;
        }
        if (!v_image_path($p)) {
            $errs[] = 'Image paths must reference an existing file under assets/images/ with an approved format (.webp, .jpg, .jpeg, .png, .svg).';
            break;
        }
        $images[] = ['path' => $p, 'alt' => $a];
    }
    if (count($images) > 9) {
        $errs[] = 'A product can have at most 9 images.';
    }
    $oldImages = [];
    foreach ($imgPaths as $i => $p) {
        $a = $imgAlts[$i] ?? '';
        if (trim((string) $p) !== '' || trim((string) $a) !== '') {
            $oldImages[] = ['path' => (string) $p, 'alt' => (string) $a];
        }
    }

    if (!$errs) {
        try {
            $pdo->beginTransaction();
            if ($mode === 'create') {
                $ins = $pdo->prepare('INSERT INTO `products` (`slug`, `category_id`, `name`, `price`, `old_price`, `rating`, `reviews_count`, `is_new`, `is_best`, `description`, `active`) VALUES (:slug, :cat, :name, :price, :old, :rating, :reviews, :isnew, :best, :desc, :active)');
                $ins->execute([':slug' => $slug, ':cat' => $categoryId, ':name' => $name, ':price' => $price, ':old' => $oldPrice, ':rating' => $rating, ':reviews' => $reviews, ':isnew' => $isNew, ':best' => $isBest, ':desc' => $description, ':active' => $active]);
                $productId = (int) $pdo->lastInsertId();
            } else {
                $upd = $pdo->prepare('UPDATE `products` SET `slug` = :slug, `category_id` = :cat, `name` = :name, `price` = :price, `old_price` = :old, `rating` = :rating, `reviews_count` = :reviews, `is_new` = :isnew, `is_best` = :best, `description` = :desc, `active` = :active WHERE `id` = :id');
                $upd->execute([':slug' => $slug, ':cat' => $categoryId, ':name' => $name, ':price' => $price, ':old' => $oldPrice, ':rating' => $rating, ':reviews' => $reviews, ':isnew' => $isNew, ':best' => $isBest, ':desc' => $description, ':active' => $active, ':id' => $productId]);
            }
            // Replace specifications
            $delS = $pdo->prepare('DELETE FROM `product_specifications` WHERE `product_id` = :id');
            $delS->execute([':id' => $productId]);
            $insS = $pdo->prepare('INSERT INTO `product_specifications` (`product_id`, `spec_key`, `spec_value`, `sort_order`) VALUES (:pid, :k, :v, :o)');
            foreach ($specs as $i => $sp) {
                $insS->execute([':pid' => $productId, ':k' => $sp['key'], ':v' => $sp['value'], ':o' => $i]);
            }
            // Replace images
            $delI = $pdo->prepare('DELETE FROM `product_images` WHERE `product_id` = :id');
            $delI->execute([':id' => $productId]);
            $insI = $pdo->prepare('INSERT INTO `product_images` (`product_id`, `image_path`, `sort_order`, `alt_text`) VALUES (:pid, :p, :o, :a)');
            foreach ($images as $i => $im) {
                $insI->execute([':pid' => $productId, ':p' => $im['path'], ':o' => $i, ':a' => $im['alt']]);
            }
            $pdo->commit();
            redirect('admin/products.php?ok=' . ($mode === 'create' ? 'created' : 'updated'));
        } catch (PDOException $pe) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            if ($pe->getCode() === '23000') {
                $errs[] = 'Slug already exists - choose a different one.';
            } else {
                error_log('[NOVA admin/product-form] ' . $pe->getMessage());
                $errs[] = 'Unable to save product.';
            }
        }
    }
}

$adminTitle = ($mode === 'update' ? 'Edit Product' : 'Add Product') . ' | NOVA Admin';
$adminNav = 'products';
require __DIR__ . '/../includes/admin-head.php';
?>

<!-- Header -->
<div class="d-flex flex-wrap gap-3 align-items-center justify-content-between mb-4">
  <div>
    <div class="d-flex align-items-center gap-2 mb-1">
      <a href="products.php" class="text-muted-nova text-decoration-none small"><i class="bi bi-arrow-left me-1"></i>Back to Products</a>
    </div>
    <h1 class="h3 fw-semibold mb-0"><?= $mode === 'update' ? 'Edit Product' : 'Add New Product' ?></h1>
  </div>
  <div>
    <a class="btn btn-ghost btn-sm" href="products.php">Cancel</a>
  </div>
</div>

<?php if ($errs): ?>
<div class="alert alert-danger mb-4" role="alert">
  <div class="fw-semibold mb-1"><i class="bi bi-exclamation-triangle-fill me-2"></i>Please correct the following errors:</div>
  <ul class="mb-0 ps-3">
    <?php foreach ($errs as $m): ?>
      <li><?= e($m) ?></li>
    <?php endforeach; ?>
  </ul>
</div>
<?php endif; ?>

<form method="post" action="product-form.php" novalidate>
  <input type="hidden" name="csrf_token" value="<?= e(nova_csrf_token()) ?>">
  <input type="hidden" name="mode" value="<?= e($mode) ?>">
<?php if ($mode === 'update'): ?>
  <input type="hidden" name="product_id" value="<?= e((string) $productId) ?>">
  <input type="hidden" name="edit_slug" value="<?= e($old['slug']) ?>">
<?php endif; ?>

  <div class="row g-4">
    <!-- Left Column: Primary Details & Specs -->
    <div class="col-lg-8">
      <!-- Card 1: Basic Information -->
      <div class="admin-card mb-4">
        <div class="admin-card-header">
          <h2 class="admin-card-title h6"><i class="bi bi-card-heading"></i> Basic Information</h2>
        </div>
        <div class="row g-3">
          <div class="col-12">
            <label class="form-label fw-medium small" for="pf-name">Product Name <span class="text-danger">*</span></label>
            <input class="form-control" id="pf-name" name="name" maxlength="160" required placeholder="e.g. Sahara Ceramic Vase" value="<?= e($old['name']) ?>">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-medium small" for="pf-slug">URL Slug <span class="text-danger">*</span></label>
            <input class="form-control" id="pf-slug" name="slug" maxlength="80" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="e.g. sahara-ceramic-vase" value="<?= e($old['slug']) ?>">
            <div class="form-text small text-muted-nova">Lowercase letters, numbers, and dashes. Used in links and customer orders.</div>
          </div>
          <div class="col-md-6">
            <label class="form-label fw-medium small" for="pf-cat">Category <span class="text-danger">*</span></label>
            <select class="form-select" id="pf-cat" name="category_id" required>
              <option value="">Select category…</option>
              <?php foreach ($categories as $c): ?>
              <option value="<?= e((string) $c['id']) ?>"<?= (string) $c['id'] === (string) $old['category_id'] ? ' selected' : '' ?>><?= e((string) $c['name']) ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="col-12">
            <label class="form-label fw-medium small" for="pf-desc">Description <span class="text-danger">*</span></label>
            <textarea class="form-control" id="pf-desc" name="description" rows="4" maxlength="5000" required placeholder="Describe the materials, craftsmanship, dimensions, and styling inspiration…"><?= e($old['description']) ?></textarea>
          </div>
        </div>
      </div>

      <!-- Card 2: Specifications Repeater -->
      <div class="admin-card mb-4">
        <div class="admin-card-header">
          <div>
            <h2 class="admin-card-title h6"><i class="bi bi-list-check"></i> Technical Specifications</h2>
            <p class="text-muted-nova small mb-0">Define dimensions, materials, finishes, and origins.</p>
          </div>
          <button class="btn btn-ghost btn-sm" type="button" id="add-spec"><i class="bi bi-plus-lg me-1"></i>Add Row</button>
        </div>
        <div id="spec-rows" class="d-flex flex-column gap-2">
<?php $specInit = $oldSpecs ?: [['key' => '', 'value' => '']]; ?>
<?php foreach ($specInit as $i => $sp): ?>
          <div class="row g-2 align-items-center spec-row">
            <div class="col-md-4">
              <input class="form-control form-control-sm" name="spec_key[]" maxlength="80" placeholder="Label (e.g. Material)" value="<?= e($sp['key']) ?>">
            </div>
            <div class="col-md-7">
              <input class="form-control form-control-sm" name="spec_value[]" maxlength="255" placeholder="Value (e.g. Terracotta clay)" value="<?= e($sp['value']) ?>">
            </div>
            <div class="col-md-1 text-end">
              <button class="btn btn-outline-danger btn-sm px-2" type="button" data-remove-row aria-label="Remove specification"><i class="bi bi-trash"></i></button>
            </div>
          </div>
<?php endforeach; ?>
        </div>
      </div>

      <!-- Card 3: Images Repeater -->
      <div class="admin-card mb-4">
        <div class="admin-card-header">
          <div>
            <h2 class="admin-card-title h6"><i class="bi bi-images"></i> Product Photography</h2>
            <p class="text-muted-nova small mb-0">Assets under <code>assets/images/</code>. The first row acts as the primary image.</p>
          </div>
          <button class="btn btn-ghost btn-sm" type="button" id="add-img"><i class="bi bi-plus-lg me-1"></i>Add Image</button>
        </div>
        <div id="img-rows" class="d-flex flex-column gap-2">
<?php $imgInit = $oldImages ?: [['path' => '', 'alt' => '']]; ?>
<?php foreach ($imgInit as $i => $im): ?>
          <div class="row g-2 align-items-center img-row">
            <div class="col-md-7">
              <div class="input-group input-group-sm">
                <span class="input-group-text bg-light text-muted-nova"><i class="bi bi-image"></i></span>
                <input class="form-control form-control-sm" name="image_path[]" maxlength="255" placeholder="assets/images/filename.webp" value="<?= e($im['path']) ?>">
              </div>
            </div>
            <div class="col-md-4">
              <input class="form-control form-control-sm" name="alt_text[]" maxlength="200" placeholder="Alt description" value="<?= e($im['alt']) ?>">
            </div>
            <div class="col-md-1 text-end">
              <button class="btn btn-outline-danger btn-sm px-2" type="button" data-remove-row aria-label="Remove image"><i class="bi bi-trash"></i></button>
            </div>
          </div>
<?php endforeach; ?>
        </div>
      </div>
    </div>

    <!-- Right Column: Pricing, Rating, Visibility & Actions -->
    <div class="col-lg-4">
      <!-- Card: Pricing & Rating -->
      <div class="admin-card mb-4">
        <div class="admin-card-header">
          <h2 class="admin-card-title h6"><i class="bi bi-tag"></i> Pricing & Reviews</h2>
        </div>
        <div class="row g-3">
          <div class="col-12">
            <label class="form-label fw-medium small" for="pf-price">Regular Price (EGP) <span class="text-danger">*</span></label>
            <div class="input-group">
              <span class="input-group-text bg-white text-muted-nova">EGP</span>
              <input class="form-control" id="pf-price" name="price" type="number" min="1" step="1" required placeholder="1450" value="<?= e($old['price']) ?>">
            </div>
          </div>
          <div class="col-12">
            <label class="form-label fw-medium small" for="pf-old">Compare-at Price (EGP)</label>
            <div class="input-group">
              <span class="input-group-text bg-white text-muted-nova">EGP</span>
              <input class="form-control" id="pf-old" name="old_price" type="number" min="0" step="1" placeholder="Optional original price" value="<?= e($old['old_price']) ?>">
            </div>
            <div class="form-text small text-muted-nova">Displayed with strike-through styling when set.</div>
          </div>
          <div class="col-6">
            <label class="form-label fw-medium small" for="pf-rating">Rating (0 to 5)</label>
            <input class="form-control" id="pf-rating" name="rating" type="number" min="0" max="5" step="0.1" value="<?= e($old['rating']) ?>">
          </div>
          <div class="col-6">
            <label class="form-label fw-medium small" for="pf-reviews">Review Count</label>
            <input class="form-control" id="pf-reviews" name="reviews_count" type="number" min="0" max="1000000" step="1" value="<?= e($old['reviews_count']) ?>">
          </div>
        </div>
      </div>

      <!-- Card: Publishing & Flags -->
      <div class="admin-card mb-4">
        <div class="admin-card-header">
          <h2 class="admin-card-title h6"><i class="bi bi-toggles"></i> Publishing & Flags</h2>
        </div>
        <div class="d-flex flex-column gap-3">
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" role="switch" id="pf-active" name="active" value="1"<?= $old['active'] !== '' ? ' checked' : '' ?>>
            <label class="form-check-label fw-medium" for="pf-active">Active (Visible in Store)</label>
            <div class="text-muted-nova small">Turn off to hide product from storefront navigation without breaking past orders.</div>
          </div>
          <hr class="my-1">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="pf-new" name="is_new" value="1"<?= $old['is_new'] !== '' ? ' checked' : '' ?>>
            <label class="form-check-label" for="pf-new">Mark as New Arrival</label>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="pf-best" name="is_best" value="1"<?= $old['is_best'] !== '' ? ' checked' : '' ?>>
            <label class="form-check-label" for="pf-best">Mark as Bestseller</label>
          </div>
        </div>
      </div>

      <!-- Action Panel -->
      <div class="admin-card">
        <button class="btn btn-nova w-100 py-2 fw-semibold mb-2" type="submit">
          <i class="bi bi-check-lg me-1"></i>
          <span><?= $mode === 'update' ? 'Save Product Changes' : 'Create Product' ?></span>
        </button>
        <a class="btn btn-ghost w-100" href="products.php">Cancel & Return</a>
      </div>
    </div>
  </div>
</form>

<script>
(function () {
  function addRow(containerId, html) {
    var box = document.getElementById(containerId);
    if (!box) return;
    box.insertAdjacentHTML('beforeend', html);
  }
  var spec = document.getElementById('add-spec');
  if (spec) spec.addEventListener('click', function () {
    addRow('spec-rows', '<div class="row g-2 align-items-center spec-row"><div class="col-md-4"><input class="form-control form-control-sm" name="spec_key[]" maxlength="80" placeholder="Label"></div><div class="col-md-7"><input class="form-control form-control-sm" name="spec_value[]" maxlength="255" placeholder="Value"></div><div class="col-md-1 text-end"><button class="btn btn-outline-danger btn-sm px-2" type="button" data-remove-row aria-label="Remove specification"><i class="bi bi-trash"></i></button></div></div>');
  });
  var img = document.getElementById('add-img');
  if (img) img.addEventListener('click', function () {
    addRow('img-rows', '<div class="row g-2 align-items-center img-row"><div class="col-md-7"><div class="input-group input-group-sm"><span class="input-group-text bg-light text-muted-nova"><i class="bi bi-image"></i></span><input class="form-control form-control-sm" name="image_path[]" maxlength="255" placeholder="assets/images/filename.webp"></div></div><div class="col-md-4"><input class="form-control form-control-sm" name="alt_text[]" maxlength="200" placeholder="Alt description"></div><div class="col-md-1 text-end"><button class="btn btn-outline-danger btn-sm px-2" type="button" data-remove-row aria-label="Remove image"><i class="bi bi-trash"></i></button></div></div>');
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-remove-row]');
    if (b) { var row = b.closest('.spec-row, .img-row'); if (row) row.remove(); }
  });
})();
</script>

<?php require __DIR__ . '/../includes/admin-foot.php'; ?>
