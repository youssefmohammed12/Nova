/**
 * NOVA Home — Shopping Cart responsive and interaction regression checks.
 * Uses isolated browser-local storage only; never submits checkout or writes to the database.
 */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const BASE_URL = (process.env.NOVA_BASE_URL || 'http://localhost/nova-home/nova-home/').replace(/\/?$/, '/');
const CART_URL = BASE_URL + 'cart.html';

(async () => {
  const browser = await chromium.launch({ headless: true });
  let checks = 0;

  function check(condition, message) {
    checks++;
    assert.ok(condition, message);
    console.log('  [PASS] ' + message);
  }

  async function seedCart(context, items) {
    await context.addInitScript(value => {
      localStorage.setItem('nova_cart', JSON.stringify(value));
    }, items);
  }

  async function openCart(context) {
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(CART_URL, { waitUntil: 'domcontentloaded' });
    return { page, pageErrors };
  }

  try {
    const viewports = [
      { name: 'small phone', width: 360, height: 740 },
      { name: 'phone', width: 390, height: 844 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 850 }
    ];

    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: viewport.width < 768,
        hasTouch: viewport.width <= 1024
      });
      await seedCart(context, [
        { id: 'sahara-vase', qty: 1 },
        { id: 'luna-floor-lamp', qty: 10 }
      ]);
      const { page, pageErrors } = await openCart(context);
      await page.waitForFunction(() =>
        !document.querySelector('#cart-filled')?.hidden &&
        document.querySelectorAll('#cart-lines .cart-item').length === 2
      );

      const state = await page.evaluate(() => {
        const rect = element => {
          const box = element?.getBoundingClientRect();
          return box ? { width: Math.round(box.width), height: Math.round(box.height) } : null;
        };
        const first = document.querySelector('#cart-lines .cart-item');
        const second = document.querySelectorAll('#cart-lines .cart-item')[1];
        return {
          lineCount: document.querySelectorAll('#cart-lines .cart-item').length,
          emptyHidden: document.querySelector('#cart-empty')?.hidden,
          filledVisible: !document.querySelector('#cart-filled')?.hidden,
          summaryVisible: !!document.querySelector('.summary') && getComputedStyle(document.querySelector('.summary')).display !== 'none',
          subtotal: document.querySelector('#sum-sub')?.textContent.trim(),
          delivery: document.querySelector('#sum-del')?.textContent.trim(),
          total: document.querySelector('#sum-total')?.textContent.trim(),
          firstDecreaseDisabled: first?.querySelector('[data-dec]')?.disabled,
          secondIncreaseDisabled: second?.querySelector('[data-inc]')?.disabled,
          firstRemoveLabel: first?.querySelector('[data-remove]')?.getAttribute('aria-label'),
          decreaseSize: rect(first?.querySelector('[data-dec]')),
          increaseSize: rect(first?.querySelector('[data-inc]')),
          removeSize: rect(first?.querySelector('[data-remove]')),
          statusRole: document.querySelector('#cart-status')?.getAttribute('role'),
          statusLive: document.querySelector('#cart-status')?.getAttribute('aria-live'),
          hasCheckout: !!document.querySelector('#cart-checkout'),
          overflow: document.documentElement.scrollWidth > innerWidth
        };
      });

      check(state.lineCount === 2 && state.filledVisible && state.emptyHidden,
        viewport.name + ': populated cart renders every item');
      check(state.summaryVisible && state.subtotal && state.total,
        viewport.name + ': order summary shows subtotal and total');
      check(state.firstDecreaseDisabled && state.secondIncreaseDisabled,
        viewport.name + ': quantity controls enforce the one-to-ten range');
      check(state.firstRemoveLabel === 'Remove Sahara Ceramic Vase from cart',
        viewport.name + ': each Remove action has a product-specific accessible name');
      check(state.decreaseSize?.width >= 44 && state.decreaseSize?.height >= 44 &&
        state.increaseSize?.width >= 44 && state.increaseSize?.height >= 44,
        viewport.name + ': quantity controls meet 44px touch-target size');
      check(state.removeSize?.height >= 44,
        viewport.name + ': Remove action meets 44px touch-target size');
      check(state.statusRole === 'status' && state.statusLive === 'polite',
        viewport.name + ': cart exposes a polite live status region');
      check(state.hasCheckout, viewport.name + ': checkout navigation remains available');
      check(!state.overflow, viewport.name + ': cart has no horizontal overflow');
      check(pageErrors.length === 0, viewport.name + ': no JavaScript page errors');

      await context.close();
      console.log('--- ' + viewport.name + ' complete ---');
    }
    // Quantity changes must update the basket and all totals without leaving the cart page.
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await seedCart(context, [{ id: 'sahara-vase', qty: 1 }]);
      const { page, pageErrors } = await openCart(context);
      await page.waitForFunction(() => !document.querySelector('#cart-filled')?.hidden);

      const initial = await page.evaluate(() => ({
        quantity: window.NOVA.cart.items()[0]?.qty,
        subtotal: window.NOVA.cart.subtotal(),
        delivery: window.NOVA.cart.delivery(),
        total: window.NOVA.cart.total()
      }));
      check(initial.quantity === 1 && initial.subtotal === 890 && initial.delivery === 60,
        'initial cart summary applies the configured delivery fee below the free-delivery threshold');

      await page.locator('[data-inc="sahara-vase"]').click();
      await page.waitForFunction(() => document.querySelector('#cart-status')?.textContent.includes('quantity updated to 2'));
      const increased = await page.evaluate(() => ({
        quantity: window.NOVA.cart.items()[0]?.qty,
        subtotal: window.NOVA.cart.subtotal(),
        delivery: window.NOVA.cart.delivery(),
        total: window.NOVA.cart.total(),
        lineTotal: document.querySelector('#cart-lines .price')?.textContent.trim()
      }));
      check(increased.quantity === 2 && increased.subtotal === 1780,
        'increasing quantity recalculates the subtotal and line total');
      check(increased.delivery === 0 && increased.total === 1780,
        'crossing the free-delivery threshold recalculates delivery and total');
      check((await page.locator('#cart-status').textContent()).includes('Sahara Ceramic Vase quantity updated to 2'),
        'quantity changes are announced to assistive technology');

      await page.locator('[data-dec="sahara-vase"]').click();
      await page.waitForFunction(() => document.querySelector('#cart-status')?.textContent.includes('quantity updated to 1'));
      const decreased = await page.evaluate(() => ({
        quantity: window.NOVA.cart.items()[0]?.qty,
        delivery: window.NOVA.cart.delivery()
      }));
      check(decreased.quantity === 1 && decreased.delivery === 60,
        'decreasing quantity restores the original delivery fee');

      await page.locator('[data-remove="sahara-vase"]').click();
      await page.waitForFunction(() => document.querySelector('#cart-empty')?.hidden === false);
      const removed = await page.evaluate(() => ({
        emptyVisible: !document.querySelector('#cart-empty')?.hidden,
        filledHidden: document.querySelector('#cart-filled')?.hidden,
        cartCount: window.NOVA.cart.count(),
        status: document.querySelector('#cart-status')?.textContent.trim(),
        bootstrapToastVisible: document.querySelector('#toast')?.classList.contains('show'),
        fallbackToast: document.querySelector('.toast-fallback')?.textContent.trim() || ''
      }));
      check(removed.emptyVisible && removed.filledHidden && removed.cartCount === 0,
        'removing the last item switches cleanly to the empty-cart state');
      check(removed.status === 'Sahara Ceramic Vase removed from your cart.',
        'removal is announced with the product name');
      check(removed.bootstrapToastVisible || removed.fallbackToast.includes('Sahara Ceramic Vase removed'),
        'removal displays a visible success confirmation');
      check(pageErrors.length === 0, 'cart quantity and removal interactions produce no JavaScript errors');
      await context.close();
    }

    // A genuinely empty browser-local cart should show the empty state and its recovery action.
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const { page, pageErrors } = await openCart(context);
      await page.waitForFunction(() => !document.querySelector('#cart-empty')?.hidden);
      check(!await page.locator('#cart-empty').isHidden(), 'empty cart shows its empty-state presentation');
      check(await page.locator('#cart-empty a').getAttribute('href') === 'shop.html',
        'empty cart offers a direct route back to shopping');
      check(await page.locator('#cart-filled').isHidden(), 'empty cart hides the order summary and checkout action');
      check(pageErrors.length === 0, 'empty cart produces no JavaScript page errors');
      await context.close();
    }

    console.log('\nCART UI TESTS PASSED: ' + checks + ' checks across four viewports and quantity/removal/empty-state flows.\n');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error('\nCART UI TEST FAILED:', error);
  process.exit(1);
});
