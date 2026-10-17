<?php
/**
 * NOVA Home - admin/categories.php (Phase 6/8).
 * Redesigned category management interface:
 * List with product counts via LEFT JOIN, add/edit form card, and guarded deletion.
 * All mutations: POST + require_admin + CSRF + server validation.
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once NOVA_ROOT . '/includes/admin-auth.php';
require_admin(false);
$admin = nova_admin_user();
$pdo = nova_pdo();

$ok = (string) ($_GET['ok'] ?? '');
$err = (string) ($_GET['err'] ?? '');
$errs = [];
$old = ['name' => '', 'slug' => '', 'image' => '', 'sort_order' => '0'];
$editing = null;
$showForm = ($_GET['form'] ?? '') === 'new';

/* ---------------------------- mutations (POST) --------------------------- */
if (is_post()) {
    if (!nova_verify_csrf($_POST['csrf_token'] ?? null)) {
        redirect('admin/categories.php?err=csrf');
    }
    $action = (string) ($_POST['action'] ?? '');

    // Deletion carries only csrf+action+id - handle before field validation.
    if ($action === 'delete') {
        $delId = v_int_range($_POST['id'] ?? null, 1, 1000000);
        if ($delId === null) {
            redirect('admin/categories.php?err=not_found');
        }
        try {
            $cnt = $pdo->prepare('SELECT COUNT(*) FROM `products` WHERE `category_id` = :id');
            $cnt->execute([':id' => $delId]);
            if ((int) $cnt->fetchColumn() > 0) {
                redirect('admin/categories.php?err=has_products');
            }
            $del = $pdo->prepare('DELETE FROM `categories` WHERE `id` = :id');
            $del->execute([':id' => $delId]);
            redirect('admin/categories.php?ok=deleted');
        } catch (PDOException $pe) {
            error_log('[NOVA admin/categories delete] ' . $pe->getMessage());
            redirect('admin/categories.php?err=invalid');
        }
    }

    $name = v_text($_POST['name'] ?? '', 100);
    $slug = strtolower(trim((string) ($_POST['slug'] ?? '')));
    $image = trim((string) ($_POST['image'] ?? ''));
    $sort = v_int_range($_POST['sort_order'] ?? '0', -9999, 9999) ?? 0;
    $old = ['name' => $name, 'slug' => $slug, 'image' => $image, 'sort_order' => (string) $sort];

    if ($name === '') {
        $errs[] = 'Category name is required.';
    }
    if (!v_slug($slug)) {
        $errs[] = 'Slug must be lowercase letters, numbers and dashes (e.g. home-decor).';
    }
    if (!v_image_path($image)) {
        $errs[] = 'Image must be an existing asset under assets/images/ (e.g. assets/images/cat-decor.svg or .webp).';
    }
    if ($action === 'update') {
        $id = v_int_range($_POST['id'] ?? null, 1, 1000000);
        if ($id === null) {
            $errs[] = 'Category is invalid.';
        }
    }
    if (!$errs) {
        try {
            if ($action === 'create') {
                $ins = $pdo->prepare('INSERT INTO `categories` (`slug`, `name`, `image`, `sort_order`) VALUES (:slug, :name, :image, :sort)');
                $ins->execute([':slug' => $slug, ':name' => $name, ':image' => $image, ':sort' => $sort]);
                redirect('admin/categories.php?ok=created');
            } elseif ($action === 'update') {
                $upd = $pdo->prepare('UPDATE `categories` SET `slug` = :slug, `name` = :name, `image` = :image, `sort_order` = :sort WHERE `id` = :id');
                $upd->execute([':slug' => $slug, ':name' => $name, ':image' => $image, ':sort' => $sort, ':id' => $id]);
                redirect('admin/categories.php?ok=updated');
            }
            redirect('admin/categories.php?err=invalid');
        } catch (PDOException $pe) {
            if ($pe->getCode() === '23000') {
                $errs[] = 'Slug already exists - choose a different one.';
            } else {
                error_log('[NOVA admin/categories] ' . $pe->getMessage());
                $errs[] = 'Unable to save category.';
            }
        }
    }
    $showForm = true; // re-render form with errors + submitted values
}

/* ------------------------------- data reads ------------------------------ */
$categories = $pdo->query(
    'SELECT c.`id`, c.`slug`, c.`name`, c.`image`, c.`sort_order`, COUNT(p.`id`) AS `product_count`'
    . ' FROM `categories` c LEFT JOIN `products` p ON p.`category_id` = c.`id`'
    . ' GROUP BY c.`id`, c.`slug`, c.`name`, c.`image`, c.`sort_order`'
    . ' ORDER BY c.`sort_order` ASC, c.`name` ASC'
)->fetchAll();

