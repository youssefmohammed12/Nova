#!/usr/bin/env node
/**
 * NOVA Home — compact README screenshot capture.
 *
 * Captures eight representative pages from the local application:
 * homepage desktop/mobile, shop, product detail, cart, checkout,
 * customer dashboard, and admin dashboard.
 *
 * Requires the local app to be running and its synthetic demo customer/admin
 * shortcuts to be available. No forms are submitted and no database records
 * are created or modified. Cart/checkout fixtures exist only in localStorage.
 *
 * Usage:
 *   node scripts/capture_screenshots.js
 *   NOVA_BASE_URL=http://localhost/my-copy/ node scripts/capture_screenshots.js
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const BASE = (process.env.NOVA_BASE_URL || 'http://localhost/nova-home/nova-home/').replace(/\/?$/, '/');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'screenshots');
const TEMP = path.join(OUT, '.refresh');
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

const DEMO_NAME = 'Sarah El-Masry';

const KEEP = [
  'homepage-desktop.png',
  'homepage-mobile.png',
  'shop-desktop.png',
  'product-detail.png',
  'cart.png',
  'checkout.png',
  'customer-dashboard.png',
  'admin-dashboard.png',
];

const REMOVE_AFTER_SUCCESS = [
  'admin-categories.png',
  'admin-login.png',
  'admin-order-detail.png',
  'admin-orders.png',
  'admin-product-form.png',
  'admin-products.png',
  'admin-settings.png',
  'customer-addresses.png',
  'customer-login.png',
  'customer-orders.png',
  'customer-profile.png',
  'customer-wishlist.png',
  'quick-view.png',
  'shop-filtered.png',
  'shop-mobile.png',
];

const errors = [];
const warnings = [];
const captured = [];

function log(message) {
  process.stdout.write('[shots] ' + message + '\n');
}

function watchPage(page, label) {
  page.on('pageerror', (error) => errors.push(label + ': ' + error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') warnings.push(label + ': ' + message.text());
  });
}

async function settle(page) {
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch (_) {}
    }
    await Promise.all(Array.from(document.images).map((image) => {
      if (image.complete) return Promise.resolve();
      return new Promise((resolve) => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
        setTimeout(resolve, 4000);
      });
    }));
  }).catch(() => {});
  await page.addStyleTag({
    content: '[data-reveal]{opacity:1!important;transform:none!important;transition:none!important}',
  }).catch(() => {});
  await page.waitForTimeout(350);
}

async function capture(page, name) {
  await settle(page);

  const broken = await page.evaluate(() => Array.from(document.images)
    .filter((image) => image.offsetParent !== null
      && image.complete
      && image.naturalWidth === 0
      && !String(image.src).startsWith('data:'))
    .map((image) => image.src)).catch(() => []);

  if (broken.length) warnings.push(name + ': broken visible images: ' + broken.slice(0, 5).join(', '));

  const file = path.join(TEMP, name);
  await page.screenshot({ path: file, caret: 'hide', animations: 'disabled' });
  const size = fs.statSync(file).size;
  captured.push({ name, size });
  log(name + ' (' + (size / 1024).toFixed(0) + ' KB)');
}

async function maskRecentOrderNames(page) {
  await page.evaluate((demoName) => {
    document.querySelectorAll('.admin-table tbody tr').forEach((row) => {
      const customer = row.querySelector('td:nth-child(2) .fw-medium');
      if (customer && customer.textContent.trim() !== demoName) {
        customer.style.filter = 'blur(7px)';
        customer.style.userSelect = 'none';
      }
    });
  }, DEMO_NAME);
}

function validatePng(file, expectedWidth, expectedHeight) {
  const data = fs.readFileSync(file);
  if (data.length < 24 || data.toString('hex', 0, 8) !== '89504e470d0a1a0a') {
    throw new Error(path.basename(file) + ' is not a valid PNG.');
  }
  const width = data.readUInt32BE(16);
  const height = data.readUInt32BE(20);
  if (width !== expectedWidth || height !== expectedHeight) {
    throw new Error(path.basename(file) + ' has ' + width + 'x' + height
      + '; expected ' + expectedWidth + 'x' + expectedHeight + '.');
  }
  if (data.length < 15000) {
    throw new Error(path.basename(file) + ' is unexpectedly small (' + data.length + ' bytes).');
  }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.rmSync(TEMP, { recursive: true, force: true });
  fs.mkdirSync(TEMP, { recursive: true });

  const browser = await chromium.launch();
  try {
    // Public storefront: desktop, shop, product detail.
    const desktop = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: 1 });
    const page = await desktop.newPage();
    watchPage(page, 'storefront');

    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.product-card', { timeout: 15000 });
    await capture(page, 'homepage-desktop.png');

    await page.goto(BASE + 'shop.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#shop-grid .product-card', { timeout: 15000 });
    await capture(page, 'shop-desktop.png');

    await page.goto(BASE + 'product.html?id=sahara-vase', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#gallery-main', { timeout: 15000 });
    await capture(page, 'product-detail.png');

    // Cart: synthetic cart fixture held only in this browser.
    const cartPage = await desktop.newPage();
    watchPage(cartPage, 'cart');
    await cartPage.addInitScript(() => {
      localStorage.setItem('nova_cart', JSON.stringify([
        { id: 'sahara-vase', qty: 1 },
        { id: 'terra-mug-set', qty: 1 },
      ]));
    });
    await cartPage.goto(BASE + 'cart.html', { waitUntil: 'domcontentloaded' });
    await cartPage.waitForSelector('#cart-filled:not([hidden])', { timeout: 15000 });
    await capture(cartPage, 'cart.png');
    await desktop.close();

    // One mobile representative: homepage at 390 x 844.
    const mobile = await browser.newContext({
      viewport: MOBILE,
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobile.newPage();
    watchPage(mobilePage, 'mobile');
    await mobilePage.goto(BASE, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForSelector('.product-card', { timeout: 15000 });
    await capture(mobilePage, 'homepage-mobile.png');
    await mobile.close();

    // Customer portal: only the dedicated synthetic local demo customer.
    const customer = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: 1 });
    const customerPage = await customer.newPage();
    watchPage(customerPage, 'customer');
    await customerPage.addInitScript(() => {
      localStorage.setItem('nova_cart', JSON.stringify([
        { id: 'sahara-vase', qty: 1 },
        { id: 'terra-mug-set', qty: 1 },
      ]));
    });

    await customerPage.goto(BASE + 'account/login.php', { waitUntil: 'domcontentloaded' });
    await customerPage.waitForSelector('#demo-cust-btn', { timeout: 15000 });
    await customerPage.click('#demo-cust-btn');
    await customerPage.waitForURL('**/account/index.php', { timeout: 15000 });
    await customerPage.waitForSelector('.account-metrics', { timeout: 15000 });
    await capture(customerPage, 'customer-dashboard.png');

    // Checkout requires authentication; use the local synthetic demo session.
    await customerPage.goto(BASE + 'checkout.html', { waitUntil: 'domcontentloaded' });
    await customerPage.waitForSelector('#c-name', { timeout: 15000 });
    await customerPage.fill('#c-name', DEMO_NAME);
    await customerPage.fill('#c-phone', '+20 112 345 6789');
    await customerPage.fill('#c-email', 'demo.customer@novahome.eg');
    await customerPage.fill('#c-address', '14 Hassan Sabry Street, Zamalek');
    await customerPage.fill('#c-apt', 'Apt 7B, 3rd Floor');
    await customerPage.$eval('#c-city', (element) => {
      const option = Array.from(element.options)
        .find((item) => (item.value || '').toLowerCase() === 'cairo') || element.options[1];
      element.value = option.value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await capture(customerPage, 'checkout.png');
    await customer.close();

    // Admin portal: dashboard only; blur any non-demo customer names.
    const admin = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: 1 });
    const adminPage = await admin.newPage();
    watchPage(adminPage, 'admin');

    await adminPage.goto(BASE + 'admin/login.php', { waitUntil: 'domcontentloaded' });
    await adminPage.waitForSelector('#demo-admin-btn', { timeout: 15000 });
    await adminPage.click('#demo-admin-btn');
    await adminPage.waitForURL('**/admin/index.php', { timeout: 15000 });
    await adminPage.waitForSelector('.admin-metrics', { timeout: 15000 });
    await capture(adminPage, 'admin-dashboard.png');
    await admin.close();
  } finally {
    await browser.close();
  }

  if (captured.length !== KEEP.length) {
    throw new Error('Captured ' + captured.length + ' images; expected ' + KEEP.length + '.');
  }

  if (errors.length) {
    errors.forEach((error) => log('PAGE ERROR: ' + error));
    throw new Error(errors.length + ' browser page error(s) detected; existing gallery was not replaced.');
  }

  for (const name of KEEP) {
    const dimensions = name === 'homepage-mobile.png' ? MOBILE : DESKTOP;
    validatePng(path.join(TEMP, name), dimensions.width, dimensions.height);
  }

  // Replace the curated gallery only after every new image passes validation.
  for (const name of KEEP) {
    fs.copyFileSync(path.join(TEMP, name), path.join(OUT, name));
  }
  for (const name of REMOVE_AFTER_SUCCESS) {
    fs.rmSync(path.join(OUT, name), { force: true });
  }
  fs.rmSync(TEMP, { recursive: true, force: true });

  const totalBytes = KEEP.reduce((sum, name) => sum + fs.statSync(path.join(OUT, name)).size, 0);
  log('gallery updated: ' + KEEP.length + ' screenshots, '
    + REMOVE_AFTER_SUCCESS.length + ' obsolete files removed.');
  log('total gallery size: ' + (totalBytes / 1024).toFixed(0) + ' KB.');

  if (warnings.length) {
    warnings.forEach((warning) => log('WARNING: ' + warning));
    log(warnings.length + ' console/image warning(s) recorded; review before release.');
    process.exitCode = 1;
  } else {
    log('no console or broken-image warnings detected.');
  }
}

main().catch((error) => {
  log('FAILED: ' + (error && error.stack ? error.stack : error));
  process.exitCode = 1;
});
