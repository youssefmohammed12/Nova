/**
 * NOVA Home — Phase 11 Full-Route Playwright Browser Audit Suite.
 */
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const { randomBytes } = require('crypto');

const BASE_URL = (process.env.NOVA_BASE_URL || 'http://localhost/nova-home/nova-home/').replace(/\/?$/, '/');
let testCustEmail = '';
let testCustomerPassword = '';
let tempAdminPassword = '';
let tempAdminCreated = false;
let cleanupFailed = false;

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
  const httpErrors = [];
  const expectedHttpStatuses = [];
  const expectedConsoleErrors = [];
  let expectedGuestCheckout401ConsoleCredits = 0;

  context.on('page', p => {
    p.on('pageerror', err => {
      pageErrors.push({ url: p.url(), error: err.message });
    });
    p.on('response', response => {
      const status = response.status();
      if (status < 400) return;

      const pageUrl = new URL(p.url());
      const requestUrl = new URL(response.url());
      const isExpectedGuestCheckout401 = status === 401
        && pageUrl.pathname.endsWith('/checkout.html')
        && requestUrl.pathname.endsWith('/api/customer-profile.php');

      if (isExpectedGuestCheckout401) {
        expectedHttpStatuses.push({ status, url: requestUrl.pathname, page: pageUrl.pathname });
        expectedGuestCheckout401ConsoleCredits++;
      } else {
        httpErrors.push({ status, url: response.url(), page: p.url() });
      }
    });
    p.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Chromium logs handled fetch() responses with 401 as console errors.
        // Consume an allowance only after the response handler has verified
        // the exact guest-checkout endpoint, status, and page.
        if (text.includes('401 (Unauthorized)') && expectedGuestCheckout401ConsoleCredits > 0) {
          expectedGuestCheckout401ConsoleCredits--;
          expectedConsoleErrors.push({ url: p.url(), text });
        } else {
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
      { path: 'checkout.html', redirect: 'account/login.php' },
      // No ref is supplied here: the expected state is the deliberate missing-reference screen.
      { path: 'order-success.html', title: 'Order status', heading: 'No order specified' },
      { path: 'account/wishlist.html', title: 'Wishlist' },
      { path: 'terms.html', title: 'Terms of Service' },
      { path: 'privacy.html', title: 'Privacy Policy' },

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

      // Wait for client-side guards as well as server redirects.
      if (r.path.startsWith('product.html')) {
        await page.waitForFunction(() => document.title !== 'Product | NOVA Home', { timeout: 4000 }).catch(() => {});
      }
      if (r.path === 'checkout.html') {
        await page.waitForURL(url =>
          url.pathname.endsWith('/account/login.php') &&
          url.searchParams.get('return') === 'checkout',
          { timeout: 5000 }
        ).catch(() => {});
      }
      // Some page controllers wait for the asynchronous catalogue bootstrap.
      // Wait for the expected page state before capturing document.title.
      if (r.heading) {
        await page.waitForFunction(expected =>
          (document.querySelector('#ok-title')?.textContent || '').trim() === expected,
          r.heading,
          { timeout: 5000 }
        ).catch(() => {});
      }

      const currentUrl = page.url();
      const title = await page.title();
      if (r.heading) {
        const heading = (await page.locator('#ok-title').textContent() || '').trim();
        assertTest(heading === r.heading, `Route ${r.path} displays the expected missing-reference state`, `Heading: ${heading}`);
      }

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
    assertTest(!(await page.locator('text=What customers say').count()), 'Homepage does not display unverified customer testimonials');

    // Regression probes: untrusted catalogue text must remain text in HTML templates.
    // These values are client-side test objects only; nothing is written to MySQL.
    const escapingProbe = await page.evaluate(() => {
      const productMarker = '<img data-xss-probe="product" src=x>';
      const categoryMarker = '<svg data-xss-probe="category"></svg>';
      const product = { ...NOVA.products[0], name: productMarker, material: productMarker };
      const cardHost = document.createElement('div');
      cardHost.innerHTML = NOVA.ui.card(product, new Set());
      const beforeCategories = NOVA.categories;
      NOVA.categories = [{ id: 'xss-probe', name: categoryMarker, image: 'cat-decor.svg' }];
      const headerHost = document.createElement('div');
      const footerHost = document.createElement('div');
      headerHost.innerHTML = NOVA.shellUI.header();
      footerHost.innerHTML = NOVA.shellUI.footer();
      NOVA.categories = beforeCategories;
      return {
        productInjected: Boolean(cardHost.querySelector('[data-xss-probe="product"]')),
        productLiteral: cardHost.textContent.includes(productMarker),
        categoryInjected: Boolean(
          headerHost.querySelector('[data-xss-probe="category"]') ||
          footerHost.querySelector('[data-xss-probe="category"]')
        ),
        categoryLiteral: headerHost.textContent.includes(categoryMarker) && footerHost.textContent.includes(categoryMarker)
      };
    });
    assertTest(!escapingProbe.productInjected && escapingProbe.productLiteral, 'Product card escapes untrusted catalogue text');
    assertTest(!escapingProbe.categoryInjected && escapingProbe.categoryLiteral, 'Header and footer escape untrusted category text');

    // Open Quick View for first product card
    const firstQuickBtn = page.locator('[data-quick]').first();
    await firstQuickBtn.click();
    await page.waitForSelector('#quickModal.show', { timeout: 3000 });
    const qvTitle = await page.textContent('#qv-title');
    assertTest(qvTitle.length > 0, `Quick View opened for: ${qvTitle}`);
    assertTest((await page.textContent('#qv-stock')).includes('Availability is not tracked'), 'Quick View does not claim stock availability');
    assertTest((await page.textContent('#qv-rating')).includes('No reviews yet'), 'Quick View does not show unverified review ratings');

    // Increase qty in Quick View and Add to Cart
    await page.click('#qv-plus');
    const qvQty = await page.textContent('#qv-qty');
    assertTest(qvQty === '2', 'Quantity increased to 2 in Quick View');
    await page.click('#qv-add');
    await page.waitForTimeout(500);

    const badgeText = await page.textContent('[data-cart-count]');
    assertTest(parseInt(badgeText, 10) >= 2, `Cart badge updated to: ${badgeText}`);

    // -------------------------------------------------------------------------
    // STAGE 4: Signed-out checkout gate
    // -------------------------------------------------------------------------
    console.log('\n--- Stage 4: Signed-out checkout gate ---');
    await page.goto(BASE_URL + 'cart.html', { waitUntil: 'load' });
    await page.waitForSelector('#cart-lines li');
    const cartItemsCount = await page.locator('#cart-lines li').count();
    assertTest(cartItemsCount >= 1, `Cart page renders line items (${cartItemsCount})`);

    await page.waitForFunction(() => {
      const link = document.querySelector('#cart-checkout');
      return link && link.getAttribute('href') && link.getAttribute('href').includes('account/login.php');
    }, { timeout: 5000 });
    await page.click('#cart-checkout');
    await page.waitForURL('**/account/login.php?return=checkout', { timeout: 5000 });
    assertTest(page.url().includes('return=checkout'), 'Signed-out checkout redirects to the login flow');

    const retainedCartCount = await page.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('nova_cart') || '[]').length; }
      catch { return 0; }
    });
    assertTest(retainedCartCount > 0, 'Cart remains intact when checkout requires sign-in');

    // -------------------------------------------------------------------------
    // STAGE 5: Workflow 3 & 4 — Customer Accounts & Authed Checkout
    // -------------------------------------------------------------------------
    console.log('\n--- Stage 5: Workflows 3 & 4 — Customer Accounts & Authed Checkout ---');
    await page.goto(BASE_URL + 'account/register.php', { waitUntil: 'load' });

    testCustEmail = `e2e_cust_${Date.now()}@novahome.eg`;
    testCustomerPassword = `Test-${randomBytes(18).toString('base64url')}!aA1`;
    await page.fill('#r-name', 'E2E Account Customer');
    await page.fill('#r-email', testCustEmail);
    await page.fill('#r-phone', '01212345678');
    await page.fill('#r-pass', testCustomerPassword);
    await page.fill('#r-pass2', testCustomerPassword);
    await page.check('#r-terms');
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
    const checkoutCityKeys = await page.locator('#c-city option').evaluateAll(options =>
      options.map(option => option.value).filter(Boolean).sort()
    );
    assertTest(
      JSON.stringify(checkoutCityKeys) === JSON.stringify(['alexandria', 'cairo', 'fayoum', 'giza', 'mansoura', 'other', 'tanta']),
      'Checkout city selector matches the server-controlled city set',
      checkoutCityKeys
    );

    await page.fill('#c-phone', '01212345678');
    await page.selectOption('#c-city', 'alexandria');
    await page.fill('#c-apt', 'Flat 5');
    await page.fill('#c-address', 'Corniche Road');

    await page.click('#place-order');
    await page.waitForURL('**/order-success.html?ref=NH-*', { timeout: 8000 });

    const authedOrderRef = new URL(page.url()).searchParams.get('ref');
    assertTest(authedOrderRef && authedOrderRef.startsWith('NH-'), `Authed order placed: ${authedOrderRef}`);

    // View customer order history
    await page.goto(BASE_URL + 'account/orders.php', { waitUntil: 'load' });
    const ordersBody = await page.textContent('main');
    assertTest(ordersBody.includes(authedOrderRef), 'Customer order history lists the authenticated order');

    // View order detail
    await page.click(`a[href="order.php?ref=${authedOrderRef}"]`);
    await page.waitForURL(`**/account/order.php?ref=${authedOrderRef}`, { timeout: 5000 });
    const detailHead = await page.textContent('main');
    assertTest(detailHead.includes(authedOrderRef) && detailHead.includes('Corniche Road'), 'Customer order detail loads historical details');

    // Wishlist account chrome must receive the resolved authentication state.
    await page.goto(BASE_URL + 'account/wishlist.html', { waitUntil: 'load' });
    await page.waitForFunction(() =>
      document.querySelector('#wish-user-name')?.textContent === 'E2E Account Customer',
      { timeout: 5000 }
    );
    assertTest(
      await page.textContent('#wish-user-email') === testCustEmail,
      'Wishlist profile card reflects the signed-in customer'
    );
    assertTest(
      await page.locator('#wish-side-nav .cust-logout-btn').count() === 1,
      'Wishlist sidebar exposes the delegated sign-out control'
    );

    // Return to orders list and sign out customer.
    await page.goto(BASE_URL + 'account/orders.php', { waitUntil: 'load' });
    await page.waitForURL('**/account/orders.php', { timeout: 5000 });
    await page.locator('.account-side .cust-logout-btn').click();
    await page.waitForURL(url => url.pathname.endsWith('/index.html'), { timeout: 5000 });
    assertTest(page.url().endsWith('/index.html'), 'Customer signed out and returned to the storefront');

    await page.goto(BASE_URL + 'account/index.php');
    assertTest(page.url().includes('account/login.php'), 'Access to account/index.php after logout redirects to login.php');

    // -------------------------------------------------------------------------
    // STAGE 6: Workflow 5 — Admin Management
    // -------------------------------------------------------------------------
    console.log('\n--- Stage 6: Workflow 5 — Admin Management ---');
    // Ensure temp admin exists for test
    tempAdminPassword = `Audit-${randomBytes(24).toString('base64url')}!aA1`;
    execFileSync('php', ['create_temp_admin.php'], {
      cwd: __dirname,
      encoding: 'utf8',
      env: { ...process.env, NOVA_TEST_ADMIN_PASSWORD: tempAdminPassword }
    });
    tempAdminCreated = true;
    await page.goto(BASE_URL + 'admin/login.php', { waitUntil: 'load' });

    await page.fill('#a-email', 'audit_admin@novahome.eg');
    await page.fill('#a-pass', tempAdminPassword);
    await page.click('#admin-login-btn');

    await page.waitForURL('**/admin/index.php', { timeout: 6000 });
    assertTest(page.url().includes('admin/index.php'), 'Admin logged in and redirected to admin/index.php');

    const adminDash = await page.textContent('main');
    assertTest(adminDash.includes('Dashboard') && adminDash.includes('Products'), 'Admin dashboard loaded');
    const recentOrderDates = await page.locator('.admin-table-wrap tbody tr').evaluateAll(rows =>
      rows.map(row => Date.parse(row.querySelector('td:nth-child(2) .small')?.textContent || ''))
        .filter(Number.isFinite)
    );
    assertTest(
      recentOrderDates.length <= 1 || recentOrderDates.every((date, index) => index === 0 || recentOrderDates[index - 1] >= date),
      'Admin dashboard recent orders are sorted newest-first by creation date',
      recentOrderDates
    );
    const environmentLabel = (await page.locator('.admin-card .list-unstyled').textContent()) || '';
    assertTest(/Development|Production/.test(environmentLabel), 'Admin environment badge reflects the configured environment');

    // Admin Products
    await page.click('.admin-side--desktop .admin-nav a[href="products.php"]');
    await page.waitForURL('**/admin/products.php', { timeout: 5000 });
    const prodCount = await page.locator('table tbody tr').count();
    assertTest(prodCount === 14, `Admin products table renders 14 products (${prodCount})`);

    // Admin Categories
    await page.click('.admin-side--desktop .admin-nav a[href="categories.php"]');
    await page.waitForURL('**/admin/categories.php', { timeout: 5000 });
    const catCount = await page.locator('table tbody tr').count();
    assertTest(catCount === 5, `Admin categories table renders 5 categories (${catCount})`);

    // Admin Orders
    await page.click('.admin-side--desktop .admin-nav a[href="orders.php"]');
    await page.waitForURL('**/admin/orders.php', { timeout: 5000 });
    const ordersList = await page.textContent('table');
    assertTest(ordersList.includes('NH-'), 'Admin orders table renders orders');

    // Admin Settings
    await page.click('.admin-side--desktop .admin-nav a[href="settings.php"]');
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
      const cleanupArgs = ['cleanup_test_data.php'];
      if (testCustEmail) cleanupArgs.push(testCustEmail);
      if (tempAdminCreated) cleanupArgs.push('--remove-temp-admin');
      if (cleanupArgs.length > 1) {
        const out = execFileSync('php', cleanupArgs, { cwd: __dirname, encoding: 'utf8' });
        console.log(out.trim());
      } else {
        console.log('No test records were created; cleanup skipped.');
      }
    } catch (e) {
      cleanupFailed = true;
      console.error('Cleanup error:', e.message);
    }
  }

  console.log(`\n========================================`);
  console.log(`PLAYWRIGHT AUDIT COMPLETE`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Page JS Errors: ${pageErrors.length}`);
  console.log(`Unexpected Console Errors: ${consoleErrors.length}`);
  console.log(`Expected guest-auth console messages: ${expectedConsoleErrors.length}`);
  console.log(`Unexpected HTTP Errors: ${httpErrors.length}`);
  console.log(`Expected guest-auth HTTP responses: ${expectedHttpStatuses.length}`);
  console.log(`========================================\n`);

  if (failures.length > 0) {
    console.log('ASSERTION FAILURES:');
    failures.forEach(f => console.log(`  [FAIL] ${f.name}${f.details ? ` (${f.details})` : ''}`));
  }
  if (cleanupFailed) console.error('Test data cleanup did not complete successfully.');
  if (pageErrors.length > 0) {
    console.log('PAGE JS ERRORS:');
    pageErrors.forEach(e => console.log(`  [${e.url}] ${e.error}`));
  }
  if (consoleErrors.length > 0) {
    console.log('CONSOLE ERRORS:');
    consoleErrors.forEach(e => console.log(`  [${e.url}] ${e.text}`));
  }
  if (httpErrors.length > 0) {
    console.log('UNEXPECTED HTTP RESPONSES:');
    httpErrors.forEach(e => console.log(`  [${e.status}] ${e.url} (page: ${e.page})`));
  }
  if (expectedHttpStatuses.length > 0) {
    console.log('EXPECTED HTTP RESPONSES:');
    expectedHttpStatuses.forEach(e => console.log(`  [${e.status}] ${e.url} (page: ${e.page})`));
  }

  process.exit(
    failed === 0 &&
    pageErrors.length === 0 &&
    consoleErrors.length === 0 &&
    httpErrors.length === 0 &&
    !cleanupFailed ? 0 : 1
  );
}

runAudit().catch(err => {
  console.error('Audit fatal error:', err);
  process.exit(1);
});
