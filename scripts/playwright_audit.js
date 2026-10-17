/**
 * NOVA Home — Phase 11 Full-Route Playwright Browser Audit Suite.
 */
const { chromium } = require('C:/Users/Youssef/AppData/Roaming/npm/node_modules/@executeautomation/playwright-mcp-server/node_modules/playwright');
const { execSync } = require('child_process');

const BASE_URL = 'http://localhost/nova-home/nova-home/';

let passed = 0;
let failed = 0;
const failures = [];

function assertTest(cond, name, details = '') {
  if (cond) {
    passed++;
    console.log(`  [PASS] ${name}`);
  } else {
    failed++;
    failures.push({ name, details });
    console.log(`  [FAIL] ${name} ${details ? '(' + details + ')' : ''}`);
  }
}

async function runAudit() {
  console.log('=== STARTING PLAYWRIGHT BROWSER AUDIT ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const pageErrors = [];
  const consoleErrors = [];

  context.on('page', p => {
    p.on('pageerror', err => {
      pageErrors.push({ url: p.url(), error: err.message });
    });
    p.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore expected guest 401s when checking profile prefill
        if (!text.includes('401') && !text.includes('404')) {
          consoleErrors.push({ url: p.url(), text });
        }
      }
    });
  });

  const page = await context.newPage();

  try {
    // -------------------------------------------------------------------------
    // STAGE 1: Full Route Inventory & HTTP Status Verification
    // -------------------------------------------------------------------------
    console.log('--- Stage 1: Full Route Inventory ---');

    const routes = [
      // Public Storefront
      { path: 'index.html', title: 'NOVA Home' },
      { path: 'shop.html', title: 'Shop' },
      { path: 'shop.html?cat=decor', title: 'Shop' },
      { path: 'shop.html?q=lamp', title: 'Shop' },
      { path: 'shop.html?sort=new', title: 'Shop' },
      { path: 'shop.html?wish=1', title: 'Shop' },
      { path: 'product.html?id=sahara-vase', title: 'Sahara Ceramic Vase' },
      { path: 'product.html?id=luna-floor-lamp', title: 'Luna Arc Floor Lamp' },
      { path: 'product.html?id=missing-item', title: 'Product not found' },
      { path: 'cart.html', title: 'Your cart' },
      { path: 'checkout.html', title: 'Checkout' },
      { path: 'order-success.html', title: 'Order confirmed' },
      { path: 'account/wishlist.html', title: 'Wishlist' },

      // Account Pages (Anonymous should redirect to login.php)
      { path: 'account/login.php', title: 'Sign in' },
      { path: 'account/register.php', title: 'Create account' },
      { path: 'account/index.php', redirect: 'login.php' },
      { path: 'account/profile.php', redirect: 'login.php' },
      { path: 'account/addresses.php', redirect: 'login.php' },
      { path: 'account/orders.php', redirect: 'login.php' },
      { path: 'account/order.php?ref=NH-20261005-14464A', redirect: 'login.php' },

      // Account Redirect Stubs
      { path: 'account/index.html', redirect: 'login.php' },
      { path: 'account/login.html', redirect: 'login.php' },
      { path: 'account/register.html', redirect: 'register.php' },
      { path: 'account/profile.html', redirect: 'login.php' },
      { path: 'account/addresses.html', redirect: 'login.php' },
      { path: 'account/orders.html', redirect: 'login.php' },
      { path: 'account/order.html?ref=NH-20261005-14464A', redirect: 'login.php' },

      // Admin Pages (Anonymous should redirect to admin/login.php)
      { path: 'admin/login.php', title: 'Sign in' },
      { path: 'admin/index.php', redirect: 'login.php' },
      { path: 'admin/products.php', redirect: 'login.php' },
      { path: 'admin/product-form.php', redirect: 'login.php' },
      { path: 'admin/categories.php', redirect: 'login.php' },
      { path: 'admin/orders.php', redirect: 'login.php' },
      { path: 'admin/order.php?ref=NH-20261005-14464A', redirect: 'login.php' },
      { path: 'admin/settings.php', redirect: 'login.php' },

      // Admin Redirect Stubs
      { path: 'admin/index.html', redirect: 'login.php' },
      { path: 'admin/login.html', redirect: 'login.php' },
      { path: 'admin/products.html', redirect: 'login.php' },
      { path: 'admin/product-form.html', redirect: 'login.php' },
      { path: 'admin/categories.html', redirect: 'login.php' },
      { path: 'admin/orders.html', redirect: 'login.php' },
      { path: 'admin/order.html?ref=NH-20261005-14464A', redirect: 'login.php' },
      { path: 'admin/settings.html', redirect: 'login.php' },
    ];

    for (const r of routes) {
      const resp = await page.goto(BASE_URL + r.path, { waitUntil: 'load' });
      const status = resp.status();

      // If it's a product detail page, wait for the dynamic title update
      if (r.path.startsWith('product.html')) {
        await page.waitForFunction(() => document.title !== 'Product | NOVA Home', { timeout: 4000 }).catch(() => {});
      }

      const currentUrl = page.url();
      const title = await page.title();

      if (r.redirect) {
        assertTest(
          currentUrl.includes(r.redirect),
          `Route ${r.path} redirects to ${r.redirect}`,
          `Ended at ${currentUrl}`
        );
      } else {
        assertTest(
          status === 200,
          `Route ${r.path} loads with HTTP 200`,
          `Status: ${status}`
        );
        if (r.title) {
          assertTest(
            title.toLowerCase().includes(r.title.toLowerCase()),
            `Route ${r.path} has title containing "${r.title}"`,
            `Title: ${title}`
          );
        }
      }
    }

    // -------------------------------------------------------------------------
    // STAGE 2: Responsive Document Overflow Checks (6 Viewports)
    // -------------------------------------------------------------------------
    console.log('\n--- Stage 2: Responsive Document Overflow Checks ---');
    const viewports = [390, 430, 768, 1024, 1280, 1366];
    const responsivePages = ['index.html', 'shop.html', 'product.html?id=sahara-vase', 'cart.html', 'checkout.html', 'account/login.php', 'admin/login.php'];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp, height: 800 });
      for (const p of responsivePages) {
        await page.goto(BASE_URL + p, { waitUntil: 'load' });
        await page.waitForTimeout(300);
        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        assertTest(!overflow, `No horizontal scrollbar at ${vp}px on ${p}`);
      }
    }

    // Reset standard viewport
    await page.setViewportSize({ width: 1280, height: 800 });

    // -------------------------------------------------------------------------
    // STAGE 3: Workflow 1 — Storefront, Catalog, Quick View & Cart
    // -------------------------------------------------------------------------
    console.log('\n--- Stage 3: Workflow 1 — Storefront & Quick View ---');
    await page.goto(BASE_URL + 'index.html', { waitUntil: 'load' });
    await page.waitForSelector('[data-delivery-announcement]');

    const announcement = await page.textContent('[data-delivery-announcement]');
    assertTest(announcement.includes('Free delivery over EGP 1,500'), 'Announcement bar renders correct threshold');

    // Open Quick View for first product card
    const firstQuickBtn = page.locator('[data-quick]').first();
    await firstQuickBtn.click();
    await page.waitForSelector('#quickModal.show', { timeout: 3000 });
    const qvTitle = await page.textContent('#qv-title');
    assertTest(qvTitle.length > 0, `Quick View opened for: ${qvTitle}`);

    // Increase qty in Quick View and Add to Cart
    await page.click('#qv-plus');
    const qvQty = await page.textContent('#qv-qty');
    assertTest(qvQty === '2', 'Quantity increased to 2 in Quick View');
    await page.click('#qv-add');
    await page.waitForTimeout(500);

    const badgeText = await page.textContent('[data-cart-count]');
    assertTest(parseInt(badgeText, 10) >= 2, `Cart badge updated to: ${badgeText}`);

    // -------------------------------------------------------------------------
    // STAGE 4: Workflow 2 — Guest Checkout & Authoritative Success Page
    // -------------------------------------------------------------------------
    console.log('\n--- Stage 4: Workflow 2 — Guest Checkout ---');
    await page.goto(BASE_URL + 'cart.html', { waitUntil: 'load' });
    await page.waitForSelector('#cart-lines li');
    const cartItemsCount = await page.locator('#cart-lines li').count();
    assertTest(cartItemsCount >= 1, `Cart page renders line items (${cartItemsCount})`);

    await page.click('a[href="checkout.html"]');
    await page.waitForURL('**/checkout.html', { timeout: 5000 });

    await page.fill('#c-name', 'Guest E2E Tester');
    await page.fill('#c-phone', '01012345678');
    await page.fill('#c-email', 'guest_e2e_test@novahome.eg');
    await page.selectOption('#c-city', 'Cairo');
    await page.fill('#c-apt', 'Building 12, Apt 3');
    await page.fill('#c-address', '10 Garden City St');
    await page.fill('#c-notes', 'Please call upon arrival');

    await page.click('#place-order');
    await page.waitForURL('**/order-success.html?ref=NH-*', { timeout: 8000 });

    const guestOrderRef = new URL(page.url()).searchParams.get('ref');
    assertTest(guestOrderRef && guestOrderRef.startsWith('NH-'), `Guest order created with ref: ${guestOrderRef}`);

    await page.waitForSelector('#ok-ref');
    const renderedRef = await page.textContent('#ok-ref');
    assertTest(renderedRef === guestOrderRef, 'Authoritative order ref rendered on success page');
    const renderedTotal = await page.textContent('#ok-total');
    assertTest(renderedTotal !== '—' && renderedTotal.includes('EGP'), `Total rendered from DB: ${renderedTotal}`);

    const storedCart = await page.evaluate(() => localStorage.getItem('nova_cart'));
    assertTest(storedCart === '[]' || storedCart === null, 'Cart cleared from localStorage after success');

    // -------------------------------------------------------------------------
    // STAGE 5: Workflow 3 & 4 — Customer Accounts & Authed Checkout
    // -------------------------------------------------------------------------
    console.log('\n--- Stage 5: Workflows 3 & 4 — Customer Accounts & Authed Checkout ---');
    await page.goto(BASE_URL + 'account/register.php', { waitUntil: 'load' });

    const testCustEmail = `e2e_cust_${Date.now()}@novahome.eg`;
    await page.fill('#r-name', 'E2E Account Customer');
    await page.fill('#r-email', testCustEmail);
    await page.fill('#r-phone', '01212345678');
    await page.fill('#r-pass', 'SecurePass2026!');
    await page.fill('#r-pass2', 'SecurePass2026!');
    await page.click('#cust-register-btn');

    await page.waitForURL('**/account/index.php', { timeout: 6000 });
    assertTest(page.url().includes('account/index.php'), 'Registered and redirected to customer dashboard');

    const welcome = await page.textContent('.account-head');
    assertTest(welcome.includes('E2E Account Customer'), 'Dashboard displays customer name');

    // Manage Addresses
    await page.click('a[href="addresses.php"]');
    await page.waitForURL('**/account/addresses.php', { timeout: 5000 });

    await page.fill('#a-recipient', 'E2E Recipient');
    await page.fill('#a-phone', '01212345678');
    await page.selectOption('#a-city', 'Alexandria');
    await page.fill('#a-label', 'Beach House');
    await page.fill('#a-street', 'Corniche Road');
    await page.fill('#a-apt', 'Flat 5');
    await page.check('#a-default');
    await page.click('#addr-btn');
    await page.waitForTimeout(1000);

    const addrListText = await page.textContent('#addr-list');
    assertTest(addrListText.includes('Beach House') && addrListText.includes('Corniche Road'), 'New address saved and rendered');

    // Place an authenticated order
    await page.goto(BASE_URL + 'shop.html', { waitUntil: 'load' });
    await page.locator('.product-card__add').first().click();
    await page.waitForTimeout(500);

    await page.goto(BASE_URL + 'checkout.html', { waitUntil: 'load' });
    await page.waitForTimeout(800);
    const prefilledName = await page.inputValue('#c-name');
    assertTest(prefilledName === 'E2E Account Customer', 'Authenticated checkout pre-filled customer name');

    await page.fill('#c-phone', '01212345678');
    await page.selectOption('#c-city', 'Alexandria');
    await page.fill('#c-apt', 'Flat 5');
    await page.fill('#c-address', 'Corniche Road');

    await page.click('#place-order');
    await page.waitForURL('**/order-success.html?ref=NH-*', { timeout: 8000 });

    const authedOrderRef = new URL(page.url()).searchParams.get('ref');
    assertTest(authedOrderRef && authedOrderRef.startsWith('NH-'), `Authed order placed: ${authedOrderRef}`);

    // View customer order history
    await page.goto(BASE_URL + 'account/orders.php', { waitUntil: 'load' });
    const ordersBody = await page.textContent('main');
    assertTest(ordersBody.includes(authedOrderRef), 'Customer order history lists newly created order');
    assertTest(!ordersBody.includes(guestOrderRef), 'Customer order history DOES NOT list guest order');

    // View order detail
    await page.click(`a[href="order.php?ref=${authedOrderRef}"]`);
    await page.waitForURL(`**/account/order.php?ref=${authedOrderRef}`, { timeout: 5000 });
    const detailHead = await page.textContent('main');
    assertTest(detailHead.includes(authedOrderRef) && detailHead.includes('Corniche Road'), 'Customer order detail loads historical details');

    // Return to orders list and sign out customer
    await page.click('a[href="orders.php"]');
    await page.waitForURL('**/account/orders.php', { timeout: 5000 });
    await page.click('#cust-logout');
    await page.waitForURL('**/account/login.php', { timeout: 5000 });
    assertTest(page.url().includes('account/login.php'), 'Customer signed out to login.php');

    await page.goto(BASE_URL + 'account/index.php');
    assertTest(page.url().includes('account/login.php'), 'Access to account/index.php after logout redirects to login.php');

    // -------------------------------------------------------------------------
    // STAGE 6: Workflow 5 — Admin Management
    // -------------------------------------------------------------------------
    console.log('\n--- Stage 6: Workflow 5 — Admin Management ---');
    // Ensure temp admin exists for test
    try {
      execSync('php scripts/create_temp_admin.php', { cwd: 'C:\\xampp\\htdocs\\nova-home\\nova-home' });
    } catch {}
    await page.goto(BASE_URL + 'admin/login.php', { waitUntil: 'load' });

    await page.fill('#a-email', 'audit_admin@novahome.eg');
    await page.fill('#a-pass', 'TempAuditAdminPass123!');
    await page.click('#admin-login-btn');

    await page.waitForURL('**/admin/index.php', { timeout: 6000 });
    assertTest(page.url().includes('admin/index.php'), 'Admin logged in and redirected to admin/index.php');

    const adminDash = await page.textContent('main');
    assertTest(adminDash.includes('Dashboard') && adminDash.includes('Products'), 'Admin dashboard loaded');

    // Admin Products
    await page.click('a[href="products.php"]');
    await page.waitForURL('**/admin/products.php', { timeout: 5000 });
    const prodCount = await page.locator('table tbody tr').count();
    assertTest(prodCount === 14, `Admin products table renders 14 products (${prodCount})`);

    // Admin Categories
    await page.click('a[href="categories.php"]');
    await page.waitForURL('**/admin/categories.php', { timeout: 5000 });
    const catCount = await page.locator('table tbody tr').count();
    assertTest(catCount === 5, `Admin categories table renders 5 categories (${catCount})`);

    // Admin Orders
    await page.click('a[href="orders.php"]');
    await page.waitForURL('**/admin/orders.php', { timeout: 5000 });
    const ordersList = await page.textContent('table');
    assertTest(ordersList.includes('NH-'), 'Admin orders table renders orders');

    // Admin Settings
    await page.click('a[href="settings.php"]');
    await page.waitForURL('**/admin/settings.php', { timeout: 5000 });
    const bizName = await page.inputValue('input[name="setting[business_name]"]');
    assertTest(bizName === 'NOVA Home', 'Admin settings loads business_name = "NOVA Home"');

    // Admin Logout
    await page.click('#admin-logout');
    await page.waitForURL('**/admin/login.php', { timeout: 5000 });
    assertTest(page.url().includes('admin/login.php'), 'Admin logged out to login.php');

    await page.goto(BASE_URL + 'admin/index.php');
    assertTest(page.url().includes('admin/login.php'), 'Anonymous access to admin/index.php redirected to login.php');

  } finally {
    await browser.close();

    console.log('\n--- Stage 7: Test Data Cleanup ---');
    try {
      const out = execSync('php scripts/cleanup_test_data.php', { cwd: 'C:\\xampp\\htdocs\\nova-home\\nova-home' }).toString();
      console.log(out.trim());
    } catch (e) {
      console.error('Cleanup error:', e.message);
    }
  }

  console.log(`\n========================================`);
  console.log(`PLAYWRIGHT AUDIT COMPLETE`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Page JS Errors: ${pageErrors.length}`);
  console.log(`Console Errors: ${consoleErrors.length}`);
  console.log(`========================================\n`);

  if (pageErrors.length > 0) {
    console.log('PAGE JS ERRORS:');
    pageErrors.forEach(e => console.log(`  [${e.url}] ${e.error}`));
  }
  if (consoleErrors.length > 0) {
    console.log('CONSOLE ERRORS:');
    consoleErrors.forEach(e => console.log(`  [${e.url}] ${e.text}`));
  }

  process.exit(failed === 0 && pageErrors.length === 0 ? 0 : 1);
}

runAudit().catch(err => {
  console.error('Audit fatal error:', err);
  process.exit(1);
});