$editParam = (int) ($_GET['form'] ?? 0);
if ($editParam > 0) {
    $showForm = true;
    foreach ($categories as $c) {
        if ((int) $c['id'] === $editParam) {
            $editing = $c;
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $old = [
                    'name' => (string) $c['name'],
                    'slug' => (string) $c['slug'],
                    'image' => (string) $c['image'],
                    'sort_order' => (string) $c['sort_order']
                ];
            }
            break;
        }
    }
    if (!$editing && !$errs && $_SERVER['REQUEST_METHOD'] === 'GET') {
        redirect('admin/categories.php?err=not_found');
    }
}

$flashes = [
    'created'      => ['success', 'Category created successfully.'],
    'updated'      => ['success', 'Category updated successfully.'],
    'deleted'      => ['success', 'Category deleted.'],
    'csrf'         => ['danger', 'Your session expired. Please refresh and try again.'],
    'has_products' => ['danger', 'Cannot delete: this category still contains products. Reassign or deactivate them first.'],
    'not_found'    => ['danger', 'Category not found.'],
    'invalid'      => ['danger', 'Unable to save category.'],
];
$flash = $flashes[$err] ?? ($ok !== '' ? ($flashes[$ok] ?? null) : null);

$adminTitle = 'Categories | NOVA Admin';
$adminNav = 'categories';
require __DIR__ . '/../includes/admin-head.php';
?>

<!-- Header -->
<div class="d-flex flex-wrap gap-3 align-items-center justify-content-between mb-4">
  <div>
    <h1 class="h3 fw-semibold mb-1">Categories</h1>
    <p class="text-muted-nova mb-0 small">Organize storefront navigation and filterable product collections.</p>
  </div>
  <?php if (!$showForm): ?>
  <a class="btn btn-nova btn-sm d-inline-flex align-items-center gap-1 shadow-sm" href="categories.php?form=new">
    <i class="bi bi-plus-lg" aria-hidden="true"></i>
    <span>Add Category</span>
  </a>
  <?php endif; ?>
</div>

<?php if ($flash): ?>
<div class="alert alert-<?= e($flash[0]) ?> alert-dismissible fade show d-flex align-items-center gap-2 mb-4" role="alert">
  <i class="bi <?= $flash[0] === 'success' ? 'bi-check-circle-fill text-success' : 'bi-exclamation-triangle-fill text-danger' ?>"></i>
  <div><?= e($flash[1]) ?></div>
  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
</div>
<?php endif; ?>

<?php if ($showForm): ?>
<!-- Add / Edit Form Card -->
<div class="admin-card mb-4">
  <div class="admin-card-header">
    <h2 class="admin-card-title h6">
      <i class="bi <?= $editing ? 'bi-pencil-square' : 'bi-folder-plus' ?>"></i>
      <span><?= $editing ? 'Edit Category' : 'Create New Category' ?></span>
    </h2>
    <a class="btn btn-ghost btn-sm" href="categories.php">Close</a>
  </div>

  <?php if ($errs): ?>
  <div class="alert alert-danger mb-4" role="alert">
    <div class="fw-semibold mb-1"><i class="bi bi-exclamation-triangle-fill me-2"></i>Please fix the following:</div>
    <ul class="mb-0 ps-3">
      <?php foreach ($errs as $m): ?>
        <li><?= e($m) ?></li>
      <?php endforeach; ?>
    </ul>
  </div>
  <?php endif; ?>

  <form method="post" action="categories.php" novalidate>
    <input type="hidden" name="csrf_token" value="<?= e(nova_csrf_token()) ?>">
    <input type="hidden" name="action" value="<?= $editing ? 'update' : 'create' ?>">
    <?php if ($editing): ?>
    <input type="hidden" name="id" value="<?= e((string) $editing['id']) ?>">
    <?php endif; ?>

    <div class="row g-3">
      <div class="col-md-6">
        <label class="form-label fw-medium small" for="c-name">Category Name <span class="text-danger">*</span></label>
        <input class="form-control" id="c-name" name="name" maxlength="100" required placeholder="e.g. Living Room" value="<?= e($old['name']) ?>">
      </div>
      <div class="col-md-6">
        <label class="form-label fw-medium small" for="c-slug">URL Slug <span class="text-danger">*</span></label>
        <input class="form-control" id="c-slug" name="slug" maxlength="60" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="e.g. living-room" value="<?= e($old['slug']) ?>">
        <div class="form-text small text-muted-nova">Lowercase letters, numbers, and hyphens. Used in shop URLs.</div>
      </div>
      <div class="col-md-8">
        <label class="form-label fw-medium small" for="c-image">Image Asset Path <span class="text-danger">*</span></label>
        <div class="input-group">
          <span class="input-group-text bg-white text-muted-nova"><i class="bi bi-image"></i></span>
          <input class="form-control" id="c-image" name="image" maxlength="255" required placeholder="assets/images/cat-decor.svg" value="<?= e($old['image']) ?>">
        </div>
        <div class="form-text small text-muted-nova">Path to asset under <code>assets/images/</code> (.webp, .jpg, .svg).</div>
      </div>
      <div class="col-md-4">
        <label class="form-label fw-medium small" for="c-sort">Display Sort Order</label>
        <input class="form-control" id="c-sort" name="sort_order" type="number" min="-9999" max="9999" value="<?= e($old['sort_order'] !== '' ? $old['sort_order'] : '0') ?>">
        <div class="form-text small text-muted-nova">Lower numbers appear first in menus.</div>
      </div>
    </div>

    <div class="d-flex align-items-center gap-2 mt-4 pt-2 border-top">
      <button class="btn btn-nova px-4" type="submit"><?= $editing ? 'Save Changes' : 'Create Category' ?></button>
      <a class="btn btn-ghost" href="categories.php">Cancel</a>
    </div>
  </form>
