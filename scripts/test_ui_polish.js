/**
 * NOVA Home — focused accessibility and UI-polish regressions.
 * Tests progressive enhancement, reduced motion, combobox keyboard behavior,
 * password visibility controls, and basic accessible-name/overflow checks.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const BASE_URL = (process.env.NOVA_BASE_URL || 'http://localhost/nova-home/nova-home/').replace(/\/?$/, '/');

(async () => {
  const browser = await chromium.launch({ headless: true });
  let checks = 0;

  function check(condition, message) {
    checks++;
    assert.ok(condition, message);
    console.log(`  [PASS] ${message}`);
  }

  async function checkPageBasics(page, route, viewport) {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(BASE_URL + route, { waitUntil: 'domcontentloaded' });
    check(response && response.status() === 200, `${route} returns HTTP 200`);
    await page.waitForTimeout(250);

    const audit = await page.evaluate(() => {
      const visible = element => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      };
      const accessibleName = element => (
        element.getAttribute('aria-label') ||
        element.getAttribute('title') ||
        element.innerText ||
        element.value ||
        ''
      ).trim();
      const unlabeledFields = [...document.querySelectorAll('input:not([type="hidden"]), select, textarea')]
        .filter(visible)
        .filter(element => !element.labels?.length && !element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby'));
      const unnamedButtons = [...document.querySelectorAll('button')]
        .filter(visible)
        .filter(element => !accessibleName(element));
      const unnamedLinks = [...document.querySelectorAll('a')]
        .filter(visible)
        .filter(element => !accessibleName(element));
      const missingAlt = [...document.querySelectorAll('img')]
        .filter(visible)
        .filter(element => !element.hasAttribute('alt'));
      const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
      return {
        main: Boolean(document.querySelector('main')),
        h1Count: document.querySelectorAll('main h1').length,
        unlabeledFields: unlabeledFields.length,
        unnamedButtons: unnamedButtons.length,
        unnamedLinks: unnamedLinks.length,
        missingAlt: missingAlt.length,
        duplicateIds: new Set(ids.filter((id, index) => ids.indexOf(id) !== index)).size,
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1
      };
    });

    check(audit.main, `${route} has a main landmark`);
    check(audit.h1Count === 1, `${route} has one main heading`);
    check(audit.unlabeledFields === 0, `${route} has no visible unlabeled form fields`);
    check(audit.unnamedButtons === 0, `${route} has no visible unnamed buttons`);
    check(audit.unnamedLinks === 0, `${route} has no visible unnamed links`);
    check(audit.missingAlt === 0, `${route} has no visible images missing alt text`);
    check(audit.duplicateIds === 0, `${route} has no duplicate IDs`);
    check(!audit.horizontalOverflow, `${route} has no horizontal overflow at ${viewport.width}px`);
    check(errors.length === 0, `${route} has no page JavaScript errors`);
  }

  async function checkCombobox(page, inputSelector, panelSelector, expectedRoute, label) {
    const input = page.locator(inputSelector);
    await input.fill('sahara');
    const panel = page.locator(panelSelector);
    await page.waitForFunction(selector => {
      const node = document.querySelector(selector);
      return node && !node.hidden && node.querySelector('[role="option"]');
    }, panelSelector);
    check(await input.getAttribute('role') === 'combobox', `${label} input exposes combobox semantics`);
    check(await input.getAttribute('aria-haspopup') === 'listbox', `${label} announces its listbox popup`);
    check(await panel.getAttribute('role') === 'listbox', `${label} suggestion panel is a listbox`);

    await input.press('ArrowDown');
    const activeId = await input.getAttribute('aria-activedescendant');
    check(Boolean(activeId), `${label} keyboard navigation sets aria-activedescendant`);
    check(await panel.locator(`#${activeId}`).getAttribute('aria-selected') === 'true', `${label} marks the active option as selected`);

    await input.press('Enter');
    await page.waitForURL(url => url.pathname.endsWith(expectedRoute) && url.searchParams.get('id') === 'sahara-vase', { timeout: 5000 });
    check(true, `${label} Enter key opens the active product suggestion`);
  }

  try {
    console.log('\n--- Progressive enhancement ---');
    const noJsPage = await browser.newPage({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
    await noJsPage.goto(BASE_URL + 'index.html', { waitUntil: 'domcontentloaded' });
    await noJsPage.waitForSelector('[data-reveal]');
    await noJsPage.waitForTimeout(150);
    const revealState = await noJsPage.locator('[data-reveal]').first().evaluate(element => ({
      opacity: getComputedStyle(element).opacity,
      visibility: getComputedStyle(element).visibility,
      bodyReady: document.body.classList.contains('is-ready')
    }));
    check(revealState.opacity === '1' && revealState.visibility === 'visible' && !revealState.bodyReady,
      'Content remains visible when JavaScript is unavailable');

    console.log('\n--- Reduced motion ---');
    const reducedPage = await browser.newPage({
      viewport: { width: 390, height: 844 },
      reducedMotion: 'reduce'
    });
    await reducedPage.goto(BASE_URL + 'index.html', { waitUntil: 'domcontentloaded' });
    await reducedPage.waitForFunction(() => document.body.classList.contains('is-ready'));
    const reducedState = await reducedPage.locator('[data-reveal]').first().evaluate(element => ({
      opacity: getComputedStyle(element).opacity,
      transform: getComputedStyle(element).transform,
      motion: matchMedia('(prefers-reduced-motion: reduce)').matches
    }));
    check(reducedState.motion && reducedState.opacity === '1' && reducedState.transform === 'none',
      'Reveal content stays visible and still under reduced-motion preferences');
    const addressSource = fs.readFileSync(path.join(__dirname, '..', 'account', 'addresses.php'), 'utf8');
    check(addressSource.includes("window.matchMedia('(prefers-reduced-motion: reduce)')") &&
      addressSource.includes("behavior: reduceMotion ? 'auto' : 'smooth'"),
      'Address editor scrolling respects reduced-motion preferences');
    await reducedPage.close();

    console.log('\n--- Small-screen accessible-name and layout sweep ---');
    for (const route of [
      'index.html',
      'shop.html',
      'product.html?id=sahara-vase',
      'cart.html',
      'account/login.php',
      'account/register.php'
    ]) {
      const auditPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await checkPageBasics(auditPage, route, { width: 390, height: 844 });
      await auditPage.close();
    }

    console.log('\n--- Mobile navigation drawer ---');
    const mobileMenuPage = await browser.newPage({
      viewport: { width: 320, height: 780 },
      isMobile: true,
      hasTouch: true
    });
    const mobileMenuErrors = [];
    mobileMenuPage.on('pageerror', error => mobileMenuErrors.push(error.message));
    await mobileMenuPage.goto(BASE_URL + 'index.html', { waitUntil: 'domcontentloaded' });
    await mobileMenuPage.waitForFunction(() => window.NOVA?.catalog?.ready);
    const menuTrigger = mobileMenuPage.locator('.site-header__menu');
    const menuTriggerSize = await menuTrigger.evaluate(button => {
      const rect = button.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    check(menuTriggerSize.width >= 44 && menuTriggerSize.height >= 44,
      '320px mobile menu trigger meets the 44px touch-target standard');
    const headerTargets = await mobileMenuPage.locator('.site-header .icon-btn:visible').evaluateAll(buttons =>
      buttons.every(button => {
        const rect = button.getBoundingClientRect();
        return rect.width >= 44 && rect.height >= 44;
      })
    );
    check(headerTargets, '320px visible header icon actions all meet the 44px touch-target standard');
    await menuTrigger.click();
    await mobileMenuPage.waitForFunction(() => document.querySelector('#navDrawer')?.classList.contains('show'));
    const openDrawer = await mobileMenuPage.locator('#navDrawer').evaluate(drawer => {
      const links = [...drawer.querySelectorAll('.drawer-nav a')].filter(link => {
        const rect = link.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      const rect = drawer.getBoundingClientRect();
      return {
        width: rect.width,
        role: drawer.getAttribute('role'),
        labelledBy: drawer.getAttribute('aria-labelledby'),
        linkCount: links.length,
        minLinkHeight: Math.min(...links.map(link => link.getBoundingClientRect().height)),
        overflow: document.documentElement.scrollWidth > innerWidth + 1
      };
    });
    check(openDrawer.width <= 320 && !openDrawer.overflow,
      '320px navigation drawer fits the viewport without horizontal overflow');
    check(openDrawer.role === 'dialog' && openDrawer.labelledBy === 'navDrawerLabel',
      'mobile navigation drawer exposes a labelled dialog to assistive technology');
    check(openDrawer.linkCount >= 7 && openDrawer.minLinkHeight >= 48,
      'mobile navigation destinations retain readable labels and 48px rows');
    await mobileMenuPage.keyboard.press('Escape');
    await mobileMenuPage.waitForFunction(() => !document.querySelector('#navDrawer')?.classList.contains('show'));
    check(true, 'Escape closes the mobile navigation drawer');
    await menuTrigger.click();
    await mobileMenuPage.waitForFunction(() => document.querySelector('#navDrawer')?.classList.contains('show'));
    await mobileMenuPage.locator('#navDrawer .drawer-nav a[href="#contact"]').click();
    await mobileMenuPage.waitForFunction(() => !document.querySelector('#navDrawer')?.classList.contains('show'));
    check(new URL(mobileMenuPage.url()).hash === '#contact',
      'Contact navigation scrolls to the footer and dismisses the mobile drawer');
    check(mobileMenuErrors.length === 0,
      'mobile navigation open, close and anchor journeys produce no JavaScript errors');
    await mobileMenuPage.close();

    console.log('\n--- Shop search combobox ---');
    const shopPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await shopPage.goto(BASE_URL + 'shop.html', { waitUntil: 'domcontentloaded' });
    await shopPage.waitForSelector('#shop-grid .product-card');
    if (await shopPage.getByRole('button', { name: 'Filters' }).count()) {
      await shopPage.getByRole('button', { name: 'Filters' }).click();
      await shopPage.waitForFunction(() => document.querySelector('#filters')?.classList.contains('show'));
    }
    await checkCombobox(shopPage, '#f-search', '#shopPanel', 'product.html', 'Shop search');
    await shopPage.goto(BASE_URL + 'shop.html', { waitUntil: 'domcontentloaded' });
    await shopPage.waitForSelector('#shop-grid .product-card');
    await shopPage.getByRole('button', { name: 'Filters' }).click();
    await shopPage.waitForFunction(() => document.querySelector('#filters')?.classList.contains('show'));
    await shopPage.locator('#f-search').fill('no-matching-product-987');
    await shopPage.waitForFunction(() => document.querySelector('#shopPanel')?.querySelector('[data-all]'));
    await shopPage.locator('#f-search').press('ArrowDown');
    await shopPage.locator('#f-search').press('Enter');
    await shopPage.waitForTimeout(250);
    check((await shopPage.locator('#f-search').inputValue()) === '' && !new URL(shopPage.url()).searchParams.has('q'),
      'Shop empty-state action clears the search instead of retaining a dead query');
    await shopPage.close();

    console.log('\n--- Header search combobox ---');
    const headerPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await headerPage.goto(BASE_URL + 'index.html', { waitUntil: 'domcontentloaded' });
    await headerPage.getByRole('button', { name: 'Search products' }).click();
    await headerPage.waitForSelector('#searchInput');
    await checkCombobox(headerPage, '#searchInput', '#searchPanel', 'product.html', 'Header search');
    await headerPage.goto(BASE_URL + 'index.html', { waitUntil: 'domcontentloaded' });
    await headerPage.getByRole('button', { name: 'Search products' }).click();
    await headerPage.locator('#searchInput').fill('no-matching-product-987');
    await headerPage.waitForFunction(() => document.querySelector('#searchPanel')?.querySelector('[data-all]'));
    await headerPage.locator('#searchInput').press('ArrowDown');
    await headerPage.locator('#searchInput').press('Enter');
    await headerPage.waitForURL(url => url.pathname.endsWith('/shop.html') && !url.searchParams.has('q'), { timeout: 5000 });
    check(true, 'Header empty-state action browses all products without a dead search query');
    await headerPage.close();

    console.log('\n--- Customer password visibility ---');
    const loginPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await loginPage.goto(BASE_URL + 'account/login.php', { waitUntil: 'domcontentloaded' });
    const loginToggle = loginPage.locator('[data-password-toggle]');
    check(await loginToggle.count() === 1, 'Sign-in form has one password visibility control');
    await loginToggle.click();
    check(await loginPage.locator('#l-pass').getAttribute('type') === 'text', 'Sign-in password can be revealed');
    check(await loginToggle.getAttribute('aria-label') === 'Hide password' && await loginToggle.getAttribute('aria-pressed') === 'true',
      'Sign-in visibility state is announced accessibly');
    await loginToggle.click();
    check(await loginPage.locator('#l-pass').getAttribute('type') === 'password', 'Sign-in password can be hidden again');

    const registerPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await registerPage.goto(BASE_URL + 'account/register.php', { waitUntil: 'domcontentloaded' });
    const registerToggles = registerPage.locator('[data-password-toggle]');
    check(await registerToggles.count() === 2, 'Registration form has separate controls for both password fields');
    await registerToggles.nth(0).click();
    await registerToggles.nth(1).click();
    check(await registerPage.locator('#r-pass').getAttribute('type') === 'text' && await registerPage.locator('#r-pass2').getAttribute('type') === 'text',
      'Both registration passwords can be revealed independently');
    check(await registerToggles.nth(0).getAttribute('aria-pressed') === 'true' && await registerToggles.nth(1).getAttribute('aria-pressed') === 'true',
      'Both registration visibility states are announced accessibly');
    await registerPage.locator('#cust-register-form').evaluate(form => form.classList.add('was-validated'));
    const feedbackVisible = await registerPage.locator('#r-pass').evaluate(input => {
      const feedback = input.parentElement.querySelector('.invalid-feedback');
      return getComputedStyle(feedback).display !== 'none';
    });
    check(feedbackVisible, 'Registration password validation feedback remains visible with the toggle present');

    console.log('\n--- Admin password visibility and validation ---');
    const adminPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await adminPage.goto(BASE_URL + 'admin/login.php', { waitUntil: 'domcontentloaded' });
    const adminToggle = adminPage.locator('#toggle-pwd');
    check(await adminToggle.getAttribute('data-password-toggle') !== null,
      'Admin sign-in reuses the shared accessible password toggle');
    await adminToggle.click();
    check(await adminPage.locator('#a-pass').getAttribute('type') === 'text',
      'Admin password can be revealed');
    check(await adminToggle.getAttribute('aria-label') === 'Hide password' &&
      await adminToggle.getAttribute('aria-pressed') === 'true',
      'Admin password reveal state is announced accessibly');
    await adminToggle.click();
    check(await adminPage.locator('#a-pass').getAttribute('type') === 'password' &&
      await adminToggle.getAttribute('aria-label') === 'Show password' &&
      await adminToggle.getAttribute('aria-pressed') === 'false',
      'Admin password can be hidden with its accessible state reset');

    await adminPage.locator('#admin-login-form').evaluate(form =>
      form.requestSubmit(document.getElementById('admin-login-btn'))
    );
    const adminFeedbackVisible = await adminPage.locator('#admin-login-form .invalid-feedback').evaluateAll(items =>
      items.length === 2 && items.every(item => getComputedStyle(item).display !== 'none' &&
        item.getBoundingClientRect().height > 0)
    );
    check(adminFeedbackVisible, 'Admin email and password validation hints appear after an empty submit');
    await adminPage.close();
    await loginPage.close();
    await registerPage.close();
    await noJsPage.close();

    console.log(`\nUI POLISH TESTS PASSED: ${checks} checks.\n`);
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error('\nUI POLISH TEST FAILED:', error);
  process.exit(1);
});
