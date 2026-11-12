# NOVA Home — Release Readiness Review

**Review date:** 12 November 2026
**Scope:** accumulated local working tree on `main`
**Decision:** the existing site deployment was confirmed by the owner. This review validates the current local source; the new shop/Quick View fixes below still need to be uploaded to the host before they are live.

## Verified locally

| Check | Result |
|---|---|
| Playwright browser workflow (existing full suite) | **139 passed, 0 failed** |
| Shop filters and Quick View regression | **99 checks passed** across 5 viewports plus homepage entry points |
| Browser JavaScript errors | **0** |
| Unexpected browser console errors | **0** |
| Unexpected HTTP responses | **0**; seven exact signed-out checkout profile `401` responses classified separately |
| Responsive widths | **390, 430, 768, 1024, 1280, 1366 px** passed |
| API suite | **38 passed, 0 failed** |
| PHP syntax | **57 files, 0 failures** |
| JavaScript syntax | **17 files, 0 failures** |
| npm dependency audit | **0 vulnerabilities** |
| Dependency reproducibility | `package-lock.json` exists and is tracked |
| Database-backed image references | **19 rows checked, 0 missing files** (14 product, 5 category) |
| Sensitive directory access | Local requests to `config/`, `database/`, `includes/`, and `scripts/` returned **403** |
| Browser response headers | Local static, PHP, and API routes returned `nosniff`, `strict-origin-when-cross-origin`, `DENY` framing, and restricted camera/microphone/geolocation permissions |
| Git whitespace validation | `git diff --check` passed; only existing LF-to-CRLF conversion warnings |

The browser suite also verified customer registration, saved addresses, authenticated COD checkout, order history/detail, wishlist/account behavior, admin login/management, and the HTML-injection regression probes. Test-created customer, address, order, and temporary-admin data was cleaned up.

## Repository hygiene

- The local `config/config.php`, `.env` files, database backups, and `node_modules/` are ignored and are not tracked.
- The tracked-file scan found no high-confidence private-key, GitHub-token, AWS-key, Stripe live-key, or Slack-token patterns.
- `config.example.php` is the tracked template; the real local configuration remains ignored.
- `package-lock.json` is tracked.
- The root `.htaccess` now applies guarded browser security headers when Apache's `mod_headers` is available. It was verified against the local XAMPP server.
- No schema migration or persistent database change was made by this review.

## Public-host verification — outstanding

The public URLs in the README could not be verified during this review. Requests made on 12 November 2026 to the home page, customer login, admin login, and `health.php` all returned an **OpenResty AES JavaScript challenge page**, not the NOVA application. The HTTP `200` from that challenge is not evidence that the requested application route returned successfully, and it does not establish the current live configuration.

The repository's last recorded deployment checklist (17 October 2026) says the live host still had `env = development` and that `health.php` returned `200`; it separately records that public demo sign-in was enabled. That is historical evidence, not a current observation. It is a deployment blocker until the hosting configuration is checked directly.

Before the next public deployment, verify the private host configuration in the hosting control panel:

1. `env => 'production'` and `debug => false`.
2. `demo_access => false`.
3. `public_demo_access => true` only if the intentional public demo is still desired; otherwise keep it false.
4. `health.php` returns `404` in production.
5. Sensitive directories remain inaccessible, HTTPS is enforced, and session cookies have the `Secure`, `HttpOnly`, and `SameSite=Lax` attributes.
6. Test the public demo buttons and fixed demo identities from a normal browser after the hosting configuration has been confirmed.

Do not infer the production values from the ignored local `config/config.php`; the local environment is intentionally development.

## Remaining non-demo hardening

- Registration now checks Terms/Privacy acceptance server-side, but does not retain a consent timestamp or policy-version record. Add a durable consent record before using the site as a real commercial service.
- A Content Security Policy has not been enabled. The current pages use inline scripts and external CDNs; a CSP should be designed with nonces/hashes and verified in report-only mode before enforcement.
- The public demo grants its dedicated synthetic administrator normal, full admin functionality over shared mutable demo data. Keep it isolated from real customer data and retain the documented reset procedure.

## Repository / release state

The accumulated work remains uncommitted on `main`. No files were staged, no commit or push was made, and nothing was deployed. The local code and test suite are in a good state for a reviewed commit, but **the public deployment is not release-cleared until the production configuration is directly verified**.
