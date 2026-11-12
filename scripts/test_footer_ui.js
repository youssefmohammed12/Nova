/**
 * NOVA Home - shared customer-facing footer responsive/accessibility regression.
 * Opens the public homepage only; no forms, account actions or order endpoints are used.
 */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const BASE_URL = (process.env.NOVA_BASE_URL || 'http://localhost/nova-home/nova-home/').replace(/\/?$/, '/');
const VIEWPORTS = [
  { name: 'small phone', width: 320, height: 780, mobile: true },
  { name: 'phone', width: 390, height: 844, mobile: true },
  { name: 'tablet', width: 768, height: 1024, mobile: false },
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
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: viewport.mobile,
        hasTouch: viewport.mobile
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));

      await page.goto(BASE_URL + 'index.html', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#site-footer .site-footer .footer-bottom', { timeout: 10000 });
      await page.waitForFunction(() => window.NOVA?.catalog?.ready, { timeout: 12000 });

      const footer = await page.evaluate(() => {
        const root = document.querySelector('#site-footer .site-footer');
        const rootRect = root?.getBoundingClientRect();
        const links = [...(root?.querySelectorAll('li > a') || [])];
        const allLinks = [...(root?.querySelectorAll('a') || [])];
        const contacts = [...(root?.querySelectorAll('.footer-contact-item a') || [])];
        const social = [...(root?.querySelectorAll('.footer-social__soon') || [])];
        const badges = root?.querySelector('.footer-badges');
        const bottom = root?.querySelector('.footer-bottom__inner');
        return {
          headingCount: root?.querySelectorAll(':scope .row > [class*="col-"] h2').length || 0,
          linkCount: links.length,
          minimumLinkHeight: links.length ? Math.min(...links.map(a => a.getBoundingClientRect().height)) : 0,
          allLinksNamed: allLinks.every(a =>
            (a.textContent || '').trim() || a.getAttribute('aria-label') || a.getAttribute('title')
          ),
          linksInsideFooter: !!rootRect && allLinks.every(a => {
            const rect = a.getBoundingClientRect();
            return rect.left >= rootRect.left - 1 && rect.right <= rootRect.right + 1;
          }),
          contactCount: contacts.length,
          contactTargetsLargeEnough: contacts.length >= 2 &&
            contacts.every(a => a.getBoundingClientRect().height >= 40),
          socialPlaceholdersAreNonInteractive: social.length === 4 &&
            social.every(el => el.tagName === 'SPAN' && !el.hasAttribute('tabindex') &&
              !el.hasAttribute('role')),
          socialNotice: root?.querySelector('.footer-note')?.textContent.includes('social profiles are not live') || false,
          badgeWrap: badges ? getComputedStyle(badges).flexWrap : '',
          bottomWrap: bottom ? getComputedStyle(bottom).flexWrap : '',
          horizontalOverflow: document.documentElement.scrollWidth > innerWidth
        };
      });

      check(footer.headingCount === 3,
        viewport.name + ': footer keeps its three named navigation/contact groups');
      check(footer.linkCount >= 10 && footer.allLinksNamed,
        viewport.name + ': footer destinations retain visible or programmatic accessible names');
      check(footer.minimumLinkHeight >= 40,
        viewport.name + ': footer navigation links meet the 40px touch-target baseline');
      check(footer.contactTargetsLargeEnough && footer.contactCount >= 2,
        viewport.name + ': phone and email links remain comfortable touch targets');
      check(footer.linksInsideFooter && !footer.horizontalOverflow,
        viewport.name + ': footer links and columns remain within the viewport');
      check(footer.socialPlaceholdersAreNonInteractive && footer.socialNotice,
        viewport.name + ': clearly labelled demo social placeholders stay non-interactive');
      check(footer.badgeWrap === 'wrap' && footer.bottomWrap === 'wrap',
        viewport.name + ': footer assurances and bottom row can wrap on narrow screens');
      check(errors.length === 0,
        viewport.name + ': homepage and shared footer have no JavaScript page errors');

      await context.close();
    }

    console.log('\n✅ Footer regression passed: ' + checks + ' checks across 4 viewports.');
  } catch (error) {
    console.error('\n❌ Footer regression failed after ' + checks + ' checks.');
    throw error;
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
