/**
 * NOVA Home — Checkout presentation and client-validation regression checks.
 * Customer/API responses are mocked. Order POSTs are blocked; this suite never creates an order.
 */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const BASE_URL = (process.env.NOVA_BASE_URL || 'http://localhost/nova-home/nova-home/').replace(/\/?$/, '/');
const CHECKOUT_URL = BASE_URL + 'checkout.html';

(async () => {
  const browser = await chromium.launch({ headless: true });
  let checks = 0;

  function check(condition, message) {
    checks++;
    assert.ok(condition, message);
    console.log('  [PASS] ' + message);
  }

  async function prepareContext(viewport, authenticated = true) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: viewport.width < 768,
      hasTouch: viewport.width <= 1024
    });
    await context.addInitScript(() => {
      localStorage.setItem('nova_cart', JSON.stringify([
        { id: 'sahara-vase', qty: 2 },
        { id: 'luna-floor-lamp', qty: 1 }
      ]));
    });
    await context.route('**/api/customer-auth.php', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { authenticated, customer: authenticated ? { id: 999, name: 'Demo Customer' } : null } })
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

    let orderPostCount = 0;
    await context.route('**/api/orders.php', async route => {
      if (route.request().method() === 'POST') orderPostCount++;
      await route.abort();
    });
    return { context, getOrderPostCount: () => orderPostCount };
  }

  async function openCheckout(context) {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && !/favicon/i.test(message.text())) errors.push(message.text());
    });
    await page.goto(CHECKOUT_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() =>
      document.querySelectorAll('#co-lines .summary-line').length === 2 &&
      document.querySelector('#c-address')?.value === '12 Example Street'
    );
    return { page, errors };
  }

  try {
    const viewports = [
      { name: 'small phone', width: 320, height: 780 },
      { name: 'phone', width: 390, height: 844 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 850 }
    ];

    for (const viewport of viewports) {
      const { context, getOrderPostCount } = await prepareContext(viewport);
      const { page, errors } = await openCheckout(context);
      const state = await page.evaluate(() => {
        const form = document.querySelector('#checkout-form');
        const summary = document.querySelector('.summary');
        const rect = element => {
          const box = element?.getBoundingClientRect();
          return box ? { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) } : null;
        };
        return {
          headings: [...form.querySelectorAll('h2')].map(heading => heading.textContent.trim()),
          lineCount: document.querySelectorAll('#co-lines .summary-line').length,
          lines: document.querySelector('#co-lines')?.innerText.trim(),
          subtotal: document.querySelector('#sum-sub')?.textContent.trim(),
          delivery: document.querySelector('#sum-del')?.textContent.trim(),
          total: document.querySelector('#sum-total')?.textContent.trim(),
          paymentRow: [...summary.querySelectorAll('.summary__row')].find(row => row.textContent.includes('Payment'))?.innerText.trim(),
          paymentCard: document.querySelector('.pay-option')?.innerText.trim(),
          sectionHeadingStyle: (() => {
            const heading = form.querySelector(':scope > h2');
            const marker = heading ? getComputedStyle(heading, '::before') : null;
            return heading && marker ? {
              fontFamily: getComputedStyle(heading).fontFamily,
              borderBottomStyle: getComputedStyle(heading).borderBottomStyle,
              markerWidth: parseFloat(marker.width),
              markerColor: marker.backgroundColor
            } : null;
          })(),
          paymentIconStyle: (() => {
            const icon = document.querySelector('.pay-option > i');
            if (!icon) return null;
            const rect = icon.getBoundingClientRect();
            const style = getComputedStyle(icon);
            return { width: rect.width, height: rect.height, background: style.backgroundColor, radius: style.borderRadius };
          })(),
          paymentBorderStyle: (() => {
            const card = document.querySelector('.pay-option');
            return card ? {
              borderStyle: getComputedStyle(card).borderTopStyle,
              radius: parseFloat(getComputedStyle(card).borderTopLeftRadius),
              backgroundImage: getComputedStyle(card).backgroundImage
            } : null;
          })(),
          phoneHelp: document.querySelector('#c-phone-help')?.textContent.trim(),
          addressHelp: document.querySelector('#c-address-help')?.textContent.trim(),
          apartmentHelp: document.querySelector('#c-apt-help')?.textContent.trim(),
          phoneDescribedBy: document.querySelector('#c-phone')?.getAttribute('aria-describedby'),
          addressDescribedBy: document.querySelector('#c-address')?.getAttribute('aria-describedby'),
          cityDescribedBy: document.querySelector('#c-city')?.getAttribute('aria-describedby'),
          defaultCity: document.querySelector('#c-city')?.value,
          defaultPhone: document.querySelector('#c-phone')?.value,
          defaultName: document.querySelector('#c-name')?.value,
          defaultAddress: document.querySelector('#c-address')?.value,
          defaultApartment: document.querySelector('#c-apt')?.value,
          placeText: document.querySelector('#place-order')?.textContent.trim(),
          placeHeight: rect(document.querySelector('#place-order'))?.height,
          summaryRect: rect(summary),
          formRect: rect(form),
          overflow: document.documentElement.scrollWidth > innerWidth
        };
      });

      check(state.headings.includes('Your details') && state.headings.includes('Delivery address') && state.headings.includes('Payment'),
        viewport.name + ': contact details, delivery address and payment are grouped under clear headings');
      check(state.sectionHeadingStyle && /Newsreader/i.test(state.sectionHeadingStyle.fontFamily) &&
        state.sectionHeadingStyle.borderBottomStyle === 'solid' && state.sectionHeadingStyle.markerWidth >= 3 &&
        state.sectionHeadingStyle.markerColor === 'rgb(169, 79, 44)',
        viewport.name + ': checkout sections use the editorial display hierarchy and terracotta marker');
      check(state.paymentIconStyle && state.paymentIconStyle.width >= 44 && state.paymentIconStyle.height >= 44 &&
        state.paymentIconStyle.radius === '50%' && state.paymentIconStyle.background !== 'rgba(0, 0, 0, 0)',
        viewport.name + ': Cash on Delivery has a distinct circular 44px icon surface');
      check(state.paymentBorderStyle && state.paymentBorderStyle.borderStyle === 'solid' &&
        state.paymentBorderStyle.radius >= 10 && state.paymentBorderStyle.backgroundImage !== 'none',
        viewport.name + ': payment option sits in a softly tinted, rounded NOVA surface');
      check(state.lineCount === 2 && state.lines.includes('Sahara Ceramic Vase x 2') && state.lines.includes('Luna Arc Floor Lamp x 1'),
        viewport.name + ': order summary lists the correct products and quantities');
      check(state.subtotal === 'EGP 4,230' && state.delivery === 'Free' && state.total === 'EGP 4,230',
        viewport.name + ': subtotal, delivery and total remain consistent');
      check(state.paymentRow === 'Payment\nCash on delivery' && state.paymentCard.includes('Cash on delivery'),
        viewport.name + ': Cash on Delivery is explicit in both summary and payment section');
      check(state.phoneHelp.includes('8–15 digits') && state.phoneHelp.includes('+') &&
        state.phoneDescribedBy.includes('c-phone-help') && state.phoneDescribedBy.includes('c-phone-error'),
        viewport.name + ': phone format guidance and validation error are associated with the input');
      check(state.addressHelp.includes('street and area') && state.addressDescribedBy.includes('c-address-error'),
        viewport.name + ': street-address guidance and error are associated with the input');
      check(state.apartmentHelp.includes('building') && state.cityDescribedBy.includes('co-dest'),
        viewport.name + ': apartment guidance and live delivery-destination context are available');
      check(state.defaultName === 'Demo Customer' && state.defaultPhone === '01012345678' &&
        state.defaultCity === 'cairo' && state.defaultAddress === '12 Example Street' &&
        state.defaultApartment === 'Building 3, Apt 4',
        viewport.name + ': mocked account profile and default address prefill correctly');
      check(state.placeText === 'Place order' && state.placeHeight >= 48,
        viewport.name + ': Place order remains a clear, comfortable full-width action');
      check(!state.overflow, viewport.name + ': checkout has no horizontal overflow');
      if (viewport.width < 992) {
        check(state.summaryRect.y < state.formRect.y,
          viewport.name + ': order summary appears before the form on narrow layouts');
      } else {
        check(state.summaryRect.x > state.formRect.x,
          viewport.name + ': order summary sits alongside the form on desktop');
      }
      check(errors.length === 0, viewport.name + ': no JavaScript page errors');
      check(getOrderPostCount() === 0, viewport.name + ': no order POST is made during page rendering');
      await context.close();
      console.log('--- ' + viewport.name + ' complete ---');
    }
    // Validation probes always retain an invalid field; the order POST is intercepted as a second safety guard.
    {
      const viewport = { width: 390, height: 844 };
      const { context, getOrderPostCount } = await prepareContext(viewport);
      const { page, errors } = await openCheckout(context);
      const phone = page.locator('#c-phone');

      await phone.fill('1234');
      await page.locator('#checkout-form').evaluate(form => form.requestSubmit());
      await page.waitForFunction(() => document.querySelector('#c-phone')?.getAttribute('aria-invalid') === 'true');
      const phoneInvalid = await page.evaluate(() => ({
        focused: document.activeElement?.id,
        invalid: document.querySelector('#c-phone')?.getAttribute('aria-invalid'),
        describedBy: document.querySelector('#c-phone')?.getAttribute('aria-describedby'),
        feedbackVisible: getComputedStyle(document.querySelector('#c-phone-error')).display !== 'none',
        errorVisible: document.querySelector('#co-error') && !document.querySelector('#co-error').hidden
      }));
      check(phoneInvalid.focused === 'c-phone' && phoneInvalid.invalid === 'true',
        'invalid phone focuses the field and exposes aria-invalid');
      check(phoneInvalid.feedbackVisible && phoneInvalid.describedBy.includes('c-phone-error'),
        'invalid phone shows its associated explanatory message');
      check(!phoneInvalid.errorVisible && getOrderPostCount() === 0,
        'client validation stops the flow before any order POST');

      const phoneCases = [
        ['01012345678', true, 'standard Egyptian mobile format'],
        ['010 1234 5678', true, 'formatted mobile number with spaces'],
        ['+20 1012345678', true, 'international +20 format'],
        ['12345678', true, 'eight-digit lower boundary accepted by the server validator'],
        ['123456789012345', true, 'fifteen-digit upper boundary accepted by the server validator'],
        ['1234567', false, 'seven-digit phone number rejected'],
        ['1234567890123456', false, 'sixteen-digit phone number rejected']
      ];
      for (const [value, valid, label] of phoneCases) {
        await phone.fill(value);
        const actual = await phone.evaluate(element => element.checkValidity());
        check(actual === valid, 'phone validator ' + (valid ? 'accepts ' : 'rejects ') + label);
      }
      await phone.fill('01012345678');
      check(await phone.evaluate(element => element.checkValidity()) &&
        await phone.getAttribute('aria-invalid') === null,
        'correcting the phone clears its invalid state');

      const email = page.locator('#c-email');
      await email.fill('not-an-email');
      await page.locator('#checkout-form').evaluate(form => form.requestSubmit());
      await page.waitForFunction(() => document.querySelector('#c-email')?.getAttribute('aria-invalid') === 'true');
      check(await email.getAttribute('aria-invalid') === 'true' &&
        await email.getAttribute('aria-describedby') === 'c-email-error',
        'invalid optional email is associated with its validation message');
      check(getOrderPostCount() === 0, 'invalid email also prevents any order POST');
      await email.fill('');
      check(await email.evaluate(element => element.checkValidity()) &&
        await email.getAttribute('aria-invalid') === null,
        'blank optional email is accepted and clears its invalid state');

      const address = page.locator('#c-address');
      await address.fill('');
      await page.locator('#checkout-form').evaluate(form => form.requestSubmit());
      await page.waitForFunction(() => document.querySelector('#c-address')?.getAttribute('aria-invalid') === 'true');
      check(await address.getAttribute('aria-invalid') === 'true' &&
        (await page.locator('#c-address').getAttribute('aria-describedby')).includes('c-address-error'),
        'missing street address focuses the first invalid field with its linked message');
      check(getOrderPostCount() === 0, 'missing required address prevents any order POST');
      check(errors.length === 0, 'client-side checkout validation produces no JavaScript page errors');
      await context.close();
    }

    // Signed-out checkout redirects to the whitelisted login return path without clearing the local cart.
    {
      const viewport = { width: 390, height: 844 };
      const { context, getOrderPostCount } = await prepareContext(viewport, false);
      const page = await context.newPage();
      await page.goto(CHECKOUT_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForURL(url =>
        url.pathname.endsWith('/account/login.php') && url.searchParams.get('return') === 'checkout'
      );
      const preserved = await page.evaluate(() => {
        const cart = JSON.parse(localStorage.getItem('nova_cart') || '[]');
        return cart.length === 2 && cart.some(item => item.id === 'sahara-vase' && item.qty === 2);
      });
      check(preserved, 'signed-out redirect preserves the browser-local cart');
      check(getOrderPostCount() === 0, 'signed-out checkout never posts an order');
      await context.close();
    }

    console.log('\nCHECKOUT UI TESTS PASSED: ' + checks + ' checks across four viewports, validation and signed-out redirect.\n');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error('\nCHECKOUT UI TEST FAILED:', error);
  process.exit(1);
});
