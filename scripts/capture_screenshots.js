#!/usr/bin/env node
/**
 * NOVA Home — README screenshot capture (development tool).
 *
 * Captures the documentation gallery in docs/screenshots/ directly from the
 * running local application. Requires the app served locally and the demo
 * customer seeded (`php scripts/seed_demo_customer.php`).
 *
 * Usage:
 *   node scripts/capture_screenshots.js
 *   NOVA_BASE_URL=http://localhost/my-copy/ node scripts/capture_screenshots.js
 *
 * Privacy rules encoded here:
 *   - Customer pages are captured while signed in as the dedicated DEMO
 *     customer (synthetic fixture data only).
 *   - Admin order list is filtered server-side (?q=) to the demo customer.
 *   - Admin dashboard "Recent Orders" names are blurred in-page before
 *     capture unless they belong to the demo customer.
 *   - No orders are created and no records are modified.
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const BASE = process.env.NOVA_BASE_URL || 'http://localhost/nova-home/nova-home/';
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

const DEMO_NAME = 'Sarah El-Masry';
const DEMO_ORDER_REF = 'NH-20260915-87A4E0'; // demo order: delivered, synthetic data

const errors = [];
const captured = [];

function log(msg) {
  process.stdout.write(`[shots] ${msg}\n`);
}

function attachErrorWatch(page, label) {
  page.on('pageerror', (e) => errors.push(`${label}: pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`${label}: console.error: ${m.text()}`);
  });
}

/** Wait for load + fonts + images, then freeze reveal animations for capture. */
async function settle(page) {
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) {} }
    const imgs = Array.from(document.images);
    await Promise.all(imgs.map((img) => img.complete
      ? Promise.resolve()
      : new Promise((res) => { img.addEventListener('load', res, { once: true }); img.addEventListener('error', res, { once: true }); setTimeout(res, 4000); })));
  }).catch(() => {});
  await page.addStyleTag({
    content: '[data-reveal]{opacity:1!important;transform:none!important;transition:none!important}',
  }).catch(() => {});
  await page.waitForTimeout(400);
}

async function shot(page, name, opts = {}) {
  await settle(page);
  if (opts.mask) await opts.mask(page);
  // Report broken images (visible <img> with no decoded pixels).
  const broken = await page.evaluate(() => Array.from(document.images)
    .filter((i) => i.offsetParent !== null && i.complete && i.naturalWidth === 0 && !String(i.src).startsWith('data:'))
    .map((i) => i.src)).catch(() => []);
  if (broken.length) log(`WARNING ${name}: broken images: ${broken.slice(0, 3).join(', ')}`);
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, caret: 'hide', animations: 'disabled', ...(opts.screenshot || {}) });
  const size = fs.statSync(file).size;
  captured.push({ name, size });
  log(`${name} (${(size / 1024).toFixed(0)} KB)`);
}

