/**
 * NOVA Home — product details responsive and gallery regression checks.
 * Local Playwright tests only: no database writes or authenticated actions.
 */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const BASE_URL = (process.env.NOVA_BASE_URL || 'http://localhost/nova-home/nova-home/').replace(/\/?$/, '/');
const PRODUCT_URL = BASE_URL + 'product.html?id=sahara-vase';

(async () => {
  const browser = await chromium.launch({ headless: true });
  let checks = 0;

  function check(condition, message) {
    checks++;
    assert.ok(condition, message);
    console.log('  [PASS] ' + message);
  }

  async function openProduct(context) {
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(PRODUCT_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
      const image = document.querySelector('#gallery-main');
      return image && image.complete && image.naturalWidth > 0 &&
        document.querySelector('#pdp-name')?.textContent.trim();
    }, { timeout: 12000 });
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
      const { page, pageErrors } = await openProduct(context);

      const state = await page.evaluate(() => {
        const image = document.querySelector('#gallery-main');
        return {
          name: document.querySelector('#pdp-name')?.textContent.trim(),
          imageLoaded: image?.naturalWidth > 0,
          imageWidth: image?.naturalWidth || 0,
          singleImageThumbsHidden: document.querySelector('#gallery-thumbs')?.hidden,
          specRows: document.querySelectorAll('#pdp-specs tr').length,
          relatedCards: document.querySelectorAll('#related-grid .product-card').length,
          noReviews: /No reviews yet/i.test(document.querySelector('#pdp-rating')?.innerText || ''),
          honestAvailability: /Availability is not tracked/i.test(document.querySelector('.stock')?.innerText || ''),
          hasPrice: !!document.querySelector('#pdp-price')?.textContent.trim(),
          overflows: document.documentElement.scrollWidth > innerWidth,
          minusDisabled: document.querySelector('#qty-minus')?.disabled
        };
      });

      check(Boolean(state.name), `${viewport.name}: product identity renders`);
      check(state.imageLoaded && state.imageWidth >= 600, `${viewport.name}: main product image loads at useful resolution`);
      check(state.singleImageThumbsHidden, `${viewport.name}: single-image gallery hides empty thumbnails`);
      check(state.specRows > 0, `${viewport.name}: product specifications render`);
      check(state.relatedCards > 0, `${viewport.name}: related products render`);
      check(state.noReviews, `${viewport.name}: unavailable reviews are not fabricated`);
      check(state.honestAvailability, `${viewport.name}: untracked inventory is described honestly`);
      check(state.hasPrice, `${viewport.name}: product price renders`);
      check(!state.overflows, `${viewport.name}: page has no horizontal overflow`);
      check(state.minusDisabled, `${viewport.name}: quantity cannot decrease below one`);

      await page.locator('#qty-plus').click();
      check((await page.locator('#qty-value').textContent()).trim() === '2', `${viewport.name}: quantity increases`);
      await page.locator('#qty-minus').click();
      check((await page.locator('#qty-value').textContent()).trim() === '1' &&
        await page.locator('#qty-minus').isDisabled(), `${viewport.name}: quantity returns to and stops at one`);
      for (let i = 0; i < 9; i++) await page.locator('#qty-plus').click();
      check((await page.locator('#qty-value').textContent()).trim() === '10' &&
        await page.locator('#qty-plus').isDisabled(), `${viewport.name}: quantity stops at ten`);

      await page.locator('#ship-city').selectOption('alexandria');
      await page.waitForFunction(() => document.querySelector('#ship-days')?.textContent.includes('Alexandria'));
      check((await page.locator('#ship-days').textContent()).includes('2–3 working days'),
        `${viewport.name}: delivery estimate updates for Alexandria`);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(180);
      const sticky = await page.evaluate(() => {
        const bar = document.querySelector('#sticky-atc');
        return {
          hidden: !!bar?.hidden,
          visible: !!bar && getComputedStyle(bar).visibility === 'visible' &&
            bar.getBoundingClientRect().height > 0,
          quantity: document.querySelector('#sticky-add')?.dataset.qty
        };
      });

      if (viewport.width < 768) {
        check(!sticky.hidden && sticky.visible, `${viewport.name}: sticky Add to Cart appears after scrolling past actions`);
        check(sticky.quantity === '10', `${viewport.name}: sticky Add to Cart mirrors the selected quantity`);
      } else {
        check(sticky.hidden, `${viewport.name}: mobile sticky Add to Cart stays hidden on larger screens`);
      }
      check(pageErrors.length === 0, `${viewport.name}: no JavaScript page errors`);

      await context.close();
      console.log('--- ' + viewport.name + ' complete ---');
    }

    // The product image from the catalogue must remain available when detail enrichment fails.
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      await page.route('**/api/product.php?*', route => route.abort());
      await page.goto(PRODUCT_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#pdp-name');
      await page.waitForFunction(() => document.querySelector('#gallery-main')?.naturalWidth > 0);
      const fallback = await page.locator('#gallery-main').getAttribute('src');
      check(fallback.includes('assets/images/products/sahara-vase/main.webp'),
        'catalogue image remains visible when the optional product-detail API is unavailable');
      await context.close();
    }

    // Mock a second existing asset to exercise the gallery even though demo products currently have one image each.
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      await page.route('**/api/product.php?*', async route => {
        const response = await route.fetch();
        const body = await response.json();
        body.data.images = [
          body.data.images[0],
          { image_path: 'assets/images/products/luna-floor-lamp/main.webp' }
        ];
        await route.fulfill({ response, body: JSON.stringify(body) });
      });
      await page.goto(PRODUCT_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.querySelectorAll('.gallery__thumb').length === 2);
      await page.locator('.gallery__thumb').nth(1).click();
      await page.waitForFunction(() =>
        document.querySelector('#gallery-main')?.getAttribute('src')?.includes('luna-floor-lamp/main.webp')
      );
      check(await page.locator('.gallery__thumb[aria-current="true"]').getAttribute('aria-label') === 'Show image 2',
        'selecting a thumbnail updates the main image and selected-thumbnail state');
      await context.close();
    }

    // Verify the product-page CTA uses the shared cart and success-feedback path in isolated browser storage.
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const { page } = await openProduct(context);
      await page.locator('#pdp-add').click();
      await page.waitForFunction(() => window.NOVA?.cart?.count() === 1);
      check(await page.evaluate(() => window.NOVA.cart.items()[0]?.id) === 'sahara-vase',
        'Add to Cart adds the current product to browser-local cart state');
      check((await page.locator('#toastBody').textContent()).includes('Sahara Ceramic Vase added to your cart'),
        'Add to Cart displays product-specific success feedback');
      await context.close();
    }

    console.log('\nPRODUCT DETAILS TESTS PASSED: ' + checks + ' checks across ' + viewports.length + ' viewports, fallback, gallery, and cart feedback.\n');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error('\nPRODUCT DETAILS TEST FAILED:', error);
  process.exit(1);
});
