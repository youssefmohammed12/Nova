/**
 * NOVA Home - Milestone 3 shared product-card visual foundation checks.
 * Read-only catalogue GETs; isolated browser contexts; no checkout or DB writes.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const BASE_URL = (process.env.NOVA_BASE_URL || 'http://localhost/nova-home/nova-home/').replace(/\/?$/, '/');
const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844, mobile: true },
  { name: 'desktop', width: 1280, height: 900, mobile: false }
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  let checks = 0;
  function check(condition, message) {
    checks++;
    assert.ok(condition, message);
    console.log('  [PASS] ' + message);
  }

  try {
    const sharedSidebar = fs.readFileSync(path.join(__dirname, '..', 'includes', 'account-side.php'), 'utf8');
    check(sharedSidebar.includes('class="cust-logout-btn account-side-logout"'),
      'shared customer account navigation applies its dedicated sign-out treatment');
    check(sharedSidebar.includes('aria-current="page"'),
      'shared customer account navigation exposes the active destination to assistive technology');
    const accountNavStates = [
      ['index.php', 'dashboard'],
      ['orders.php', 'orders'],
      ['addresses.php', 'addresses'],
      ['profile.php', 'profile'],
      ['order.php', 'orders']
    ];
    for (const [fileName, navKey] of accountNavStates) {
      const source = fs.readFileSync(path.join(__dirname, '..', 'account', fileName), 'utf8');
      check(source.includes("$accountNav = '" + navKey + "';"),
        fileName + ': customer navigation selects the correct active destination');
    }
    const addressSource = fs.readFileSync(path.join(__dirname, '..', 'account', 'addresses.php'), 'utf8');
    check(addressSource.includes('address-pill address-pill--default') && addressSource.includes('addr-actions'),
      'saved-address markup uses the terracotta default badge and dedicated action layout');
    check(addressSource.includes('id="addr-ok" hidden tabindex="-1" role="status"'),
      'saved-address success feedback can receive the focus assigned by its form handler');
    const profileSource = fs.readFileSync(path.join(__dirname, '..', 'account', 'profile.php'), 'utf8');
    check(profileSource.includes('id="cust-profile-ok" hidden tabindex="-1" role="status"') &&
      profileSource.includes("errBox.hidden = false; errBox.focus(); });"),
      'profile success and connection-error feedback both support the intended focus handoff');
    const orderSource = fs.readFileSync(path.join(__dirname, '..', 'account', 'order.php'), 'utf8');
    check(orderSource.includes('<h1>Order details</h1>') &&
      orderSource.includes('table-card--order-detail') &&
      orderSource.includes('<section class="order-detail-mobile-list"'),
      'order details has a fallback page heading and a dedicated mobile item-list presentation');

    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: viewport.mobile,
        hasTouch: viewport.mobile
      });

      for (const [pageName, url, grid] of [
        ['homepage', 'index.html', '#featured-grid'],
        ['shop', 'shop.html', '#shop-grid']
      ]) {
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(BASE_URL + url, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() =>
          window.NOVA?.catalog?.ready &&
          document.querySelectorAll('#featured-grid .product-card, #shop-grid .product-card').length > 0,
          { timeout: 12000 }
        );
        const card = page.locator(grid + ' .product-card').first();
        await card.waitFor({ state: 'visible' });
        const style = await card.evaluate(el => {
          const cat = el.querySelector('.product-card__cat');
          const material = el.querySelector('.product-card__mat');
          const name = el.querySelector('.product-card__name');
          const price = el.querySelector('.price');
          const add = el.querySelector('.product-card__add');
          const cardStyle = getComputedStyle(el);
          return {
            radius: parseFloat(cardStyle.borderTopLeftRadius),
            shadow: cardStyle.boxShadow,
            border: cardStyle.borderTopColor,
            categoryDisplay: cat && getComputedStyle(cat).display,
            categoryWeight: cat && Number(getComputedStyle(cat).fontWeight),
            materialDisplay: material && getComputedStyle(material).display,
            materialIsSeparate: !!material && material.previousElementSibling === cat,
            titleWeight: name && Number(getComputedStyle(name).fontWeight),
            priceWeight: price && Number(getComputedStyle(price).fontWeight),
            addHeight: add && add.getBoundingClientRect().height,
            imageRatio: (() => {
              const r = el.querySelector('.product-card__media').getBoundingClientRect();
              return Math.abs(r.width - r.height) / Math.max(r.width, r.height);
            })(),
            overflow: document.documentElement.scrollWidth > innerWidth
          };
        });
        check(style.radius >= 10, viewport.name + ' ' + pageName + ': product cards have the refined rounded surface');
        check(style.shadow !== 'none', viewport.name + ' ' + pageName + ': product cards retain subtle surface depth');
        check(style.categoryDisplay === 'block' && style.categoryWeight >= 600,
          viewport.name + ' ' + pageName + ': category has a distinct editorial label');
        check(style.materialDisplay === 'block' && style.materialIsSeparate,
          viewport.name + ' ' + pageName + ': material sits on its own line below category');
        check(style.titleWeight >= 600 && style.priceWeight >= 600,
          viewport.name + ' ' + pageName + ': product name and price hierarchy remains clear');
        check(style.addHeight >= 44,
          viewport.name + ' ' + pageName + ': Add to cart keeps a comfortable touch target');
        check(style.imageRatio < 0.08,
          viewport.name + ' ' + pageName + ': product imagery keeps a consistent square frame');
        check(!style.overflow,
          viewport.name + ' ' + pageName + ': visual card treatment introduces no horizontal overflow');
        check(errors.length === 0,
          viewport.name + ' ' + pageName + ': no JavaScript page errors');
        await page.close();
      }

      const productPage = await context.newPage();
      const productErrors = [];
      productPage.on('pageerror', error => productErrors.push(error.message));
      await productPage.goto(BASE_URL + 'product.html?id=sahara-vase', { waitUntil: 'domcontentloaded' });
      await productPage.waitForFunction(() =>
        window.NOVA?.catalog?.ready &&
        document.querySelector('#pdp-name')?.textContent.trim() === 'Sahara Ceramic Vase'
      , { timeout: 12000 });
      const productLabels = await productPage.evaluate(() => {
        const discount = document.querySelector('.pdp__discount-badge');
        const badgeStyle = discount ? getComputedStyle(discount) : null;
        const category = document.querySelector('#pdp-cat');
        const categoryStyle = category ? getComputedStyle(category) : null;
        return {
          discount: discount ? {
            text: discount.textContent.trim(),
            background: badgeStyle.backgroundColor,
            foreground: badgeStyle.color,
            display: badgeStyle.display,
            height: discount.getBoundingClientRect().height
          } : null,
          category: category ? {
            text: category.textContent.trim(),
            color: categoryStyle.color,
            weight: Number(categoryStyle.fontWeight),
            transform: categoryStyle.textTransform,
            letterSpacing: categoryStyle.letterSpacing
          } : null
        };
      });
      const discount = productLabels.discount;
      const category = productLabels.category;
      check(category && category.text === 'Decor' && category.color.includes('169, 79, 44') &&
        category.weight >= 600 && category.transform === 'uppercase',
        viewport.name + ' Product Details: category label matches the product-card terracotta hierarchy');
      check(discount && discount.text === 'Save 19%', viewport.name + ' Product Details: discount label displays the correct savings');
      check(discount.background.includes('169, 79, 44') && discount.foreground !== 'rgb(255, 255, 255)',
        viewport.name + ' Product Details: discount styling uses the NOVA terracotta palette');
      check(['inline-flex', 'flex'].includes(discount.display) && discount.height >= 24,
        viewport.name + ' Product Details: savings badge stays compact and aligned with pricing');
      check(await productPage.evaluate(() => document.documentElement.scrollWidth === innerWidth),
        viewport.name + ' Product Details: pricing refinement introduces no horizontal overflow');
      check(productErrors.length === 0, viewport.name + ' Product Details: no JavaScript page errors');
      await productPage.close();

      const cartPage = await context.newPage();
      const cartErrors = [];
      cartPage.on('pageerror', error => cartErrors.push(error.message));
      await cartPage.goto(BASE_URL + 'cart.html', { waitUntil: 'domcontentloaded' });
      await cartPage.waitForFunction(() => {
        const empty = document.querySelector('#cart-empty');
        return empty && !empty.hidden;
      }, { timeout: 10000 });
      const cartVisual = await cartPage.evaluate(() => {
        const head = document.querySelector('.page-head');
        const title = head?.querySelector('h1');
        const empty = document.querySelector('#cart-empty');
        const icon = empty?.querySelector(':scope > i');
        const cta = empty?.querySelector('a.btn');
        const emptyStyle = empty ? getComputedStyle(empty) : null;
        return {
          headerBorder: head && getComputedStyle(head).borderBottomStyle,
          titleFont: title && getComputedStyle(title).fontFamily,
          background: emptyStyle?.backgroundColor,
          border: emptyStyle?.borderTopStyle,
          radius: emptyStyle && parseFloat(emptyStyle.borderTopLeftRadius),
          shadow: emptyStyle?.boxShadow,
          iconSize: icon && icon.getBoundingClientRect().width,
          iconRadius: icon && getComputedStyle(icon).borderRadius,
          ctaHeight: cta && cta.getBoundingClientRect().height,
          overflow: document.documentElement.scrollWidth > innerWidth
        };
      });
      check(cartVisual.headerBorder === 'solid',
        viewport.name + ' Cart: page heading has a calm editorial divider');
      check(cartVisual.titleFont && /Newsreader/i.test(cartVisual.titleFont),
        viewport.name + ' Cart: page title retains the NOVA display font');
      check(cartVisual.background === 'rgb(255, 253, 249)' && cartVisual.border === 'solid' &&
        cartVisual.radius >= 16 && cartVisual.shadow !== 'none',
        viewport.name + ' Cart: empty state uses a soft surface card');
      check(cartVisual.iconSize >= 60 && cartVisual.iconRadius === '50%',
        viewport.name + ' Cart: empty-state icon sits in a soft circular accent surface');
      check(cartVisual.ctaHeight >= 44,
        viewport.name + ' Cart: Start shopping keeps a comfortable touch target');
      check(!cartVisual.overflow && cartErrors.length === 0,
        viewport.name + ' Cart: empty-state styling introduces no overflow or JavaScript errors');
      await cartPage.close();

      const wishlistPage = await context.newPage();
      const wishlistErrors = [];
      wishlistPage.on('pageerror', error => wishlistErrors.push(error.message));
      await wishlistPage.goto(BASE_URL + 'account/wishlist.html', { waitUntil: 'domcontentloaded' });
      await wishlistPage.waitForSelector('#wish-side-nav a', { timeout: 10000 });
      const navVisual = await wishlistPage.locator('#wish-side-nav').evaluate(nav => {
        const style = getComputedStyle(nav);
        const links = [...nav.querySelectorAll('a')];
        const bounds = nav.getBoundingClientRect();
        return {
          display: style.display,
          columns: style.display === 'grid' ? style.gridTemplateColumns.trim().split(/\s+/).length : 0,
          linkCount: links.length,
          minLinkHeight: Math.min(...links.map(link => link.getBoundingClientRect().height)),
          navWidth: bounds.width,
          scrollWidth: nav.scrollWidth,
          clientWidth: nav.clientWidth,
          allLinksInside: links.every(link => {
            const rect = link.getBoundingClientRect();
            return rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1;
          }),
          active: nav.querySelector('[aria-current="page"]')?.textContent.trim()
        };
      });
      if (viewport.mobile) {
        check(navVisual.display === 'grid' && navVisual.columns === 2,
          'mobile Wishlist: account navigation uses a two-column grid rather than a clipped horizontal strip');
        check(navVisual.linkCount >= 6 && navVisual.allLinksInside && navVisual.scrollWidth <= navVisual.clientWidth + 1,
          'mobile Wishlist: every account destination is visible without horizontal scrolling');
        check(navVisual.minLinkHeight >= 44,
          'mobile Wishlist: account navigation items retain comfortable touch targets');
      } else {
        check(navVisual.display === 'grid' && navVisual.columns === 1 && navVisual.linkCount >= 6,
          'desktop Wishlist: account navigation retains its vertical sidebar layout');
      }
      check(navVisual.active === 'Wishlist' && wishlistErrors.length === 0,
        viewport.name + ' Wishlist: active page state and JavaScript remain correct');

      await wishlistPage.evaluate(() => {
        document.dispatchEvent(new CustomEvent('auth:change', {
          detail: { authenticated: true, customer: { name: 'Demo Customer', email: 'demo@example.com' } }
        }));
      });
      const signOutVisual = await wishlistPage.locator('#wish-side-nav a.account-side-logout').evaluate(link => {
        const style = getComputedStyle(link);
        return {
          label: link.textContent.trim(),
          color: style.color,
          background: style.backgroundColor,
          borderTopStyle: style.borderTopStyle,
          borderTopColor: style.borderTopColor,
          marginTop: parseFloat(style.marginTop),
          paddingTop: parseFloat(style.paddingTop),
          height: link.getBoundingClientRect().height
        };
      });
      check(signOutVisual.label === 'Sign out' && signOutVisual.color === 'rgb(168, 50, 50)',
        viewport.name + ' Wishlist: authenticated sign-out link receives its dedicated red treatment');
      if (viewport.mobile) {
        check(signOutVisual.height >= 44 && signOutVisual.background === 'rgb(255, 250, 249)' &&
          signOutVisual.borderTopColor === 'rgb(248, 215, 218)',
          'mobile Wishlist: sign-out is distinct, softly tinted and keeps a 44px touch target');
      } else {
        check(signOutVisual.borderTopStyle === 'solid' && signOutVisual.marginTop >= 8 &&
          signOutVisual.paddingTop >= 12,
          'desktop Wishlist: sign-out is separated from primary account destinations');
      }
      await wishlistPage.evaluate(() => {
        const fixture = document.createElement('div');
        fixture.id = 'm3-address-style-fixture';
        fixture.className = 'account-main';
        fixture.innerHTML = '<div class="account-card addr-card addr-card--default"><div><strong class="addr-name">Sample Recipient</strong><span class="address-pill address-pill--label ms-2">Home</span><span class="address-pill address-pill--default">Default</span></div><p class="addr-lines">Cairo — Example Street</p><div class="addr-actions"><button class="btn btn-ghost btn-sm" type="button">Edit</button><button class="btn btn-ghost btn-sm" type="button">Make default</button><button class="btn btn-ghost btn-sm" type="button">Delete</button></div></div>';
        document.querySelector('main .container')?.append(fixture);
      });
      const addressVisual = await wishlistPage.locator('#m3-address-style-fixture .addr-card').evaluate(card => {
        const badge = card.querySelector('.address-pill--default');
        const label = card.querySelector('.address-pill--label');
        const buttons = [...card.querySelectorAll('.addr-actions .btn')];
        return {
          defaultBackground: getComputedStyle(badge).backgroundColor,
          defaultColor: getComputedStyle(badge).color,
          labelBackground: getComputedStyle(label).backgroundColor,
          minActionHeight: Math.min(...buttons.map(button => button.getBoundingClientRect().height)),
          pageOverflow: document.documentElement.scrollWidth > innerWidth
        };
      });
      check(addressVisual.defaultBackground.includes('169, 79, 44') &&
        addressVisual.defaultColor === 'rgb(138, 62, 32)',
        viewport.name + ' Addresses: default badge uses the warm terracotta palette');
      check(addressVisual.minActionHeight >= 44 && !addressVisual.pageOverflow,
        viewport.name + ' Addresses: Edit, Make default and Delete keep 44px targets without overflow');
      await wishlistPage.evaluate(() => {
        const fixture = document.createElement('div');
        fixture.id = 'm3-order-detail-style-fixture';
        fixture.className = 'account-main';
        fixture.innerHTML = '<div class="table-card table-card--order-detail"><table class="table"><thead><tr><th>Product</th><th>Unit price</th><th>Qty</th><th>Line total</th></tr></thead><tbody><tr><td>Sample Product</td><td>EGP 1,200</td><td>1</td><td>EGP 1,200</td></tr></tbody></table></div><section class="order-detail-mobile-list" aria-label="Ordered products"><article class="order-detail-mobile-card"><h2>Sample Product</h2><dl class="order-detail-mobile-meta"><div><dt>Quantity</dt><dd>1</dd></div><div><dt>Unit price</dt><dd>EGP 1,200</dd></div></dl><div class="order-detail-mobile-total"><span>Line total</span><strong>EGP 1,200</strong></div></article></section>';
        document.querySelector('main .container')?.append(fixture);
      });
      const orderVisual = await wishlistPage.locator('#m3-order-detail-style-fixture').evaluate(fixture => {
        const table = fixture.querySelector('.table-card--order-detail');
        const tableElement = table.querySelector('table');
        const mobileList = fixture.querySelector('.order-detail-mobile-list');
        const card = fixture.querySelector('.order-detail-mobile-card');
        return {
          tableDisplay: getComputedStyle(table).display,
          tableWidth: table.getBoundingClientRect().width,
          tableScrollWidth: tableElement.scrollWidth,
          tableClientWidth: tableElement.clientWidth,
          mobileListDisplay: getComputedStyle(mobileList).display,
          cardWidth: card.getBoundingClientRect().width,
          cardScrollWidth: card.scrollWidth,
          cardClientWidth: card.clientWidth,
          pageOverflow: document.documentElement.scrollWidth > innerWidth
        };
      });
      if (viewport.mobile) {
        check(orderVisual.tableDisplay === 'none' && orderVisual.mobileListDisplay === 'grid',
          'mobile Order Details: item table is replaced by the responsive product-card list');
      } else {
        check(orderVisual.tableDisplay !== 'none' && orderVisual.mobileListDisplay === 'none',
          'desktop Order Details: full semantic item table remains visible');
      }
      const activeItemLayoutFits = viewport.mobile
        ? orderVisual.cardWidth > 0 && orderVisual.cardScrollWidth <= orderVisual.cardClientWidth + 1
        : orderVisual.tableWidth > 0 && orderVisual.tableScrollWidth <= orderVisual.tableClientWidth + 1;
      check(activeItemLayoutFits && !orderVisual.pageOverflow,
        viewport.name + ' Order Details: active item presentation fits its available width without overflow');

      await wishlistPage.evaluate(() => {
        const fixture = document.createElement('div');
        fixture.id = 'm3-account-action-fixture';
        fixture.className = 'account-main';
        fixture.innerHTML = '<a class="btn btn-ghost btn-sm" href="#">View order details</a><button class="btn btn-nova" type="button">Save changes</button>';
        document.querySelector('main .container')?.append(fixture);
      });
      const accountActions = await wishlistPage.locator('#m3-account-action-fixture .btn').evaluateAll(buttons => ({
        minHeight: Math.min(...buttons.map(button => button.getBoundingClientRect().height)),
        pageOverflow: document.documentElement.scrollWidth > innerWidth
      }));
      check(accountActions.minHeight >= 44 && !accountActions.pageOverflow,
        viewport.name + ' Customer Account: compact and standard actions share 44px touch targets without overflow');

      const successPage = await context.newPage();
      const successErrors = [];
      successPage.on('pageerror', error => successErrors.push(error.message));
      await successPage.goto(BASE_URL + 'order-success.html', { waitUntil: 'domcontentloaded' });
      await successPage.waitForFunction(() => document.querySelector('#ok-title')?.textContent === 'No order specified', null, { timeout: 10000 });
      const successVisual = await successPage.evaluate(() => {
        const actions = [...document.querySelectorAll('.success-actions .btn')];
        const actionBounds = document.querySelector('.success-actions').getBoundingClientRect();
        const rects = actions.map(action => action.getBoundingClientRect());
        return {
          title: document.querySelector('#ok-title')?.textContent.trim(),
          message: document.querySelector('#ok-summary [role="status"]')?.textContent.trim() || '',
          referenceHidden: document.querySelector('#ok-ref-line').hidden,
          deliveryInfoHidden: document.querySelector('#ok-info-list').hidden,
          minActionHeight: Math.min(...rects.map(rect => rect.height)),
          actionsInside: rects.every(rect => rect.left >= actionBounds.left - 1 && rect.right <= actionBounds.right + 1),
          stacked: rects.every((rect, index) => index === 0 || rect.top > rects[index - 1].bottom),
          pageOverflow: document.documentElement.scrollWidth > innerWidth
        };
      });
      check(successVisual.title === 'No order specified' && successVisual.message.includes('no order reference'),
        viewport.name + ' Order confirmation: missing-reference state is clear and visible');
      check(successVisual.referenceHidden && successVisual.deliveryInfoHidden && successErrors.length === 0,
        viewport.name + ' Order confirmation: unverified order details remain hidden without JavaScript errors');
      check(successVisual.minActionHeight >= 44 && successVisual.actionsInside && !successVisual.pageOverflow,
        viewport.name + ' Order confirmation: navigation actions remain tappable and fit the page');
      if (viewport.mobile) {
        check(successVisual.stacked,
          'mobile Order confirmation: all three navigation actions stack as full-width rows');
      }
      await successPage.close();
      await wishlistPage.close();

      await context.close();
      console.log('--- ' + viewport.name + ' complete ---');
    }

    for (const width of [320, 768]) {
      const context = await browser.newContext({
        viewport: { width, height: 844 },
        isMobile: width < 576,
        hasTouch: width < 576
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(BASE_URL + 'account/wishlist.html', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#wish-side-nav a', { timeout: 10000 });
      await page.evaluate(() => {
        document.dispatchEvent(new CustomEvent('auth:change', {
          detail: { authenticated: true, customer: { name: 'Demo Customer', email: 'demo@example.com' } }
        }));
      });
      const nav = await page.locator('#wish-side-nav').evaluate(element => {
        const style = getComputedStyle(element);
        const bounds = element.getBoundingClientRect();
        const links = [...element.querySelectorAll('a')];
        return {
          display: style.display,
          columns: style.gridTemplateColumns.trim().split(' ').length,
          count: links.length,
          minHeight: Math.min(...links.map(link => link.getBoundingClientRect().height)),
          inside: links.every(link => {
            const rect = link.getBoundingClientRect();
            return rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1;
          }),
          navOverflow: element.scrollWidth > element.clientWidth + 1,
          pageOverflow: document.documentElement.scrollWidth > innerWidth
        };
      });
      check(nav.display === 'grid' && nav.columns === 2 && nav.count === 7,
        width + 'px account navigation: signed-in customer destinations and sign-out use the two-column grid');
      check(nav.minHeight >= 44 && nav.inside && !nav.navOverflow && !nav.pageOverflow,
        width + 'px account navigation: all seven links fit, remain tappable and cause no horizontal overflow');
      check(errors.length === 0, width + 'px account navigation: no JavaScript page errors');
      await context.close();
    }

    console.log('\nMILESTONE 3 VISUAL FOUNDATION TESTS PASSED: ' + checks + ' checks.\n');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error('\nMILESTONE 3 VISUAL FOUNDATION TESTS FAILED:', error);
  process.exit(1);
});