async function maskRecentOrderNames(page) {
  await page.evaluate((demoName) => {
    document.querySelectorAll('.admin-table tbody tr').forEach((tr) => {
      const cell = tr.querySelector('td:nth-child(2) .fw-medium');
      if (cell && cell.textContent.trim() !== demoName) {
        cell.style.filter = 'blur(7px)';
        cell.style.userSelect = 'none';
      }
    });
  }, DEMO_NAME);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  try {
    // ── 1. Public storefront (desktop) ───────────────────────────────────
    const desktop = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: 1 });
    const page = await desktop.newPage();
    attachErrorWatch(page, 'storefront');

    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.product-card', { timeout: 15000 });
    await shot(page, 'homepage-desktop.png');

    await page.goto(BASE + 'shop.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#shop-grid .product-card', { timeout: 15000 });
    await shot(page, 'shop-desktop.png');

    // Meaningful active filter: category pill "Lighting" (+ its active-filter chip)
    const pill = page.locator('#cat-pills button', { hasText: 'Lighting' }).first();
    await pill.waitFor({ timeout: 8000 });
    await pill.click();
    await page.waitForSelector('#active-filters:not([hidden])', { timeout: 8000 });
    await page.waitForTimeout(500);
    await shot(page, 'shop-filtered.png');

    await page.goto(BASE + 'product.html?id=sahara-vase', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#gallery-main', { timeout: 15000 });
    await shot(page, 'product-detail.png');

    await page.goto(BASE + 'shop.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#shop-grid .product-card .quick-btn', { timeout: 15000 });
    await page.locator('#shop-grid .product-card .quick-btn').first().click();
    await page.waitForSelector('#quickModal.show', { timeout: 8000 });
    await page.waitForTimeout(900); // modal fade + image
    await shot(page, 'quick-view.png');
    await page.keyboard.press('Escape').catch(() => {});

    // Cart — synthetic local fixture, two modest items (progress bar visible)
    const cartPage = await desktop.newPage();
    attachErrorWatch(cartPage, 'cart');
    await cartPage.addInitScript(() => {
      try { localStorage.setItem('nova_cart', JSON.stringify([{ id: 'sahara-vase', qty: 1 }, { id: 'terra-mug-set', qty: 1 }])); } catch (e) {}
    });
    await cartPage.goto(BASE + 'cart.html', { waitUntil: 'domcontentloaded' });
    await cartPage.waitForSelector('#cart-filled:not([hidden])', { timeout: 15000 });
    await cartPage.waitForTimeout(600);
    await shot(cartPage, 'cart.png');
    await cartPage.close();

    // Checkout — form filled with the synthetic demo identity; NOT submitted.
    const coPage = await desktop.newPage();
    attachErrorWatch(coPage, 'checkout');
    await coPage.addInitScript(() => {
      try { localStorage.setItem('nova_cart', JSON.stringify([{ id: 'sahara-vase', qty: 1 }, { id: 'terra-mug-set', qty: 1 }])); } catch (e) {}
    });
    await coPage.goto(BASE + 'checkout.html', { waitUntil: 'domcontentloaded' });
    await coPage.waitForSelector('#c-name', { timeout: 15000 });
    await coPage.fill('#c-name', DEMO_NAME);
    await coPage.fill('#c-phone', '+20 112 345 6789');
    await coPage.fill('#c-email', 'demo.customer@novahome.eg');
    await coPage.fill('#c-address', '14 Hassan Sabry Street, Zamalek');
    await coPage.fill('#c-apt', 'Apt 7B, 3rd Floor');
    await coPage.$eval('#c-city', (el) => {
      const opt = Array.from(el.options).find((o) => (o.value || '').toLowerCase() === 'cairo') || el.options[1];
      el.value = opt.value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await shot(coPage, 'checkout.png');
    await coPage.close();

    // ── 2. Storefront (mobile representative) ────────────────────────────
    const mobile = await browser.newContext({ viewport: MOBILE, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const mpage = await mobile.newPage();
    attachErrorWatch(mpage, 'mobile');
    await mpage.goto(BASE, { waitUntil: 'domcontentloaded' });
    await mpage.waitForSelector('.product-card', { timeout: 15000 });
    await shot(mpage, 'homepage-mobile.png');
    await mpage.goto(BASE + 'shop.html', { waitUntil: 'domcontentloaded' });
    await mpage.waitForSelector('#shop-grid .product-card', { timeout: 15000 });
    await shot(mpage, 'shop-mobile.png');
    await mobile.close();

    // ── 3. Customer account (signed in as the dedicated demo customer) ───
    const cust = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: 1 });
    const cpage = await cust.newPage();
    attachErrorWatch(cpage, 'customer');

    await cpage.goto(BASE + 'account/login.php', { waitUntil: 'domcontentloaded' });
    await cpage.waitForSelector('#demo-cust-btn', { timeout: 15000 });
    await shot(cpage, 'customer-login.png');

    await cpage.click('#demo-cust-btn');
    await cpage.waitForURL('**/account/index.php', { timeout: 15000 });
    await cpage.waitForSelector('.account-metrics', { timeout: 15000 });
    await shot(cpage, 'customer-dashboard.png');

    await cpage.goto(BASE + 'account/orders.php', { waitUntil: 'domcontentloaded' });
    await cpage.waitForSelector('table tbody tr, .order-mobile-card', { timeout: 15000 });
    await shot(cpage, 'customer-orders.png');

    await cpage.goto(BASE + 'account/wishlist.html', { waitUntil: 'domcontentloaded' });
    await cpage.waitForSelector('#account-wish-grid .product-card', { timeout: 15000 });
    await shot(cpage, 'customer-wishlist.png');

    await cpage.goto(BASE + 'account/addresses.php', { waitUntil: 'domcontentloaded' });
    await cpage.waitForSelector('[data-addr-edit], #addr-empty', { timeout: 15000 });
    await shot(cpage, 'customer-addresses.png');

    await cpage.goto(BASE + 'account/profile.php', { waitUntil: 'domcontentloaded' });
    await cpage.waitForSelector('#p-email', { timeout: 15000 });
    await shot(cpage, 'customer-profile.png');
    await cust.close();

    // ── 4. Admin portal (signed in via the development demo shortcut) ────
    const adm = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: 1 });
    const apage = await adm.newPage();
    attachErrorWatch(apage, 'admin');

    await apage.goto(BASE + 'admin/login.php', { waitUntil: 'domcontentloaded' });
    await apage.waitForSelector('#demo-admin-btn', { timeout: 15000 });
    await shot(apage, 'admin-login.png');

    await apage.click('#demo-admin-btn');
    await apage.waitForURL('**/admin/index.php', { timeout: 15000 });
    await apage.waitForSelector('.admin-metrics', { timeout: 15000 });
    await shot(apage, 'admin-dashboard.png', { mask: maskRecentOrderNames });

    await apage.goto(BASE + 'admin/products.php', { waitUntil: 'domcontentloaded' });
    await apage.waitForSelector('table tbody tr', { timeout: 15000 });
    await shot(apage, 'admin-products.png');

    await apage.goto(BASE + 'admin/product-form.php?id=sahara-vase', { waitUntil: 'domcontentloaded' });
    await apage.waitForSelector('input[name="name"]', { timeout: 15000 });
    await shot(apage, 'admin-product-form.png');

    await apage.goto(BASE + 'admin/categories.php', { waitUntil: 'domcontentloaded' });
    await apage.waitForSelector('table tbody tr', { timeout: 15000 });
    await shot(apage, 'admin-categories.png');

    // Order list filtered server-side to the demo customer's synthetic orders.
    await apage.goto(BASE + 'admin/orders.php?q=' + encodeURIComponent(DEMO_NAME), { waitUntil: 'domcontentloaded' });
    await apage.waitForSelector('table tbody tr', { timeout: 15000 });
    await shot(apage, 'admin-orders.png');

    await apage.goto(BASE + 'admin/order.php?ref=' + DEMO_ORDER_REF, { waitUntil: 'domcontentloaded' });
    await apage.waitForSelector('.admin-card', { timeout: 15000 });
    await shot(apage, 'admin-order-detail.png');

    await apage.goto(BASE + 'admin/settings.php', { waitUntil: 'domcontentloaded' });
    await apage.waitForSelector('#s-name', { timeout: 15000 });
    await shot(apage, 'admin-settings.png');
    await adm.close();

    await desktop.close();
  } finally {
    await browser.close();
  }

  log(`captured ${captured.length} screenshots -> ${OUT}`);
  if (errors.length) {
    log(`PAGE ERRORS (${errors.length}):`);
    errors.slice(0, 20).forEach((e) => log('  ' + e));
    process.exitCode = 1;
  } else {
    log('no console/page errors detected');
  }
}

main().catch((e) => {
  log('FAILED: ' + (e && e.stack ? e.stack : e));
  process.exitCode = 1;
});
