/**
 * NOVA Home - privacy and terms page visual/accessibility regression.
 * Uses read-only legal routes and does not submit forms or mutate application data.
 */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const BASE_URL = (process.env.NOVA_BASE_URL || 'http://localhost/nova-home/nova-home/').replace(/\/?$/, '/');
const PAGES = [
  { path: 'privacy.html', title: 'Privacy Policy', minSections: 10 },
  { path: 'terms.html', title: 'Terms of Service', minSections: 10 }
];
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

      for (const route of PAGES) {
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));

        await page.goto(BASE_URL + route.path, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#main .legal-doc h2', { timeout: 10000 });

        const visual = await page.evaluate(() => {
          const main = document.querySelector('main#main');
          const heading = main?.querySelector('.page-head h1');
          const article = main?.querySelector('.legal-doc');
          const notice = article?.querySelector(':scope > .alert');
          const sectionHeading = article?.querySelector('h2');
          const breadcrumb = main?.querySelector('.breadcrumb [aria-current="page"]');
          const skipLink = document.querySelector('.skip-link');
          const articleRect = article?.getBoundingClientRect();
          const containerRect = article?.parentElement?.getBoundingClientRect();
          const articleStyle = article ? getComputedStyle(article) : null;
          const noticeStyle = notice ? getComputedStyle(notice) : null;
          const headingStyle = sectionHeading ? getComputedStyle(sectionHeading) : null;
          const paragraph = article?.querySelector('p:not(.legal-meta)');
          const paragraphStyle = paragraph ? getComputedStyle(paragraph) : null;
          const articleLinks = [...(article?.querySelectorAll('a') || [])];
          return {
            pageTitle: document.title,
            heading: heading?.textContent.trim(),
            headingFont: heading && getComputedStyle(heading).fontFamily,
            articleWidth: articleRect?.width ?? 0,
            containerWidth: containerRect?.width ?? 0,
            articleCentered: !!articleRect && !!containerRect &&
              Math.abs((articleRect.left - containerRect.left) -
                Math.max(0, (containerRect.width - articleRect.width) / 2)) < 3,
            maxWidth: articleStyle?.maxWidth,
            noticeBackground: noticeStyle?.backgroundColor,
            noticeBorder: noticeStyle?.borderTopStyle,
            noticeRadius: noticeStyle ? parseFloat(noticeStyle.borderTopLeftRadius) : 0,
            noticeText: noticeStyle?.color,
            sectionHeadingFont: headingStyle?.fontFamily,
            sectionMarkerWidth: headingStyle ? parseFloat(headingStyle.borderLeftWidth) : 0,
            sectionMarkerColor: headingStyle?.borderLeftColor,
            paragraphLineHeight: paragraphStyle ? parseFloat(paragraphStyle.lineHeight) / parseFloat(paragraphStyle.fontSize) : 0,
            sectionCount: article?.querySelectorAll('h2').length ?? 0,
            breadcrumb: breadcrumb?.textContent.trim(),
            breadcrumbCurrent: breadcrumb?.getAttribute('aria-current'),
            skipHref: skipLink?.getAttribute('href'),
            skipTargetExists: !!document.querySelector(skipLink?.getAttribute('href') || '___missing___'),
            unnamedLinks: articleLinks.filter(link =>
              !(link.innerText || '').trim() && !link.getAttribute('aria-label') && !link.getAttribute('title')
            ).length,
            horizontalOverflow: document.documentElement.scrollWidth > innerWidth
          };
        });

        check(visual.pageTitle === route.title + ' | NOVA Home' && visual.heading === route.title,
          viewport.name + ' ' + route.title + ': document title and visible H1 match the route');
        check(/Newsreader/i.test(visual.headingFont || '') && /Newsreader/i.test(visual.sectionHeadingFont || ''),
          viewport.name + ' ' + route.title + ': page and section headings use the NOVA display typeface');
        check(visual.articleWidth > 0 && visual.articleWidth <= 736.5 && visual.articleCentered,
          viewport.name + ' ' + route.title + ': reading column stays comfortably narrow and centered');
        check(visual.noticeBorder === 'solid' && visual.noticeRadius >= 8 &&
          (visual.noticeBackground || '').includes('169, 79, 44') &&
          visual.noticeText === 'rgb(36, 32, 28)',
          viewport.name + ' ' + route.title + ': demo notice uses the warm brand surface with readable ink text');
        check(visual.sectionMarkerWidth >= 3 &&
          (visual.sectionMarkerColor || '').includes('169, 79, 44'),
          viewport.name + ' ' + route.title + ': section headings use the terracotta editorial marker');
        check(visual.paragraphLineHeight >= 1.65 && visual.sectionCount >= route.minSections,
          viewport.name + ' ' + route.title + ': policy content keeps readable leading and complete sections');
        check(visual.breadcrumb === route.title && visual.breadcrumbCurrent === 'page',
          viewport.name + ' ' + route.title + ': breadcrumb identifies the current page semantically');
        check(visual.skipHref === '#main' && visual.skipTargetExists && visual.unnamedLinks === 0,
          viewport.name + ' ' + route.title + ': skip navigation target and legal links have accessible names');
        check(!visual.horizontalOverflow && errors.length === 0,
          viewport.name + ' ' + route.title + ': responsive layout has no horizontal overflow or JavaScript errors');

        await page.close();
      }
      await context.close();
    }

    console.log('\n✅ Legal page regression passed: ' + checks + ' checks across ' +
      PAGES.length + ' policy routes and ' + VIEWPORTS.length + ' viewports.');
  } catch (error) {
    console.error('\n❌ Legal page regression failed after ' + checks + ' checks.');
    throw error;
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
