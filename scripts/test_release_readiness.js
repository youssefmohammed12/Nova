/**
 * NOVA Home - safe local release-readiness smoke checks.
 * Performs GET requests only, reads no application config/secrets, and makes no writes.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = (process.env.NOVA_BASE_URL || 'http://localhost/nova-home/nova-home/').replace(/\/?$/, '/');
const SERVER_LABEL = ['localhost', '127.0.0.1'].includes(new URL(BASE_URL).hostname)
  ? 'local Apache'
  : new URL(BASE_URL).hostname;
const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'DENY',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()'
};
const DENIED_DIRECTORIES = ['config/', 'database/', 'includes/', 'scripts/'];

function check(condition, message) {
  assert.ok(condition, message);
  console.log('  [PASS] ' + message);
}

function runGit(args) {
  return spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', windowsHide: true });
}

function checkGitHygiene() {
  const privateConfigIgnored = runGit(['check-ignore', '--quiet', 'config/config.php']).status === 0;
  const backupsIgnored = runGit(['check-ignore', '--quiet', 'database/backups/example.sql']).status === 0;
  const privateConfigTracked = runGit(['ls-files', '--error-unmatch', 'config/config.php']).status === 0;

  check(privateConfigIgnored && !privateConfigTracked,
    'private config path is ignored and is not tracked by Git');
  check(backupsIgnored,
    'database backup directory is ignored by Git');

  for (const directory of ['config', 'database', 'includes', 'scripts']) {
    const file = path.join(ROOT, directory, '.htaccess');
    check(fs.existsSync(file) && /^\s*Require all denied\s*$/m.test(fs.readFileSync(file, 'utf8')),
      directory + '/ has an explicit Apache access-denial rule');
  }

  const rootRules = fs.readFileSync(path.join(ROOT, '.htaccess'), 'utf8');
  check(/Header\s+always\s+set\s+Strict-Transport-Security\s+"max-age=31536000"/i.test(rootRules),
    'root response rules configure one-year host-only HSTS');
}

async function main() {
  let checks = 0;
  const results = [];
  const originalCheck = check;
  const countedCheck = (condition, message) => {
    checks++;
    originalCheck(condition, message);
  };

  check = countedCheck;

  try {
    const routes = [
      { path: 'index.html', contentType: 'text/html', label: 'static homepage' },
      { path: 'account/login.php', contentType: 'text/html', label: 'customer login page' },
      { path: 'api/products.php', contentType: 'application/json', label: 'read-only catalogue API' }
    ];

    for (const route of routes) {
      const response = await fetch(new URL(route.path, BASE_URL), { redirect: 'manual' });
      const contentType = response.headers.get('content-type') || '';
      check(response.status === 200, route.label + ' returns HTTP 200 on ' + SERVER_LABEL);
      check(contentType.toLowerCase().includes(route.contentType),
        route.label + ' returns the expected content type');

      for (const [header, expected] of Object.entries(SECURITY_HEADERS)) {
        const actual = response.headers.get(header);
        check(actual === expected,
          route.label + ' includes ' + header + ': ' + expected);
      }

      if (new URL(BASE_URL).protocol === 'https:') {
        const hsts = response.headers.get('strict-transport-security') || '';
        check(/max-age=31536000/i.test(hsts),
          route.label + ' receives the one-year HSTS header over HTTPS');
      }

      if (route.path === 'account/login.php') {
        const cookie = response.headers.get('set-cookie') || '';
        check(/PHPSESSID=/i.test(cookie) && /HttpOnly/i.test(cookie) && /SameSite=Lax/i.test(cookie),
          'customer session cookie is HttpOnly and SameSite=Lax');
        if (new URL(BASE_URL).protocol === 'https:') {
          check(/;\s*Secure(?:;|$)/i.test(cookie),
            'HTTPS customer session cookie carries the Secure attribute');
        }
      }

      if (route.path === 'api/products.php') {
        const body = await response.json();
        check(body && typeof body === 'object' && !Array.isArray(body),
          'catalogue API returns a JSON object');
      } else {
        await response.arrayBuffer();
      }
      results.push(route.label);
    }

    for (const directory of DENIED_DIRECTORIES) {
      const response = await fetch(new URL(directory, BASE_URL), { redirect: 'manual' });
      check(response.status === 403 || response.status === 404,
        directory + ' is not publicly browsable (HTTP ' + response.status + ')');
      await response.arrayBuffer();
    }

    checkGitHygiene();

    console.log('\n✅ Local release-readiness smoke passed: ' + checks +
      ' checks across static, PHP, API, directory protection and Git hygiene.');
    console.log('Routes checked: ' + results.join(', ') + '.');
  } catch (error) {
    console.error('\n❌ Local release-readiness smoke failed.');
    throw error;
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
