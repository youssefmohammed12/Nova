/**
 * NOVA Home — Wishlist customer journey regression checks.
 * Uses isolated browser storage and read-only catalogue GET requests only.
 */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const BASE_URL = (process.env.NOVA_BASE_URL || 'http://localhost/nova-home/nova-home/').replace(/\/?$/, '/');

(async () => {
  const browser = await chromium.launch({ headless: true });
  let checks = 0;

  function check(condition, message) {
    checks++;
    assert.ok(condition, message);
    console.log('  [PASS] ' + message);
  }

  async function seedWishlist(context, ids) {
    await context.addInitScript(value => {
      if (sessionStorage.getItem('__nova_wishlist_test_seeded') !== 'true') {
        localStorage.setItem('nova_wish', JSON.stringify(value));
        sessionStorage.setItem('__nova_wishlist_test_seeded', 'true');
      }
    }, ids);
  }

  async function openWishlist(context) {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(BASE_URL + 'account/wishlist.html', { waitUntil: 'domcontentloaded' });
    return { page, errors };
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
      await seedWishlist(context, ['sahara-vase', 'luna-floor-lamp']);
      const { page, errors } = await openWishlist(context);
      await page.waitForFunction(() =>
        window.NOVA?.catalog?.ready &&
        document.querySelectorAll('#account-wish-grid .product-card').length === 2
      );

      const state = await page.evaluate(() => ({
        count: window.NOVA.wish.ids().length,
        cards: document.querySelectorAll('#account-wish-grid .product-card').length,
        localDisclosure: document.querySelector('#wish-sub')?.textContent.includes('stored in this browser on this device'),
        removeLabels: [...document.querySelectorAll('#account-wish-grid [data-wish]')].map(button => button.getAttribute('aria-label')),
        heartTarget: (() => { const rect = document.querySelector('#account-wish-grid .wish-btn')?.getBoundingClientRect(); return rect ? { width: Math.round(rect.width), height: Math.round(rect.height) } : null; })(),
        overflow: document.documentElement.scrollWidth > innerWidth,
        viewportWidth: innerWidth,
        pageWidth: document.documentElement.scrollWidth,
        shopViewVisible: !document.querySelector('#wish-open-shop-view')?.hidden,
        exploreVisible: !document.querySelector('.account-main a.btn-nova')?.hidden
      }));

      check(state.count === 2 && state.cards === 2, viewport.name + ': saved products render as matching product cards');
      check(state.localDisclosure, viewport.name + ': browser/device-local storage disclosure remains visible');
      check(state.removeLabels.includes('Remove Sahara Ceramic Vase from wishlist') &&
        state.removeLabels.includes('Remove Luna Arc Floor Lamp from wishlist'),
        viewport.name + ': saved hearts have product-specific accessible labels');
      check(state.shopViewVisible && state.exploreVisible, viewport.name + ': populated wishlist provides both shopping navigation options');
      check(state.heartTarget?.width >= 44 && state.heartTarget?.height >= 44,
        viewport.name + ': wishlist heart meets the 44px touch-target size');
      check(!state.overflow, viewport.name + ': wishlist has no horizontal overflow');

      await page.locator('#account-wish-grid [data-wish="sahara-vase"]').click();
      await page.waitForFunction(() =>
        window.NOVA.wish.ids().length === 1 &&
        document.querySelectorAll('#account-wish-grid .product-card').length === 1
      );
      check((await page.locator('#toastBody').textContent()).includes('Sahara Ceramic Vase removed from your wishlist.'),
        viewport.name + ': removing a saved item shows product-specific confirmation');

      await page.locator('#account-wish-grid [data-wish="luna-floor-lamp"]').click();
      await page.waitForSelector('#account-wish-grid .empty-state');
      check((await page.locator('#account-wish-grid .empty-state').innerText()).includes('Your wishlist is empty'),
        viewport.name + ': removing the final item displays the empty state');
      check(await page.locator('#wish-open-shop-view').isHidden(),
        viewport.name + ': shop wishlist shortcut is hidden when no items are saved');
      check(await page.getByRole('link', { name: 'Explore more pieces' }).isVisible(),
        viewport.name + ': Explore more pieces remains available from the empty state');
      check(errors.length === 0, viewport.name + ': no JavaScript page errors');
      await context.close();
      console.log('--- ' + viewport.name + ' complete ---');
    }

    // The shop's filtered wishlist uses the same saved state and updates immediately after a removal.
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await seedWishlist(context, ['sahara-vase', 'luna-floor-lamp']);
      const page = await context.newPage();
      await page.goto(BASE_URL + 'shop.html?wish=1', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.querySelectorAll('#shop-grid .product-card').length === 2);
      check((await page.locator('#shop-title').textContent()).trim() === 'Saved Wishlist',
        'shop wishlist view uses its saved-list title');
      check((await page.locator('#result-count').textContent()).trim() === '2 pieces' &&
        (await page.locator('#wish-banner').innerText()).includes('2 saved items'),
        'shop wishlist count and banner match the two rendered products');
      await page.locator('#shop-grid [data-wish="sahara-vase"]').click();
      await page.waitForFunction(() => document.querySelectorAll('#shop-grid .product-card').length === 1);
      check((await page.locator('#wish-banner').innerText()).includes('1 saved item'),
        'shop wishlist re-renders its count and grid after a heart is removed');
      await context.close();
    }
    // A delayed catalogue must display a loading state rather than an incorrect empty wishlist.
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await seedWishlist(context, ['sahara-vase']);
      await context.route('**/api/products.php?limit=100', async route => {
        await new Promise(resolve => setTimeout(resolve, 1100));
        await route.continue();
      });
      const { page } = await openWishlist(context);
      await page.waitForSelector('#account-wish-grid [role="status"]');
      const early = await page.evaluate(() => ({
        loadingText: document.querySelector('#account-wish-grid')?.innerText.trim(),
        emptyVisible: !!document.querySelector('#account-wish-grid .empty-state'),
        catalogueReady: window.NOVA.catalog.ready
      }));
      check(early.loadingText.includes('Loading your saved pieces') &&
        !early.emptyVisible && !early.catalogueReady,
        'saved wishlist shows a loading state while the product catalogue is delayed');
      await page.waitForFunction(() =>
        window.NOVA.catalog.ready &&
        document.querySelectorAll('#account-wish-grid .product-card').length === 1
      );
      check((await page.locator('#account-wish-grid .product-card').innerText()).includes('Sahara Ceramic Vase'),
        'saved product appears once the delayed catalogue is ready');
      await context.close();
    }

    // A catalogue failure must not be presented as an empty saved list.
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await seedWishlist(context, ['sahara-vase']);
      await context.route('**/api/products.php?limit=100', route =>
        route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false }) })
      );
      const { page } = await openWishlist(context);
      await page.waitForFunction(() => !!window.NOVA?.catalog?.error);
      await page.waitForSelector('#account-wish-grid .empty-state[role="status"]');
      const failure = await page.locator('#account-wish-grid').innerText();
      check(failure.includes('Saved pieces are unavailable') &&
        !failure.includes('Your wishlist is empty'),
        'catalogue failure is clearly distinguished from an empty wishlist');
      await context.close();
    }

    // IDs for deleted/unknown products must not inflate the count or visible list.
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await seedWishlist(context, ['sahara-vase', 'stale-removed-product', 'luna-floor-lamp']);
      const page = await context.newPage();
      await page.goto(BASE_URL + 'shop.html?wish=1', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.NOVA?.catalog?.ready);
      await page.waitForFunction(() => document.querySelectorAll('#shop-grid .product-card').length === 2);
      const stale = await page.evaluate(() => ({
        ids: window.NOVA.wish.ids(),
        rawStorage: JSON.parse(localStorage.getItem('nova_wish') || '[]'),
        banner: document.querySelector('#wish-banner')?.innerText.trim(),
        cards: document.querySelectorAll('#shop-grid .product-card').length
      }));
      check(stale.ids.length === 2 && stale.ids.every(id => id !== 'stale-removed-product'),
        'unknown product IDs are ignored by the active wishlist state');
      check(stale.cards === 2 && stale.banner.includes('2 saved items'),
        'stale IDs do not inflate the shop count beyond visible products');
      check(stale.rawStorage.includes('stale-removed-product'),
        'reading the wishlist does not silently rewrite browser storage');
      const invalid = await page.evaluate(() => {
        const before = localStorage.getItem('nova_wish');
        const result = window.NOVA.wish.toggle('missing-product');
        return { result, unchanged: localStorage.getItem('nova_wish') === before };
      });
      check(invalid.result === null && invalid.unchanged,
        'attempting to save an unknown product is rejected without changing storage');
      await context.close();
    }

    // Browser storage quota errors must not be followed by a success message.
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await context.addInitScript(() => {
        localStorage.setItem('nova_wish', JSON.stringify([]));
        const original = Storage.prototype.setItem;
        Storage.prototype.setItem = function (key, value) {
          if (key === 'nova_wish') throw new DOMException('Storage quota exceeded', 'QuotaExceededError');
          return original.call(this, key, value);
        };
      });
      const page = await context.newPage();
      await page.goto(BASE_URL + 'shop.html', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() =>
        window.NOVA?.catalog?.ready &&
        document.querySelectorAll('#shop-grid .product-card').length > 0
      );
      const heart = page.locator('#shop-grid [data-wish="sahara-vase"]');
      await heart.click();
      await page.waitForFunction(() =>
        document.querySelector('#toastBody')?.textContent.includes('Could not save')
      );
      check((await page.locator('#toastBody').textContent()).includes('Could not save: browser storage is unavailable.'),
        'storage failure displays a clear non-success message');
      check(await heart.getAttribute('aria-pressed') === 'false',
        'storage failure does not visually mark the product as saved');
      check((await page.evaluate(() => window.NOVA.wish.ids())).length === 0,
        'storage failure leaves the wishlist unchanged');
      check(await heart.getAttribute('aria-label') === 'Add Sahara Ceramic Vase to wishlist',
        'storage failure preserves the add-to-wishlist label');
      await context.close();
    }
    // The shared heart state persists from Shop to Quick View, Account Wishlist and Product Details.
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await seedWishlist(context, []);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(BASE_URL + 'shop.html', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() =>
        window.NOVA?.catalog?.ready &&
        document.querySelector('#shop-grid [data-wish="sahara-vase"]')
      );

      await page.locator('#shop-grid [data-wish="sahara-vase"]').click();
      await page.waitForFunction(() => window.NOVA.wish.has('sahara-vase'));
      check((await page.locator('#toastBody').textContent()).includes('Sahara Ceramic Vase saved to your wishlist.'),
        'Shop heart adds an item with product-specific success feedback');

      await page.locator('#shop-grid a[data-quick="luna-floor-lamp"]').click();
      await page.waitForSelector('#quickModal.show');
      await page.locator('#qv-wish').click();
      await page.waitForFunction(() => window.NOVA.wish.has('luna-floor-lamp'));
      check(await page.locator('#qv-wish').getAttribute('aria-pressed') === 'true',
        'Quick View adds to the same shared wishlist state');

      await page.goto(BASE_URL + 'account/wishlist.html', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.querySelectorAll('#account-wish-grid .product-card').length === 2);
      check(await page.evaluate(() => JSON.parse(localStorage.getItem('nova_wish') || '[]').length) === 2,
        'saved items persist when navigating from Shop/Quick View to Account Wishlist');

      await page.locator('#account-wish-grid .product-card__name a[href*="sahara-vase"]').click();
      await page.waitForURL(url => url.pathname.endsWith('/product.html') && url.searchParams.get('id') === 'sahara-vase');
      await page.waitForFunction(() => document.querySelector('#pdp-wish')?.getAttribute('aria-pressed') === 'true');
      check(await page.locator('#pdp-wish').getAttribute('aria-label') === 'Remove Sahara Ceramic Vase from wishlist',
        'Product Details reflects the saved heart state and accessible label');
      await page.locator('#pdp-wish').click();
      await page.waitForFunction(() => !window.NOVA.wish.has('sahara-vase'));
      check((await page.locator('#toastBody').textContent()).includes('Sahara Ceramic Vase removed from your wishlist.'),
        'Product Details can remove a saved item with specific feedback');
      check(errors.length === 0, 'cross-page wishlist journey produces no JavaScript page errors');
      await context.close();
    }

    // The shop-filtered wishlist empty state retains a direct path back to all products.
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await seedWishlist(context, []);
      const page = await context.newPage();
      await page.goto(BASE_URL + 'shop.html?wish=1', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#shop-grid .empty-state');
      check((await page.locator('#shop-grid .empty-state').innerText()).includes('Your wishlist is empty'),
        'shop wishlist view presents a specific empty state');
      check(await page.locator('#shop-grid #exit-wishlist-empty').isVisible(),
        'empty shop wishlist offers a Browse all products recovery action');
      await page.getByRole('button', { name: 'Browse all products' }).click();
      await page.waitForFunction(() => !new URL(location.href).searchParams.has('wish'));
      check((await page.locator('#shop-title').textContent()).trim() === 'All Pieces',
        'Browse all products clears the saved-list filter');
      await context.close();
    }

    console.log('\nWISHLIST UI TESTS PASSED: ' + checks + ' checks across four viewports, loading/stale states, storage failure and cross-page flows.\n');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error('\nWISHLIST UI TEST FAILED:', error);
  process.exit(1);
});
