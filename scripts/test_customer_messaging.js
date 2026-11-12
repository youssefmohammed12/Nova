/**
 * NOVA Home — Customer empty states and messaging regression checks.
 * All checkout/order API responses are intercepted in isolated browser contexts.
 * This suite never sends an order to the PHP API or writes to the database.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const BASE_URL = (process.env.NOVA_BASE_URL || 'http://localhost/nova-home/nova-home/').replace(/\/?$/, '/');
const CHECKOUT_URL = BASE_URL + 'checkout.html';
const SUCCESS_URL = BASE_URL + 'order-success.html';
const ORDER_REF = 'NH-20261112-A1B2C3';

(async () => {
  const browser = await chromium.launch({ headless: true });
  let checks = 0;

  function check(condition, message) {
    checks++;
    assert.ok(condition, message);
    console.log('  [PASS] ' + message);
  }

  async function prepareCheckout(mode) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(() => {
      if (sessionStorage.getItem('__nova_checkout_test_seeded') !== 'true') {
        localStorage.setItem('nova_cart', JSON.stringify([
          { id: 'sahara-vase', qty: 2 },
          { id: 'luna-floor-lamp', qty: 1 }
        ]));
        sessionStorage.setItem('__nova_checkout_test_seeded', 'true');
      }
    });

    await context.route('**/api/customer-auth.php', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { authenticated: true, customer: { id: 999, name: 'Demo Customer' } } })
    }));
    await context.route('**/api/customer-profile.php', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { name: 'Demo Customer', phone: '01012345678' } })
    }));
    await context.route('**/api/customer-addresses.php', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [
        { is_default: true, address: '12 Example Street', apartment: 'Building 3, Apt 4', city: 'Cairo' }
      ] })
    }));

    let csrfRequests = 0;
    let orderPosts = 0;
    let postedPayload = null;

    await context.route('**/api/csrf.php', async route => {
      csrfRequests++;
      if (mode === 'csrf-failure') {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ success: false })
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { csrf_token: 'mock-csrf-token' } })
      });
    });

    await context.route('**/api/orders.php', async route => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      orderPosts++;
      try { postedPayload = route.request().postDataJSON(); } catch (_) { postedPayload = null; }

      if (mode === 'server-error') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'Some cart items are no longer available.' })
        });
        return;
      }
      if (mode === 'network-error') {
        await route.abort('failed');
        return;
      }
      if (mode === 'success') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { order_id: 123, order_ref: ORDER_REF, subtotal: 4230, delivery_fee: 0, total: 4230 }
          })
        });
        return;
      }
      await route.abort();
    });

    if (mode === 'success') {
      await context.route('**/api/order.php?ref=*', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            order_ref: ORDER_REF,
            customer_name: 'Demo Customer',
            city: 'Cairo',
            address: '12 Example Street, Building 3, Apt 4',
            subtotal: 4230,
            delivery_fee: 0,
            total: 4230,
            items: [
              { product_name: 'Sahara Ceramic Vase', unit_price: 890, quantity: 2, line_total: 1780, slug: 'sahara-vase' },
              { product_name: 'Luna Arc Floor Lamp', unit_price: 2450, quantity: 1, line_total: 2450, slug: 'luna-floor-lamp' }
            ]
          }
        })
      }));
    }

    return {
      context,
      getCounters: () => ({ csrfRequests, orderPosts, postedPayload })
    };
  }

  async function openCheckout(context) {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(CHECKOUT_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() =>
      document.querySelectorAll('#co-lines .summary-line').length === 2 &&
      document.querySelector('#c-address')?.value === '12 Example Street'
    );
    return { page, errors };
  }

  try {
    console.log('\n--- Shop no-results recovery ---');
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      await page.goto(BASE_URL + 'shop.html?q=no-matching-piece-987', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#shop-grid .empty-state');
      const text = await page.locator('#shop-grid .empty-state').innerText();
      check(text.includes('No pieces match your selection'),
        'search with no results explains that no products match the query');
      check(await page.locator('#shop-grid #reset-filters').isVisible(),
        'no-results state offers a visible reset action');
      await page.locator('#shop-grid #reset-filters').click();
      await page.waitForFunction(() =>
        !new URL(location.href).searchParams.has('q') &&
        document.querySelectorAll('#shop-grid .product-card').length > 0
      );
      check((await page.locator('#shop-title').textContent()).trim() === 'All Pieces',
        'reset from no-results returns to the full catalogue');
      await context.close();
    }

    console.log('\n--- Checkout server rejection ---');
    {
      const { context, getCounters } = await prepareCheckout('server-error');
      const { page, errors } = await openCheckout(context);
      await page.locator('#place-order').click();
      await page.waitForFunction(() => {
        const error = document.querySelector('#co-error');
        return error && !error.hidden && error.textContent.includes('Some cart items are no longer available');
      });
      check((await page.locator('#co-error').textContent()).includes('Some cart items are no longer available.'),
        'server validation message is shown without replacing it with a generic error');
      check(await page.locator('#co-error').getAttribute('role') === 'alert' &&
        await page.evaluate(() => document.activeElement?.id === 'co-error'),
        'checkout server error is announced and receives keyboard focus');
      check(await page.locator('#place-order').isEnabled() &&
        (await page.locator('#place-order').textContent()).trim() === 'Place order',
        'Place Order becomes available again after a rejected request');
      const state = await page.evaluate(() => ({
        cart: JSON.parse(localStorage.getItem('nova_cart') || '[]'),
        page: location.pathname
      }));
      check(state.cart.length === 2 && state.page.endsWith('/checkout.html'),
        'failed order attempt preserves the cart and keeps the customer on checkout');
      const counters = getCounters();
      check(counters.csrfRequests === 1 && counters.orderPosts === 1,
        'the failed order request was intercepted by the test route');
      check(counters.postedPayload?.payment_method === 'cod' &&
        counters.postedPayload?.items?.length === 2,
        'checkout continues to send the existing Cash on Delivery payload');
      check(errors.length === 0, 'server rejection produces no JavaScript page errors');
      await context.close();
    }

    console.log('\n--- Checkout connection failure ---');
    {
      const { context, getCounters } = await prepareCheckout('network-error');
      const { page } = await openCheckout(context);
      await page.locator('#place-order').click();
      await page.waitForFunction(() => {
        const error = document.querySelector('#co-error');
        return error && !error.hidden && error.textContent.includes('Could not reach the server');
      });
      check((await page.locator('#co-error').textContent()).includes('Check your connection and try again.'),
        'network failure explains the connection problem and recovery');
      check(await page.locator('#place-order').isEnabled(),
        'Place Order is re-enabled after a network failure');
      check((await page.evaluate(() => JSON.parse(localStorage.getItem('nova_cart') || '[]'))).length === 2,
        'network failure leaves the customer cart intact');
      check(getCounters().orderPosts === 1,
        'network failure route intercepted the POST before it could reach PHP');
      await context.close();
    }

    console.log('\n--- Checkout CSRF/session preparation failure ---');
    {
      const { context, getCounters } = await prepareCheckout('csrf-failure');
      const { page } = await openCheckout(context);
      await page.locator('#place-order').click();
      await page.waitForFunction(() => {
        const error = document.querySelector('#co-error');
        return error && !error.hidden && error.textContent.includes('Could not reach the server');
      });
      check(getCounters().csrfRequests === 1 && getCounters().orderPosts === 0,
        'missing CSRF token prevents the order POST entirely');
      check(await page.locator('#place-order').isEnabled() &&
        (await page.evaluate(() => JSON.parse(localStorage.getItem('nova_cart') || '[]'))).length === 2,
        'CSRF failure restores the checkout action and preserves the cart');
      await context.close();
    }

    console.log('\n--- Simulated successful Cash on Delivery order ---');
    {
      const { context, getCounters } = await prepareCheckout('success');
      const { page, errors } = await openCheckout(context);
      await page.locator('#place-order').click();
      await page.waitForURL(url =>
        url.pathname.endsWith('/order-success.html') &&
        url.searchParams.get('ref') === ORDER_REF
      , { timeout: 8000 });
      await page.waitForFunction(() =>
        document.querySelector('#ok-ref')?.textContent.trim() === 'NH-20261112-A1B2C3' &&
        document.querySelector('#ok-summary')?.textContent.includes('Sahara Ceramic Vase')
      );

      const counters = getCounters();
      check(counters.orderPosts === 1 && counters.postedPayload?.payment_method === 'cod',
        'successful checkout sends one intercepted COD request');
      check(counters.postedPayload?.items?.some(item => item.slug === 'sahara-vase' && item.qty === 2),
        'checkout payload preserves selected product quantities');
      check((await page.locator('#ok-title').textContent()).trim() === 'Your order is confirmed' &&
        (await page.locator('#ok-subtitle').textContent()).includes('cash on delivery'),
        'success page clearly confirms the order and COD method');
      check((await page.locator('#ok-ref').textContent()).trim() === ORDER_REF,
        'success page displays the returned order reference');
      check((await page.locator('#ok-summary').innerText()).includes('Luna Arc Floor Lamp x 1') &&
        (await page.locator('#ok-summary').innerText()).includes('Sahara Ceramic Vase x 2'),
        'success page lists the confirmed product lines and quantities');
      check((await page.locator('#ok-total').textContent()).trim() === 'EGP 4,230',
        'success page shows the authoritative server response total');
      check((await page.locator('#ok-meta').textContent()).includes('Demo Customer') &&
        (await page.locator('#ok-meta').textContent()).includes('Cairo'),
        'success page shows the delivery destination returned by the authorized read');
      check(await page.locator('#ok-hero').getAttribute('role') === 'status' &&
        await page.locator('#ok-summary').getAttribute('aria-busy') === 'false',
        'success and order-summary updates expose accessible status semantics');
      check((await page.evaluate(() => JSON.parse(localStorage.getItem('nova_cart') || '[]'))).length === 0,
        'cart clears only after the simulated successful server response');
      check(errors.length === 0, 'simulated successful order flow produces no JavaScript page errors');
      await context.close();
    }

    console.log('\n--- Order confirmation missing-reference and unavailable states ---');
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      await page.goto(SUCCESS_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.querySelector('#ok-title')?.textContent === 'No order specified');
      check((await page.locator('#ok-summary [role="status"]').textContent()).includes('no order reference was provided'),
        'missing-reference state explains why confirmation details cannot be loaded');
      check(await page.locator('#ok-info-list').isHidden(),
        'missing-reference state hides potentially misleading delivery instructions');
      await context.close();
    }
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await context.route('**/api/order.php?ref=*', route => route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Order not found.' })
      }));
      const page = await context.newPage();
      await page.goto(SUCCESS_URL + '?ref=' + ORDER_REF, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.querySelector('#ok-title')?.textContent === 'Order details unavailable');
      check((await page.locator('#ok-summary [role="alert"]').textContent()).includes('Please sign in'),
        'unavailable order details provide a clear sign-in and order-history recovery path');
      check(await page.locator('#ok-info-list').isHidden(),
        'unverified order details do not display confirmed-order delivery instructions');
      await context.close();
    }

    console.log('\n--- No previous orders state (source-level; no customer DB read) ---');
    {
      const source = fs.readFileSync(path.join(__dirname, '..', 'account', 'orders.php'), 'utf8');
      check(source.includes('role="status" aria-labelledby="orders-empty-title"') &&
        source.includes('No orders placed yet'),
        'My Orders empty state has a labelled status message');
      check(source.includes('href="../shop.html">Start shopping</a>'),
        'My Orders empty state gives customers a direct Start Shopping action');
      check(source.includes('When you purchase furniture and home decor while signed in'),
        'My Orders empty state explains when signed-in purchases will appear');
    }

    console.log('\nCUSTOMER MESSAGING TESTS PASSED: ' + checks + ' checks across no-results, empty orders, checkout outcomes and confirmation states.\n');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error('\nCUSTOMER MESSAGING TEST FAILED:', error);
  process.exit(1);
});
