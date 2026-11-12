/**
 * NOVA Home — static admin form accessibility regressions.
 * Reads PHP templates only; does not boot the app, authenticate, or access the database.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const productForm = fs.readFileSync(path.join(root, 'admin', 'product-form.php'), 'utf8');
const categories = fs.readFileSync(path.join(root, 'admin', 'categories.php'), 'utf8');
const settings = fs.readFileSync(path.join(root, 'admin', 'settings.php'), 'utf8');
const products = fs.readFileSync(path.join(root, 'admin', 'products.php'), 'utf8');
const orders = fs.readFileSync(path.join(root, 'admin', 'orders.php'), 'utf8');
const orderDetail = fs.readFileSync(path.join(root, 'admin', 'order.php'), 'utf8');
const dashboard = fs.readFileSync(path.join(root, 'admin', 'index.php'), 'utf8');
const pagesCss = fs.readFileSync(path.join(root, 'css', 'pages.css'), 'utf8');

let checks = 0;
function check(condition, message) {
  checks++;
  assert.ok(condition, message);
  console.log(`  [PASS] ${message}`);
}

function countNamedInputs(source, name, accessibleName) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedLabel = accessibleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `<input\\b(?=[^>]*\\bname="${escapedName}")(?=[^>]*\\baria-label="${escapedLabel}")[^>]*>`,
    'g'
  );
  return (source.match(pattern) || []).length;
}

for (const [name, label, description] of [
  ['spec_key[]', 'Specification label', 'Specification label input'],
  ['spec_value[]', 'Specification value', 'Specification value input'],
  ['image_path[]', 'Product image path', 'Product image path input'],
  ['alt_text[]', 'Product image alt text', 'Product image alt-text input']
]) {
  check(
    countNamedInputs(productForm, name, label) === 2,
    `${description} has an accessible name in both initial and dynamically-added rows`
  );
}

check(
  categories.includes('title="Delete category" aria-label="Delete category: <?= e((string) $c[\'name\']) ?>"'),
  'Delete category button exposes an escaped, category-specific accessible name'
);
check(
  categories.includes("<?php if ((int) $c['product_count'] === 0): ?>"),
  'Category deletion remains restricted to empty categories'
);
check(
  categories.includes("onsubmit=\"return confirm('Delete this empty category?');\""),
  'Category deletion retains its existing confirmation step'
);

check(
  categories.includes("$postEditId = is_post() && (($_POST['action'] ?? '') === 'update')") &&
  categories.includes("$editParam = (int) ($_GET['form'] ?? $postEditId);"),
  'Category edit context is restored from the validated POST ID after an unsuccessful update'
);
check(
  categories.includes("if ($_SERVER['REQUEST_METHOD'] === 'GET')") &&
  categories.includes("'name' => $name, 'slug' => $slug, 'image' => $image"),
  'Submitted category values remain in the form instead of being replaced by stored values'
);

const categoryErrorMapStart = categories.indexOf('$errorTargetMap = [');
const categoryErrorMapEnd = categories.indexOf('\n];', categoryErrorMapStart);
const categoryErrorMap = categoryErrorMapStart >= 0 && categoryErrorMapEnd > categoryErrorMapStart
  ? categories.slice(categoryErrorMapStart, categoryErrorMapEnd)
  : '';
check(Boolean(categoryErrorMap), 'Category form defines a server-validation target map');
for (const [message, target] of [
  ['Category name is required.', 'c-name'],
  ['Slug must be lowercase letters, numbers and dashes (e.g. home-decor).', 'c-slug'],
  ['Image must be an existing asset under assets/images/ (e.g. assets/images/cat-decor.svg or .webp).', 'c-image'],
  ['Slug already exists - choose a different one.', 'c-slug']
]) {
  check(categoryErrorMap.includes(`'${message}' => '${target}'`), `Category validation links to ${target}`);
}
check(
  categories.includes('id="category-form-errors" role="alert" aria-labelledby="category-form-error-title"') &&
  categories.includes('href="#<?= e($target) ?>" data-error-target="<?= e($target) ?>"'),
  'Category validation summary is announced and links to affected controls'
);
for (const target of ['c-name', 'c-slug', 'c-image']) {
  check(
    categories.includes(`$fieldHasError('${target}') ? ' is-invalid' : ''`) &&
    categories.includes(`$fieldHasError('${target}') ? ' aria-invalid="true"' : ''`),
    `Category field ${target} exposes invalid visual and programmatic state`
  );
}
check(
  categories.includes('function focusErrorTarget(targetId)') &&
  categories.includes("if (firstErrorLink) focusErrorTarget(firstErrorLink.getAttribute('data-error-target'))") &&
  categories.includes("errorSummary.addEventListener('click'"),
  'Category validation focuses the first invalid field and supports error-summary navigation'
);

const settingsErrorMapStart = settings.indexOf('$errorTargetMap = [');
const settingsErrorMapEnd = settings.indexOf('\n];', settingsErrorMapStart);
const settingsErrorMap = settingsErrorMapStart >= 0 && settingsErrorMapEnd > settingsErrorMapStart
  ? settings.slice(settingsErrorMapStart, settingsErrorMapEnd)
  : '';
check(Boolean(settingsErrorMap), 'Settings form defines a server-validation target map');
for (const [message, target] of [
  ['Business name is required.', 's-name'],
  ['Enter a valid Egyptian phone number (e.g. 01012345678 or +201012345678).', 's-phone'],
  ['Enter a valid contact email address.', 's-email'],
  ['Physical business address is required.', 's-address'],
  ['Delivery fee must be a whole number of 0 or more.', 's-fee'],
  ['Free-delivery threshold must be a whole number of 0 or more.', 's-over']
]) {
  check(settingsErrorMap.includes(`'${message}' => '${target}'`), `Settings validation links to ${target}`);
}
check(
  settings.includes('id="settings-form-errors" role="alert" aria-labelledby="settings-form-error-title"') &&
  settings.includes('href="#<?= e($target) ?>" data-error-target="<?= e($target) ?>"'),
  'Settings validation summary is announced and links to affected controls'
);
for (const target of ['s-name', 's-phone', 's-email', 's-address', 's-fee', 's-over']) {
  check(
    settings.includes(`$fieldHasError('${target}') ? ' is-invalid' : ''`) &&
    settings.includes(`$fieldHasError('${target}') ? ' aria-invalid="true"' : ''`),
    `Settings field ${target} exposes invalid visual and programmatic state`
  );
}
check(
  settings.includes('function focusErrorTarget(targetId)') &&
  settings.includes("if (firstErrorLink) focusErrorTarget(firstErrorLink.getAttribute('data-error-target'))") &&
  settings.includes("errorSummary.addEventListener('click'"),
  'Settings validation focuses the first invalid field and supports error-summary navigation'
);
check(
  products.includes('id="ap-q" name="q" type="search" aria-label="Search products by name or URL slug"'),
  'Admin product search has a programmatic accessible name'
);
check(
  orders.includes('id="o-q" name="q" type="search" aria-label="Search orders by reference or customer name"'),
  'Admin order search has a programmatic accessible name'
);

const mobileProductsStart = products.indexOf('<!-- Mobile Product Cards -->');
const mobileProductsEnd = products.indexOf("<?php require __DIR__ . '/../includes/admin-foot.php'; ?>", mobileProductsStart);
const mobileProducts = mobileProductsStart >= 0 && mobileProductsEnd > mobileProductsStart
  ? products.slice(mobileProductsStart, mobileProductsEnd)
  : '';
check(
  products.includes('class="admin-table-wrap d-none d-xxl-block"') &&
  products.includes('class="admin-products-mobile d-xxl-none d-grid gap-3"'),
  'Desktop product table and mobile product cards switch at the very-wide desktop breakpoint'
);
check(
  mobileProducts.includes('class="admin-card admin-product-mobile-card"') &&
  mobileProducts.includes('admin-product-mobile-thumb') &&
  mobileProducts.includes('<?= e((string) $p[\'cat_name\']) ?>') &&
  mobileProducts.includes('<?= e(nova_money((int) $p[\'price\'])) ?>') &&
  mobileProducts.includes('<?= e((string) $p[\'rating\']) ?>'),
  'Mobile product cards retain image, name, category, price, and catalog rating'
);
check(
  mobileProducts.includes('href="product-form.php?id=<?= e((string) $p[\'slug\']) ?>"') &&
  mobileProducts.includes('name="csrf_token"') &&
  mobileProducts.includes('name="action" value="toggle"') &&
  mobileProducts.includes('name="id" value="<?= e((string) $p[\'id\']) ?>"') &&
  mobileProducts.includes('type="submit">Deactivate') &&
  mobileProducts.includes('type="submit">Activate'),
  'Mobile cards retain the edit link and the existing CSRF-protected visibility action'
);
check(
  mobileProducts.includes('No products found matching the selected filters.') &&
  mobileProducts.includes('href="products.php">Clear Filters</a>'),
  'Mobile product list has a useful filtered-empty state and clear-filters action'
);
check(
  pagesCss.includes('.admin-product-mobile-card__details {') &&
  pagesCss.includes('min-width: 0;') &&
  pagesCss.includes('.admin-product-mobile-card__name {') &&
  pagesCss.includes('overflow-wrap: anywhere;'),
  'Mobile cards constrain long product names and prevent content overflow'
);
check(
  pagesCss.includes('.admin-product-mobile-card__actions .btn {') &&
  pagesCss.includes('min-height: 44px;') &&
  pagesCss.includes('grid-template-columns: repeat(2, minmax(0, 1fr));'),
  'Mobile product actions use two equal-width touch targets of at least 44px'
);
const mobileCategoriesStart = categories.indexOf('<!-- Mobile Category Cards -->');
const mobileCategoriesEnd = categories.indexOf('<script>', mobileCategoriesStart);
const mobileCategories = mobileCategoriesStart >= 0 && mobileCategoriesEnd > mobileCategoriesStart
  ? categories.slice(mobileCategoriesStart, mobileCategoriesEnd)
  : '';
check(
  categories.includes('class="admin-table-wrap d-none d-xxl-block"') &&
  categories.includes('class="admin-categories-mobile d-xxl-none d-grid gap-3"'),
  'Category management switches from the desktop table to cards below the very-wide desktop breakpoint'
);
check(
  mobileCategories.includes('class="admin-card admin-category-mobile-card"') &&
  mobileCategories.includes('admin-category-mobile-thumb') &&
  mobileCategories.includes('<?= e((string) $c[\'name\']) ?>') &&
  mobileCategories.includes('<?= e((string) $c[\'slug\']) ?>') &&
  mobileCategories.includes('<?= e((string) $c[\'sort_order\']) ?>') &&
  mobileCategories.includes('<?= e((string) $c[\'product_count\']) ?>'),
  'Mobile category cards retain image, name, slug, sort order, and product count'
);
check(
  mobileCategories.includes('href="products.php?cat=<?= e((string) $c[\'slug\']) ?>"') &&
  mobileCategories.includes('href="categories.php?form=<?= e((string) $c[\'id\']) ?>"'),
  'Mobile category cards retain product-filter and edit navigation'
);
check(
  mobileCategories.includes('<?php if ($canDelete): ?>') &&
  mobileCategories.includes('name="csrf_token"') &&
  mobileCategories.includes('name="action" value="delete"') &&
  mobileCategories.includes('name="id" value="<?= e((string) $c[\'id\']) ?>"') &&
  mobileCategories.includes("confirm('Delete this empty category?')") &&
  mobileCategories.includes('Deletion is unavailable while products are assigned.'),
  'Mobile category deletion remains CSRF-protected, confirmed, and restricted to empty categories'
);
check(
  mobileCategories.includes('No categories created yet.') &&
  pagesCss.includes('.admin-category-mobile-card__asset code {') &&
  pagesCss.includes('overflow-wrap: anywhere;'),
  'Mobile categories handle empty states and long image asset paths'
);
check(
  pagesCss.includes('.admin-category-mobile-card__actions .btn {') &&
  pagesCss.includes('min-height: 44px;') &&
  pagesCss.includes('.admin-category-mobile-card__actions--single {') &&
  pagesCss.includes('grid-template-columns: minmax(0, 1fr);'),
  'Mobile category actions have 44px touch targets and adapt when deletion is unavailable'
);

const mobileDashboardStart = dashboard.indexOf('<div class="admin-dashboard-orders-mobile');
const mobileDashboardEnd = dashboard.indexOf('<!-- Store Shortcuts & System Status -->', mobileDashboardStart);
const mobileDashboardOrders = mobileDashboardStart >= 0 && mobileDashboardEnd > mobileDashboardStart
  ? dashboard.slice(mobileDashboardStart, mobileDashboardEnd)
  : '';
check(
  dashboard.includes('<div class="d-none d-xxl-block">') &&
  dashboard.includes('class="admin-dashboard-orders-mobile d-xxl-none d-grid gap-3 p-3"'),
  'Dashboard keeps compact recent-order cards until the very-wide desktop breakpoint'
);
check(
  mobileDashboardOrders.includes('class="admin-card admin-dashboard-order-card"') &&
  mobileDashboardOrders.includes("<?= e((string) $o['order_ref']) ?>") &&
  mobileDashboardOrders.includes("<?= e((string) $o['customer_name']) ?>") &&
  mobileDashboardOrders.includes("<?= e(nova_money((int) $o['total'])) ?>") &&
  mobileDashboardOrders.includes("<?= date('M j, Y', strtotime((string) $o['created_at'])) ?>") &&
  mobileDashboardOrders.includes("<?= e(ucfirst((string) $o['status'])) ?>"),
  'Dashboard mobile order cards retain reference, customer, total, date, and fulfillment status'
);
check(
  mobileDashboardOrders.includes('href="order.php?ref=<?= e((string) $o[\'order_ref\']) ?>"') &&
  mobileDashboardOrders.includes('View order details') &&
  mobileDashboardOrders.includes('No orders recorded yet.'),
  'Dashboard mobile cards retain order-detail navigation and the empty state'
);
check(
  dashboard.includes('admin-dashboard-header-actions') &&
  dashboard.includes('admin-dashboard-quick-actions') &&
  dashboard.includes('admin-dashboard-orders__view-all') &&
  pagesCss.includes('.admin-dashboard-order-card__action {') &&
  pagesCss.includes('min-height: 44px;'),
  'Dashboard primary actions and mobile order-detail links meet the 44px touch-target minimum'
);

check(
  orders.includes('class="admin-orders-mobile d-xxl-none d-grid gap-3"') &&
  pagesCss.includes('.admin-orders-mobile .btn {') &&
  pagesCss.includes('min-height: 44px;'),
  'Mobile order-card detail links meet the 44px minimum touch height'
);
const mobileOrderItemsStart = orderDetail.indexOf('<div class="admin-order-items-mobile');
const mobileOrderItemsEnd = orderDetail.indexOf('<!-- Status Transition Workflow Card -->', mobileOrderItemsStart);
const mobileOrderItems = mobileOrderItemsStart >= 0 && mobileOrderItemsEnd > mobileOrderItemsStart
  ? orderDetail.slice(mobileOrderItemsStart, mobileOrderItemsEnd)
  : '';
check(
  orderDetail.includes('class="table-responsive d-none d-xxl-block"') &&
  orderDetail.includes('class="admin-order-items-mobile d-xxl-none d-grid gap-3 p-3"'),
  'Order details keeps item-snapshot cards until the very-wide desktop breakpoint'
);
check(
  mobileOrderItems.includes('class="admin-card admin-order-item-card"') &&
  mobileOrderItems.includes("<?= e((string) $it['product_name']) ?>") &&
  mobileOrderItems.includes("<?= e(nova_money((int) $it['unit_price'])) ?>") &&
  mobileOrderItems.includes("<?= e((string) $it['quantity']) ?>") &&
  mobileOrderItems.includes("<?= e(nova_money((int) $it['line_total'])) ?>") &&
  mobileOrderItems.includes("$resolveItemImage($it['image_path'] ?? null)"),
  'Mobile order-item cards preserve the recorded product snapshot, image, unit price, quantity, and line total'
);
check(
  mobileOrderItems.includes('href="product-form.php?id=<?= e((string) $it[\'prod_slug\']) ?>"') &&
  mobileOrderItems.includes('No item snapshots are recorded for this order.'),
  'Mobile order-item cards retain catalog navigation and an empty state'
);
check(
  pagesCss.includes('.admin-order-item-card__meta {') &&
  pagesCss.includes('grid-template-columns: minmax(0, 1fr) minmax(2.5rem, .55fr) minmax(0, 1.1fr);') &&
  pagesCss.includes('.admin-order-item-card__details {') &&
  pagesCss.includes('overflow-wrap: anywhere;'),
  'Mobile order-item cards wrap long product names and keep price/quantity columns contained'
);

check(
  orderDetail.includes('class="admin-order-status-form"') &&
  orderDetail.includes('id="o-newstatus" name="status"') &&
  pagesCss.includes('.admin-order-status-form .form-select {') &&
  pagesCss.includes('.admin-order-status-form .btn {') &&
  pagesCss.includes('width: 100%;'),
  'Order status controls receive larger touch targets and a full-width mobile action'
);

const validationMapStart = productForm.indexOf('$errorTargetMap = [');
const validationMapEnd = productForm.indexOf('\n];', validationMapStart);
const validationMap = validationMapStart >= 0 && validationMapEnd > validationMapStart
  ? productForm.slice(validationMapStart, validationMapEnd)
  : '';
check(Boolean(validationMap), 'Product form defines a server-validation target map');

for (const [message, target] of [
  ['Product name is required.', 'pf-name'],
  ['Slug must be lowercase letters, numbers and dashes (e.g. sahara-vase).', 'pf-slug'],
  ['Category is invalid.', 'pf-cat'],
  ['Price must be a valid amount (1 or more EGP).', 'pf-price'],
  ['Old price must be a valid amount.', 'pf-old'],
  ['Rating must be between 0 and 5.', 'pf-rating'],
  ['Description is required.', 'pf-desc'],
  ['Each specification needs both a label and a value.', 'spec-rows'],
  ['A product can have at most 20 specifications.', 'spec-rows'],
  ['Image paths must reference an existing file under assets/images/ with an approved format (.webp, .jpg, .jpeg, .png, .svg).', 'img-rows'],
  ['A product can have at most 9 images.', 'img-rows'],
  ['Slug already exists - choose a different one.', 'pf-slug']
]) {
  check(
    validationMap.includes(`'${message}' => '${target}'`),
    `Validation error links to its matching control/group: ${target}`
  );
}

check(
  productForm.includes('id="product-form-errors" role="alert" aria-labelledby="product-form-error-title"') &&
  productForm.includes('id="product-form-error-title"'),
  'Validation summary is announced as an alert with an accessible heading'
);
check(
  productForm.includes('href="#<?= e($target) ?>" data-error-target="<?= e($target) ?>"'),
  'Each mapped validation message is a navigable link to its affected field/group'
);

for (const target of ['pf-name', 'pf-slug', 'pf-cat', 'pf-price', 'pf-old', 'pf-rating', 'pf-desc']) {
  check(
    productForm.includes(`$fieldHasError('${target}') ? ' is-invalid' : ''`) &&
    productForm.includes(`$fieldHasError('${target}') ? ' aria-invalid="true"' : ''`),
    `${target} receives visual and programmatic invalid-state feedback`
  );
}

check(
  productForm.includes('function focusErrorTarget(targetId)') &&
  productForm.includes("if (firstErrorLink) focusErrorTarget(firstErrorLink.getAttribute('data-error-target'))"),
  'The first affected field receives focus after a server-validation response'
);
check(
  productForm.includes("errorSummary.addEventListener('click'") &&
  productForm.includes("focusErrorTarget(link.getAttribute('data-error-target'))"),
  'Activating an error-summary link moves focus to the matching field/group'
);
check(
  productForm.includes('id="spec-rows" class="d-flex flex-column gap-2" tabindex="-1"') &&
  productForm.includes('id="img-rows" class="d-flex flex-column gap-2" tabindex="-1"'),
  'Repeater error targets remain keyboard-focusable when JavaScript is unavailable'
);

console.log(`\\nADMIN FORM ACCESSIBILITY TESTS PASSED: ${checks} checks.\\n`);
