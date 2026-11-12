/**
 * NOVA Home — focused responsive shop and Quick View regression checks.
 * Runs against the local Apache site; no database records are created.
 */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const BASE_URL = (process.env.NOVA_BASE_URL || 'http://localhost/nova-home/nova-home/').replace(/\/?$/, '/');
const VIEWPORTS = [
  { name: 'small phone', width: 360, height: 740 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet portrait', width: 768, height: 1024 },
  { name: 'tablet landscape', width: 1024, height: 768 },
  { name: 'desktop', width: 1280, height: 800 }
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  let checks = 0;

  function check(condition, message) {
    checks++;
    assert.ok(condition, message);
    console.log(`  [PASS] ${message}`);
  }

  try {
    for (const viewport of VIEWPORTS) {
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: viewport.width < 768,
        hasTouch: viewport.width <= 1024
      });
      const pageErrors = [];
      const ariaWarnings = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      page.on('console', message => {
        if (/Blocked aria-hidden on an element/i.test(message.text())) {
          ariaWarnings.push(message.text());
        }
      });

      console.log(`\n--- ${viewport.name} (${viewport.width}x${viewport.height}) ---`);
      await page.goto(BASE_URL + 'shop.html', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#shop-grid .product-card', { timeout: 12000 });
      check(await page.locator('#shop-grid .product-card').count() > 0, 'Shop products render');
      check(await page.locator('.quick-btn').count() === 0, 'Legacy always-visible Quick View pills are removed');

      if (viewport.width < 992) {
        await page.getByRole('button', { name: 'Filters' }).click();
        await page.waitForFunction(
          () => document.querySelector('#filters')?.classList.contains('show'),
          { timeout: 5000 }
        );

        const filterState = await page.locator('#filters').evaluate(panel => {
          const actions = panel.querySelector('.filter-actions').getBoundingClientRect();
          const scroll = panel.querySelector('.filters-scroll');
          return {
            fieldsets: panel.querySelectorAll('fieldset').length,
            actionsVisible: actions.height > 0 && actions.top >= 0 && actions.bottom <= innerHeight + 1,
            scrollHeight: scroll.scrollHeight,
            clientHeight: scroll.clientHeight,
            panelHeight: panel.getBoundingClientRect().height
          };
        });
        check(filterState.fieldsets === 3, 'Category, material, and price filters are all present');
        check(filterState.actionsVisible, 'Clear all and Show results stay visible inside the drawer');
        check(filterState.panelHeight <= viewport.height + 1, 'Filter drawer stays within the viewport');

        if (filterState.scrollHeight > filterState.clientHeight) {
          await page.locator('#filters .filters-scroll').evaluate(el => { el.scrollTop = el.scrollHeight; });
          check(await page.locator('#p-4').isVisible(), 'The bottom price option remains reachable by scrolling');
        }

        await page.locator('#mat-wood').check();
        check(await page.locator('[data-remove-filter="material"]').count() === 1, 'Filter selections update the active-filter chips');
        await page.getByRole('button', { name: 'Show results' }).click();
        await page.waitForFunction(
          () => !document.querySelector('#filters')?.classList.contains('show'),
          { timeout: 5000 }
        );
        check(true, 'Show results closes the drawer');
      }

      const firstImageLink = page.locator('#shop-grid .product-card__media > a[data-quick]').first();
      const firstImageHref = await firstImageLink.getAttribute('href');
      const productNameLink = page.locator('#shop-grid .product-card__name a').first();
      check(firstImageHref.includes('product.html?id='), 'Product image keeps a full-page fallback URL');
      check(!(await productNameLink.getAttribute('data-quick')), 'Product name remains a full product-page link');

      if (viewport.width >= 1200) {
        const hint = page.locator('.product-card__preview-hint').first();
        await firstImageLink.hover();
        await page.waitForFunction(
          () => getComputedStyle(document.querySelector('.product-card__preview-hint')).opacity === '1',
          { timeout: 2000 }
        );
        check(await hint.isVisible(), 'Desktop shows the quiet Quick View hint only on hover');
      } else if (viewport.width < 768) {
        const hintDisplay = await page.locator('.product-card__preview-hint').first()
          .evaluate(el => getComputedStyle(el).display);
        check(hintDisplay === 'none', 'Touch screens do not show a repeated Quick View badge');
      }

      await firstImageLink.focus();
      await page.keyboard.press('Enter');
      await page.waitForSelector('#quickModal.show', { timeout: 5000 });
      await page.waitForFunction(() => {
        const dialog = document.querySelector('#quickModal .modal-dialog');
        const card = document.querySelector('#quickModal .qv');
        if (!dialog || !card) return false;
        const style = getComputedStyle(dialog);
        const matrix = style.transform;
        const y = matrix === 'none' ? 0 : Number(matrix.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,[^,]+,([^\)]+)\)/)?.[1] || 999);
        return Math.abs(y) < 1 && card.getBoundingClientRect().height > 0;
      }, { timeout: 5000 });

      const modalState = await page.locator('#quickModal .qv').evaluate(card => {
        const rect = card.getBoundingClientRect();
        return {
          title: document.querySelector('#qv-title')?.textContent.trim(),
          height: rect.height,
          width: rect.width,
          top: rect.top,
          bottom: rect.bottom,
          viewportHeight: innerHeight,
          viewportWidth: innerWidth,
          detailHref: document.querySelector('#qv-link')?.getAttribute('href')
        };
      });
      check(Boolean(modalState.title), 'Quick View opens with the selected product');
      check(modalState.height < viewport.height * 0.85, 'Quick View is compact rather than nearly full-screen');
      check(modalState.width <= viewport.width, 'Quick View fits the viewport width');
      check(modalState.top >= -1 && modalState.bottom <= viewport.height + 1, 'Quick View card stays within the visible viewport');
      check(modalState.detailHref.includes('product.html?id='), 'Quick View retains its full product details link');

      await page.locator('#qv-plus').click();
      check((await page.locator('#qv-qty').textContent()).trim() === '2', 'Quick View quantity control works');
      await page.locator('#qv-add').click();
      await page.waitForFunction(
        () => Number(document.querySelector('[data-cart-count]')?.textContent || 0) >= 2,
        { timeout: 3000 }
      );
      check(true, 'Quick View Add to Cart carries the selected quantity');

      await page.locator('#quickModal button[aria-label="Close quick view"]').click();
      await page.waitForFunction(() => {
        const modal = document.querySelector('#quickModal');
        return modal && !modal.classList.contains('show') && modal.getAttribute('aria-hidden') === 'true';
      }, { timeout: 5000 });
      await page.waitForFunction(
        trigger => document.activeElement === trigger,
        await firstImageLink.elementHandle(),
        { timeout: 3000 }
      );
      check(true, 'Keyboard focus returns to the image trigger after close');
      check(!(await page.locator('body').evaluate(el => el.classList.contains('modal-open'))), 'Bootstrap releases the page scroll lock after close');
      check(ariaWarnings.length === 0, 'Closing Quick View produces no aria-hidden focus warning');
      check(pageErrors.length === 0, 'No JavaScript page errors occur');

      await page.close();
    }

    const homePage = await browser.newPage({ viewport: { width: 1280, height: 850 } });
    const homeErrors = [];
    homePage.on('pageerror', error => homeErrors.push(error.message));
    await homePage.goto(BASE_URL + 'index.html', { waitUntil: 'domcontentloaded' });
    const homeAnchor = homePage.locator('.look__quick-anchor[data-look]');
    await homeAnchor.waitFor({ state: 'visible', timeout: 10000 });
    await homeAnchor.click();
    await homePage.waitForSelector('#quickModal.show', { timeout: 5000 });
    check(
      (await homePage.locator('#qv-title').textContent()).includes('Cairo Boucle'),
      'The homepage curated-look Quick View button still opens its anchor product'
    );
    await homePage.locator('#quickModal button[aria-label="Close quick view"]').click();
    await homePage.waitForFunction(
      () => document.querySelector('#quickModal')?.getAttribute('aria-hidden') === 'true'
    );
    await homePage.waitForFunction(trigger => document.activeElement === trigger, await homeAnchor.elementHandle());
    check(true, 'Homepage Quick View restores focus to its original button');

    const lookCard = homePage.locator('.look-card[data-look]').first();
    if (await lookCard.count()) {
      const lookCardProduct = await lookCard.getAttribute('data-look');
      await lookCard.locator('.look-card__cat').click();
      await homePage.waitForSelector('#quickModal.show', { timeout: 5000 });
      check(
        (await homePage.locator('#qv-title').textContent()).length > 0,
        `Homepage curated product card opens Quick View (${lookCardProduct})`
      );
      await homePage.locator('#quickModal button[aria-label="Close quick view"]').click();
      await homePage.waitForFunction(
        () => document.querySelector('#quickModal')?.getAttribute('aria-hidden') === 'true'
      );
    }
    check(homeErrors.length === 0, 'No JavaScript page errors occur on the homepage');
    await homePage.close();

    console.log(`\nRESPONSIVE SHOP UI TESTS PASSED: ${checks} checks across ${VIEWPORTS.length} viewports plus homepage Quick View flows.\n`);
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error('\nRESPONSIVE SHOP UI TEST FAILED:', error);
  process.exit(1);
});
