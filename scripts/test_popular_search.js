/**
 * NOVA Home - popular keyword search regression checks.
 * Playwright uses catalogue GET requests only; no authenticated writes or DB mutations.
 */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const BASE_URL = (process.env.NOVA_BASE_URL || 'http://localhost/nova-home/nova-home/').replace(/\/?$/, '/');
const CASES = [
  { term: 'Lamps', expected: ['Dune Bedside Table Lamp', 'Luna Arc Floor Lamp'] },
  { term: 'Vases', expected: ['Sahara Ceramic Vase'] },
  { term: 'Lighting', expected: ['Dune Bedside Table Lamp', 'Luna Arc Floor Lamp', 'Oasis Pendant Light'] },
  { term: 'Storage', expected: ['Nile Woven Basket Set', 'Stack Modular Shelf'] }
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  let checks = 0;

  function check(condition, message) {
    checks++;
    assert.ok(condition, message);
    console.log('  [PASS] ' + message);
  }

  const sorted = values => [...values].sort((a, b) => a.localeCompare(b));

  try {
    for (const testCase of CASES) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));

      await page.goto(BASE_URL + 'shop.html?q=' + encodeURIComponent(testCase.term), {
        waitUntil: 'domcontentloaded'
      });
      await page.waitForFunction(() =>
        window.NOVA?.catalog?.ready &&
        document.querySelector('#result-count')?.textContent !== 'Loading products…',
        { timeout: 12000 }
      );

      const rendered = sorted((await page.locator('#shop-grid .product-card__name').allTextContents())
        .map(name => name.trim()));
      const suggestions = sorted(await page.evaluate(term =>
        NOVA.search.suggestions(term, 10).map(product => product.name), testCase.term
      ));

      check(JSON.stringify(rendered) === JSON.stringify(sorted(testCase.expected)),
        testCase.term + ': Shop query renders the expected catalogue products');
      check(JSON.stringify(suggestions) === JSON.stringify(sorted(testCase.expected)),
        testCase.term + ': autocomplete suggestions agree with the Shop results');
      check((await page.locator('#result-count').textContent()).trim() ===
        testCase.expected.length + ' piece' + (testCase.expected.length === 1 ? '' : 's'),
        testCase.term + ': result count reflects the matching products');
      check(pageErrors.length === 0, testCase.term + ': no JavaScript page errors');

      await page.close();
    }

    // Exercise the actual popular-chip path in the header search modal, not only URL queries.
    for (const term of ['Lamps', 'Vases']) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
      await page.goto(BASE_URL + 'index.html', { waitUntil: 'domcontentloaded' });
      await page.locator('[data-bs-target="#searchModal"]').click();
      await page.waitForSelector('#searchModal.show');
      await page.locator('#searchInput').click();
      await page.waitForSelector('#searchPanel [data-chip]');
      await page.locator('#searchPanel [data-chip="' + term + '"]').click();
      await page.waitForFunction(() => document.querySelectorAll('#searchPanel [data-pid]').length > 0);
      check((await page.locator('#searchInput').inputValue()) === term,
        term + ': popular keyword chip populates the header search');
      check(await page.locator('#searchPanel [data-pid]').count() > 0,
        term + ': popular keyword immediately offers matching products');

      await page.locator('#searchPanel [data-all]').click();
      await page.waitForURL(url =>
        url.pathname.endsWith('/shop.html') && url.searchParams.get('q') === term.toLowerCase(),
        { timeout: 5000 }
      );
      await page.waitForFunction(() =>
        window.NOVA?.catalog?.ready &&
        document.querySelector('#result-count')?.textContent !== 'Loading products…'
      );
      check((await page.locator('#shop-grid .product-card').count()) > 0,
        term + ': View all results opens a populated Shop page');
      await page.close();
    }

    console.log('\nPOPULAR SEARCH TESTS PASSED: ' + checks + ' checks across all four popular terms and both header-chip journeys.\n');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error('\nPOPULAR SEARCH TESTS FAILED:', error);
  process.exit(1);
});