</div>
<?php endif; ?>

<!-- Categories Table -->
<div class="admin-table-wrap">
  <div class="p-3 border-bottom d-flex justify-content-between align-items-center">
    <span class="small text-muted-nova"><strong><?= count($categories) ?></strong> categories defined in database</span>
    <span class="small text-muted-nova">Categories with assigned products cannot be deleted</span>
  </div>

  <div class="table-responsive">
    <table class="table align-middle m-0">
      <thead>
        <tr>
          <th scope="col" style="min-width: 220px;">Category</th>
          <th scope="col">Slug</th>
          <th scope="col">Image Asset</th>
          <th scope="col">Sort Order</th>
          <th scope="col">Products</th>
          <th scope="col" class="text-end" style="min-width: 140px;">Actions</th>
        </tr>
      </thead>
      <tbody>
<?php foreach ($categories as $c): ?>
  <?php
    $cImg = (string) $c['image'];
    $cSrc = $cImg !== '' ? '../' . ltrim($cImg, '/') : '../assets/images/cat-decor.svg';
  ?>
        <tr>
          <td>
            <div class="d-flex align-items-center gap-3">
              <img class="admin-prod-thumb" src="<?= e($cSrc) ?>" width="44" height="44" alt="" loading="lazy">
              <div>
                <a href="categories.php?form=<?= e((string) $c['id']) ?>" class="fw-semibold text-decoration-none text-dark">
                  <?= e((string) $c['name']) ?>
                </a>
              </div>
            </div>
          </td>
          <td><code class="small text-muted-nova"><?= e((string) $c['slug']) ?></code></td>
          <td><span class="small text-muted-nova text-truncate d-inline-block" style="max-width: 200px;" title="<?= e((string) $c['image']) ?>"><?= e((string) $c['image']) ?></span></td>
          <td><span class="badge bg-light text-dark border"><?= e((string) $c['sort_order']) ?></span></td>
          <td>
            <a href="products.php?cat=<?= e((string) $c['slug']) ?>" class="badge bg-secondary-subtle text-secondary-emphasis text-decoration-none border">
              <?= e((string) $c['product_count']) ?> product<?= (int) $c['product_count'] === 1 ? '' : 's' ?>
            </a>
          </td>
          <td class="text-end">
            <div class="d-inline-flex align-items-center gap-1">
              <a class="btn btn-ghost btn-sm" href="categories.php?form=<?= e((string) $c['id']) ?>">
                <i class="bi bi-pencil me-1"></i>Edit
              </a>
              <?php if ((int) $c['product_count'] === 0): ?>
              <form method="post" action="categories.php" class="m-0 d-inline" onsubmit="return confirm('Delete this empty category?');">
                <input type="hidden" name="csrf_token" value="<?= e(nova_csrf_token()) ?>">
                <input type="hidden" name="action" value="delete">
                <input type="hidden" name="id" value="<?= e((string) $c['id']) ?>">
                <button class="btn btn-outline-danger btn-sm" type="submit" title="Delete category"><i class="bi bi-trash"></i></button>
              </form>
              <?php endif; ?>
            </div>
          </td>
        </tr>
<?php endforeach; ?>
<?php if (!$categories): ?>
        <tr><td colspan="6" class="text-muted-nova text-center py-4">No categories created yet.</td></tr>
<?php endif; ?>
      </tbody>
    </table>
  </div>
</div>

<?php require __DIR__ . '/../includes/admin-foot.php'; ?>
