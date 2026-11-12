# NOVA Home — Site Audit Fix Tracker

Status of the 20 site-audit items and responsive checks. Batches A–C were applied first; the 2026-11-12 maintenance pass completed safe correctness fixes and recorded deferred scope decisions below.

- **Verified against:** local stack (`http://localhost/nova-home/nova-home/`), MariaDB `nova_home` (MariaDB 10.11.16, 14 products, 21 orders), headless Playwright at **390 / 768 / 1920 px**.
- **Baseline commit:** `8a09d14` — *Require customer authentication for checkout* (working tree clean).
- **Live site:** `https://nova-home.fast-page.org/` is behind an AES JS cookie challenge (direct fetch returns an 860-byte stub), so live-only symptoms could not be reproduced and may be a stale deploy. Those items are marked **not reproducible locally** and should be re-checked on the live build before changing code.

## Batch log

### Batch A — applied (uncommitted)

| Item | Change | Files |
| :-: | :--- | :--- |
| 1 | Skeleton placeholders for `#category-grid`, `#featured-grid`, `#shop-grid` while the catalogue loads; cleared on `catalog:error` | `js/ui.js` (`catalogSkeletons`), `css/components.css` |
| 2 | Cart badge recomputes on `catalog:ready` (previously only `cart:change`), so stored carts show the right count | `js/ui.js` (`mount`) |
| N-R8 | `.wish-btn` raised from 40×40 to **44×44 px** | `css/components.css` |
| Extra 1 | Auth slot starts hidden (`is-auth-pending`) and is revealed once auth resolves — no guest→signed-in flash | `js/ui.js`, `css/components.css` |
| Extra 2 | Category dropdown shows "Loading categories…" instead of an empty menu before `catalog:ready` | `js/ui.js` (`header`) |
| — | Shop result count shows "Loading products…" on first paint | `shop.html` |

**Batch A verification (Playwright):** with the products API delayed 2.5 s, the early state shows 8 skeleton cards and a "Loading products…" count, and the badge resolves to `1` after load; wishlist still reports 4 saved items; `.wish-btn` measures 44×44 at 390/768/1920; no horizontal overflow (`bodyScrollW == innerWidth`) at any width; admin demo login and admin pages unchanged.

### Batch B — applied (uncommitted)

| Item | Change | Files |
| :-: | :--- | :--- |
| 12 | `?sort=new` now filters to flagged new pieces, titles the page **New Arrivals**, and counts the filtered set (3) instead of "All Pieces / 14 pieces" | `js/main.js` (`shop.render`) |
| 13 | Suggestion names wrap to 2 lines; the shop-sidebar panel widens to 320 px on desktop so text is no longer clipped | `css/components.css` |
| 3, 4, 5 | Re-checked only — **no defect found locally**, so no code change | — |

**Batch B verification (Playwright):** `?sort=new` shows "New Arrivals / 3 pieces" (Halo, Luna, Stack) at 390/768/1920; shop search panel is 320 px with `scrollWidth == clientWidth` for both suggestions and no overflow; carousel remains 1.6/2.4/4 slides; hero is visible on load and promo/look reveal on scroll; every discount badge matches `round((1 − price/old) × 100)` (Sahara and Nile both −19%, no hard-coded −16%).

### Batch C — applied (uncommitted)

| Item | Change | Files |
| :-: | :--- | :--- |
| 6 | Replaced four mismatched product photos and added a distinct homepage craft-panel image (all Pexels, 1200×1200 WebP); attribution updated | `assets/images/products/{sahara-vase,luna-floor-lamp,olive-serving-board,aswan-side-table}/main.webp`, `assets/images/craft/artisan-pottery.webp`, `index.html`, `docs/IMAGE_SOURCES.md` |
| 7 | PDP and Quick View now show "No reviews yet" instead of a seeded star rating | `js/main.js`, `js/ui.js` |
| 8 | Removed "demo estimate" from customer-facing copy; estimator shows a plain city/ETA plus an honest "times are estimates" note | `js/main.js`, `product.html` |
| 14 | Social icons labelled as demo placeholders in both footers | `js/ui.js`, `includes/footer.php` |
| 16 | Contact block kept but visibly marked "Sample contact details for this demo store" in both footers | `js/ui.js`, `includes/footer.php` |
| 17 | Visible password rule, register/login minimum aligned to 8, terms and privacy pages created, required consent checkbox at sign-up | `account/register.php`, `account/login.php`, `api/customer-login.php`, `terms.html`, `privacy.html`, `css/pages.css`, both footers |
| 15 | Re-checked only — copyright already renders as `© 2026 NOVA Home` with normal word spacing; no defect locally | — |

**Batch C verification (Playwright):** the four replaced SKUs load 1200 px WebP images and the craft panel is `assets/images/craft/artisan-pottery.webp` (distinct from every product and the hero art); PDP and Quick View render "No reviews yet" with zero star elements; PDP shows "1–2 working days — Cairo" and "Delivery times are estimates and may vary.", and no page contains "demo estimate"; both footer copies show the demo labels and the Terms/Privacy links; the copyright renders spaced; `terms.html` and `privacy.html` render chrome and content with no overflow at 390/768/1920; register shows "Use at least 8 characters." plus a required consent checkbox, and login accepts `minlength="8"`. Regression checks stayed green: 14 shop cards, "New Arrivals / 3 pieces", badge `1`, wishlist 4 items, no horizontal overflow.


## Status legend

| Marker | Meaning |
| :--- | :--- |
| ✅ **Verified** | Reproduced locally; root cause identified in code/DB. Safe to fix. |
| ✅ **Fixed** | Fix applied and re-verified (see Batch log). |
| ⚠️ **Partial** | Symptom exists but weaker / different from the report; needs a live check or a narrower fix. |
| ❓ **Not reproducible** | Could not trigger locally; likely live-only or already fixed. Do **not** change code blindly. |
| 🚩 **Needs decision** | Fix depends on a product/business choice that must be approved first. |
| ✔️ **Passing** | Checked and already works; no change needed. |
| ✔️ **No defect (local)** | Re-checked and correct on the local build; no code change (re-test live). |

## Effort scale

`S` ≤ 1 hour · `M` half a day · `L` ≥ 1 day (or architectural).

---

## 1. Audit items 1–20

| # | Item | Status | Effort | Primary evidence |
| :-: | :--- | :--- | :-: | :--- |
| 1 | Header/footer blank then pops in; content grid 0 → 14 | ✅ Fixed (Batch A) | M | `js/ui.js` `catalogSkeletons()` now paints placeholders until `catalog:ready`; skeleton counts confirmed 8 early → 14 real cards |
| 2 | Cart badge missing after adding an item | ✅ Fixed (Batch A) | S | `js/ui.js` `mount()` now recomputes the badge on `catalog:ready`; delayed-API test shows `0` early → `1` after load |
| 3 | Bestsellers carousel shows wrong number of cards | ✔️ No defect (local) | S | Re-checked: 4 slides @1920 / 2.4 @768 / 1.6 @390 as designed; live deploy may differ |
| 4 | Category tiles / sections hidden until scroll (`data-reveal`) | ✔️ No defect (local) | S | Hero visible on load; promo/look reveal on scroll by design; category tiles do not use `data-reveal` |
| 5 | Hard-coded `−16%` discount instead of real math | ✔️ No defect (local) | S | All card badges match the real math (Sahara/Nile −19%); no literal `−16%` in the code |
| 6 | Wrong product photography on four SKUs | ✅ Fixed (Batch C) | M | Four Pexels replacements installed as 1200×1200 WebP; homepage craft panel now uses a distinct artisan photo; attribution updated |
| 7 | Star rating shown with no reviews | ✅ Fixed (Batch C) | S | PDP and Quick View show "No reviews yet"; no star output and no reviews table added |
| 8 | Delivery text says "demo estimate" in customer-facing copy | ✅ Fixed (Batch C) | S | Copy now reads "1–2 working days — Cairo" and "Delivery times are estimates and may vary."; no "demo estimate" anywhere in the UI |
| 9 | Guest checkout was requested | 🚩 Resolved: keep signed-in-only | — | Guest checkout deliberately removed in `8a09d14`; `api/orders.php` returns `401 auth_required`. **Decision: no change.** |
| 10 | Checkout city list ≠ delivery city list | ✅ Fixed (2026-11-12) | M | `nova_cities()` now supplies the seven canonical city keys/labels through `api/store-settings.php`; checkout and PDP estimator populate from the same response |
| 11 | No checkout ETA / sticky summary | ⚠️ Deferred | M | PDP has indicative city ETAs; checkout ETA and sticky mobile CTA were not added because they change checkout behavior |
| 12 | `?sort=new` still titled "All Pieces" / "14 pieces" | ✅ Fixed (Batch B) | S | `js/main.js` now filters `p.isNew` and titles the view "New Arrivals"; verified 3 pieces at all widths |
| 13 | Search suggestion text clipped | ✅ Fixed (Batch B) | S | Names wrap to 2 lines; shop panel widened to 320 px on desktop; `scrollWidth == clientWidth` now |
| 14 | "Social profiles coming soon" placeholders | ✅ Fixed (Batch C) | S | Both footers label the icons "demo placeholder" and add "Sample links — social profiles are not live." |
| 15 | Copyright year glued to text | ✔️ No defect (local) | S | Rendered text is `© 2026 NOVA Home. All rights reserved.` with normal spacing at all widths |
| 16 | Placeholder phone / email / address / hours | ✅ Fixed (Batch C) | S | Values kept but visibly marked "Sample contact details for this demo store." in both footers |
| 17 | No visible password rule; no terms / privacy | ✅ Fixed (Batch C) | M | Visible 8-character hint; login aligned to `minlength="8"`; `terms.html` + `privacy.html` with footer links and a required consent checkbox |
| 18 | Wishlist survives sign-out / is not account-scoped | ⚠️ Partial — device-local behavior disclosed | M | Auth event now updates the wishlist account shell; copy says browser/device-local. Data remains in `nova_wish` and is not account-scoped by design in this maintenance pass |
| 19 | Admin: orders not newest-first; "Production / Live" badge | ✅ Fixed (2026-11-12) | S | Dashboard uses `created_at DESC, id DESC`; environment badge is derived from `NOVA_ENV`; both covered by Playwright |
| 20 | No stock quantity anywhere | ✔️ Deferred — inventory remains out of scope | L | No inventory model/column is added; fake ID-derived quantity is removed from the legacy preview and PDP/Quick View disclose that stock is not tracked |

### Item notes (root cause → proposed fix)

**1. Blank-then-pop / 0 → 14 grid — FIXED (Batch A).** `catalogSkeletons()` (in `js/ui.js`) fills `#category-grid`, `#featured-grid` and `#shop-grid` with shimmer placeholders while the API fetch is in flight, and clears them on `catalog:error`. The page controllers still replace them with real cards on `catalog:ready`. Header/footer render at `DOMContentLoaded` as before. Note the PHP header/footer (`includes/header.php`, `includes/footer.php`) are **currently unused by the storefront** and must mirror any future change.

**2. Cart badge race — FIXED (Batch A).** `badge()` is now bound to `catalog:ready` as well as `cart:change`, so a cart stored in `localStorage` is counted once `NOVA.products` resolves. The delayed-API test goes `0` → `1` instead of staying hidden.

**3–5. Carousel / reveal / discount — NO DEFECT LOCALLY (Batch B).** Re-checked with Playwright: the carousel renders 1.6/2.4/4 slides at 390/768/1920; the hero is visible on load and only promo/look use scroll reveal (as designed); every discount badge matches the computed percentage (no literal `−16%`). If the live deploy still shows these, it is stale — re-test live (D7).

**6. Wrong photography — FIXED (Batch C).** Replaced all four mismatched SKUs with matching Pexels photos (Ivan S, Zafer Erdoğan, Electra Studio, Skylar Kang), 1200×1200 WebP, and gave the homepage "Artisanal craft" panel its own image (`assets/images/craft/artisan-pottery.webp`, Vitaly Gariev). `docs/IMAGE_SOURCES.md` records the new sources and file sizes.

**7. Ratings without reviews — FIXED (Batch C).** `reviews_count` exists in the schema but nothing populates or displays it. The PDP and Quick View now show **"No reviews yet"** instead of a seeded star rating. No reviews table added, per D4.

**8. "Demo estimate" copy — FIXED (Batch C).** The PDP estimator now reads "1–2 working days — Cairo" with "Delivery times are estimates and may vary.", and the checkout destination reads "Delivery to: Cairo". No customer-facing string says "demo estimate".

**9. Guest checkout — CLOSED.** The product owner confirmed signed-in-only checkout stays. This matches the latest commit (`8a09d14` "Require customer authentication for checkout") and the `401 auth_required` gate in `api/orders.php`. No code change.

**10. City list mismatch — FIXED (2026-11-12).** `nova_cities()` is the canonical seven-city map and is returned by `api/store-settings.php`; checkout and the PDP estimator populate their selectors from it. The ETA strings remain frontend-only indicative copy.

**11. ETA / sticky summary — DEFERRED.** The PDP already shows an indicative city ETA, but checkout still has no confirmed delivery window or sticky mobile CTA. Adding a checkout ETA/sticky action changes the checkout experience and needs a separate product decision; it was not added in this no-feature maintenance pass.

**12. `?sort=new` header + count — FIXED (Batch B).** The shop controller now filters to `p.isNew` when `sort=new`, sets the title to "New Arrivals", and the count follows the filtered list (3 pieces). Verified at all three widths.

**13. Search clipping — FIXED (Batch B).** Suggestion names now wrap to two lines (line-clamp) instead of a single ellipsised line, and the shop-sidebar panel widens to 320 px on desktop. At 1920 the panel is 320 px and `scrollWidth == clientWidth` for both suggestions; no page overflow.

**14. Social placeholders — FIXED (Batch C).** Both copies (`js/ui.js` and `includes/footer.php`) now label the icons "demo placeholder" (title + aria-label) and add "Sample links — social profiles are not live."

**15. Year spacing — NO DEFECT LOCALLY (Batch C).** Both footers render `© 2026 NOVA Home. All rights reserved.` with normal spacing at 390/768/1920. If the live deploy still glues the year, it is stale; re-test live (D7).

**16. Placeholder contact — FIXED (Batch C).** The values are kept but both footers now show "Sample contact details for this demo store."

**17. Password rules / terms — FIXED (Batch C).** Registration shows "Use at least 8 characters." under the field; login now uses `minlength="8"` and the server enforces the same minimum; `terms.html` and `privacy.html` were added, linked from both footers, and a required consent checkbox gates sign-up.

**18. Wishlist — PARTIAL (2026-11-12).** `renderAuthUI()` now dispatches `auth:change`, fixing the wishlist profile/sidebar state; the page now clearly says the list is stored in this browser on this device. The underlying `nova_wish` data remains device-local and can be seen by another signed-in user on the same browser. True account-scoped storage was not added because it requires a persistence/ownership design.

**19. Admin ordering/environment — FIXED (2026-11-12).** Dashboard recent orders sort by `created_at DESC, id DESC`; the environment badge now reflects `NOVA_ENV`. The browser suite asserts chronological ordering and the configured environment.

**20. Stock quantity — DEFERRED; misleading display fixed (2026-11-12).** There is still no inventory/stock model or schema column. The legacy admin preview no longer fabricates counts from product IDs, and PDP/Quick View state that availability is not tracked. A real inventory system remains a separate feature/architecture decision.

---

## 2. Responsive checks N-R1 … N-R8

All eight were re-tested at 390 / 768 / 1920 px against the local build and **pass** after Batch A.

| ID | Check | Status | Notes |
| :-: | :--- | :--- | :--- |
| N-R1 | Mobile navigation (hamburger + offcanvas drawer) | ✔️ Passing | `#navDrawer` opens/closes correctly at 390 px |
| N-R2 | Shop filters usable on mobile | ✔️ Passing | "Filters" opens an offcanvas panel |
| N-R3 | Category pills scroll horizontally | ✔️ Passing | `#cat-pills` `overflow-x:auto`; 669 vs 366 px content |
| N-R4 | Quick View reachable on touch | ✔️ Passing | Forced visible under `(hover:none), (max-width:575.98px)` |
| N-R5 | PDP buy row wraps without overflow | ✔️ Passing | No overflow at any tested width |
| N-R6 | Cart / checkout stack cleanly | ✔️ Passing | Single-column layout at 390 px |
| N-R7 | No horizontal page overflow | ✔️ Passing | 390 / 768 / 1920 all clean |
| N-R8 | Touch-target sizing | ✅ Fixed (Batch A) | `.wish-btn` raised to **44×44 px** (`css/components.css`); measured 44×44 at 390/768/1920 |

**N-R8 — FIXED (Batch A):** `.wish-btn` is now 44×44 px; measured at all three widths with no overflow or overlap.

---

## 3. Additional findings (outside the 20 items)

Discovered during verification. Items 1–2 are fixed in Batch A; the rest are report-only and need approval.

1. **Header auth flicker — FIXED (Batch A).** The slot now renders with `is-auth-pending` (hidden) until `checkAuth()` resolves, then reveals the correct guest/signed-in state, removing the guest→signed-in flash.
2. **Empty category dropdown on first paint — FIXED (Batch A).** `header()` now shows "Loading categories…" until `catalog:ready` populates the real list.
3. **Wishlist auth event — FIXED (2026-11-12).** `renderAuthUI()` now dispatches `auth:change`; the profile card and sidebar update after auth resolves. The actual wishlist remains device-local and is disclosed as such.
4. **Password minimum mismatch — FIXED (Batch C).** Login now uses `minlength="8"` (client) and `strlen($password) < 8` (server), matching registration.
5. **Duplicated header/footer markup.** JS footer (`js/ui.js:206–219`) and PHP footer (`includes/footer.php`) must be edited in lockstep — every footer fix above has two copies.
6. **Fake stock in legacy preview — FIXED (2026-11-12).** The `stockOf()` ID-derived quantity was removed; the legacy preview shows `Not tracked`.
7. **Demo/test rows in the orders table.** `Phase8 Final`, `Test Customer`, `Session B` inflate admin counts (21 orders). Consider a seed/cleanup step.

---

## 4. Decisions

### Resolved (confirmed by product owner)

| # | Decision | Resolution |
| :-: | :--- | :--- |
| D1 | Guest checkout (item 9) | **Keep signed-in-only.** Current `8a09d14` behaviour and the `401 auth_required` gate stand; item 9 is closed as intentional. |
| D2 | Contact details (item 16) | **Label clearly as demo/sample.** Keep the details but mark them as sample data. |
| D3 | Social profiles (item 14) | **Label clearly as demo/sample.** Keep the icons but mark them clearly as placeholders. |
| D4 | Ratings (item 7) | **Minimal.** Show "No reviews yet" instead of a star rating until real reviews exist. |
| D6 | Product photography (item 6) | **Approved — Pexels.** Replace the four SKUs with matching photos and add a distinct homepage craft-panel image; update `docs/IMAGE_SOURCES.md`. |

### Still open

| # | Decision | Options |
| :-: | :--- | :--- |
| D5 | Stock (item 20) | **Defer inventory tracking.** Do not invent counts; disclose that availability is not tracked until a separate inventory decision is made. |
| D7 | Live re-check (items 3, 4, 5, 15) | re-test on the live deploy before changing code, or fix against local assumptions |

---

## 5. Suggested fix batches (after approval)

| Batch | Items | Scope | Effort |
| :--- | :--- | :--- | :-: |
| A — Shell & header | 1, 2, N-R8, extra 1–2 | Render header/footer/cart badge before catalog; skeleton grid; 44 px wish button | M — ✅ **done** |
| B — Catalog polish | 3, 4, 5, 12, 13 | Carousel/reveal/discount re-check; `?sort=new` title+count; search wrapping | S–M — ✅ **done** |
| C — Trust & copy | 6, 7, 8, 14, 15, 16, 17 | Photos + attribution, ratings, delivery wording, footer, password rules, terms/privacy | M–L — ✅ **done** |
| D — Checkout | 9, 10, 11 | City source of truth fixed; checkout ETA/sticky summary deferred as a separate UX decision | M — partial |
| E — Account | 18, extra 3–4 | Wishlist auth event fixed and device-local behavior disclosed; account-scoped persistence remains deferred | S–M — partial |
| F — Admin & inventory | 19, 20, extra 6–7 | Order sorting/environment fixed; inventory deferred; legacy fake stock removed; pre-existing demo/test rows require separate identification before cleanup | S–L — partial |

---

## 6. Guardrails

- **Do not touch working features:** search, filters, sorting, Quick View, wishlist filtering, cart maths, COD checkout, Recently Viewed, admin demo login.
- **No commits or pushes** until explicitly requested.
- Re-run the Playwright matrix at 390 / 430 / 768 / 1024 / 1280 / 1366 after meaningful UI changes; update this file's status column.
- Any header/footer edit must be applied to **both** `js/ui.js` and `includes/footer.php` / `includes/header.php`.


## 7. Independent re-check — 2026-11-12

This pass re-checked the existing Batch A–C work against the current working tree. It did not reset, clean, commit, push, deploy, or modify application code or database rows.

### Verification performed

- Git state: still on `main` at `8a09d14`; audit changes remain uncommitted. Preserve all current changes and deleted legacy SVGs.
- `git diff --check`: passed (exit 0).
- PHP syntax: 57 PHP files checked with `php -l`; 0 failures.
- JavaScript syntax: 8 project JS files checked with `node --check`; 0 failures.
- Local HTTP smoke: homepage, shop, product, cart, checkout entry, customer login/register, admin login, Terms and Privacy all returned HTTP 200. The unauthenticated checkout entry redirects to customer login as intended by the signed-in-only checkout decision.
- Browser spot check at 390 px: homepage, `shop.html?sort=new`, and Sahara product page returned HTTP 200; no horizontal overflow or broken image elements; New Arrivals displayed 3 cards. A wider repeat matrix was attempted but not completed reliably, so this is not a replacement for the earlier 390/768/1920 matrix.
- Seed image references: 19 references checked, 0 missing. The 14 product WebP assets remain present; updated seed paths agree with the current asset layout.
- The existing full `scripts/playwright_audit.js` was deliberately not run: it still attempts guest checkout (now intentionally disabled), and its `finally` block runs broad cleanup against test-like database rows. Do not use it until rewritten with safe, explicit test isolation.

### Re-check of earlier fixes

- Batch A: skeleton loading, cart badge update, auth-pending shell, category loading state, and 44 px wishlist target remain present in code. The original delayed-API assertions were not all repeated in this short pass.
- Batch B: `?sort=new` still produces the New Arrivals heading and 3 products in the browser spot check. The prior carousel/reveal/discount checks remain documented but were not all repeated.
- Batch C: the four replacement product photos and craft image are referenced by the current seed/page markup; rating output in PDP and Quick View still says "No reviews yet"; Terms and Privacy pages return HTTP 200; password/consent changes remain in code. Full registration and live email workflows were not repeated.

### Newly confirmed maintenance findings

| Priority | Finding | Evidence / recommended maintenance |
| :-- | :-- | :-- |
| High | City lists are inconsistent | ✅ Fixed 2026-11-12: `nova_cities()` supplies the canonical seven-key city map through `api/store-settings.php`; checkout and PDP estimator read the same labels. ETA values remain indicative frontend copy. |
| Medium | Wishlist account chrome never receives its expected event | ✅ Fixed 2026-11-12: `renderAuthUI()` dispatches `auth:change`; page displays the signed-in customer and delegated sign-out. Device-local wishlist storage remains a documented limitation. |
| Medium | Admin recent-order query uses ID ordering | ✅ Fixed 2026-11-12: dashboard query now uses `created_at DESC, id DESC`; Playwright asserts newest-first order. |
| Medium | Admin environment label is hard-coded | ✅ Fixed 2026-11-12: label/style now derives from `NOVA_ENV`; Playwright confirms the local Development label. |
| Medium | Homepage testimonials appear to be unverified demo content | ✅ Fixed 2026-11-12: removed invented named testimonials and ratings; product detail/Quick View explicitly show no reviews yet. |
| Medium | Inventory claims exceed system capability | ✅ Messaging fixed 2026-11-12: PDP/Quick View disclose that availability is not tracked and admin preview no longer fabricates counts. Inventory itself remains out of scope. |
| Low | Homepage operational copy needs a truth check | ✅ Updated 2026-11-12: removed invented testimonials and unsupported reorder, quality-check, delivery/returns promises; newsletter copy now states submissions are not saved. |
| Low | Legacy test scripts are unsafe/stale | ✅ Hardened 2026-11-12: browser suite tests authenticated checkout, creates per-run credentials, uses exact-identity cleanup, and test utilities have CLI-only guards. Full suite passes 136/136. |

### Scope recommendation

The next maintainability priority is a gradual extraction of `js/main.js` and `js/ui.js` into responsibility-focused modules, guarded by the passing browser/API tests. Keep account-scoped wishlist persistence, checkout sticky/ETA behavior and inventory tracking as separate product/architecture decisions; do not bundle them into routine maintenance.

No application code was changed during this re-check. No database writes were performed.


## 8. Maintenance batch — 2026-11-12

The following maintenance work was applied to the existing uncommitted Batch A–C working tree. No new customer-facing feature was introduced, and no commit, push, or deployment was performed.

### Application corrections

| Area | Change | Verification |
| :--- | :--- | :--- |
| Admin recent orders | Dashboard query now sorts by `created_at DESC, id DESC` for chronological order with a deterministic tie-break | Browser assertion confirms newest-first dates |
| Admin environment | Replaced the hard-coded “Production / Live” badge with a label/style derived from `NOVA_ENV` | Browser assertion passes in local Development |
| Wishlist account shell | `renderAuthUI()` now dispatches `auth:change` with the resolved customer state; wishlist copy now explicitly describes device-local storage | Browser verifies customer name/email and sidebar sign-out link |
| Delivery-city policy | `nova_cities()` is the canonical seven-city list; public settings API now returns the labels; product estimator and checkout populate from the same server list with a safe frontend fallback | API city-set assertions and authenticated checkout browser assertion pass |
| Checkout profile prefill | Selecting a saved default address now synchronizes the delivery estimator city and checkout destination | Authenticated checkout test passes |
| Tablet navigation | Full desktop nav now begins at 1200 px; collapsed navigation remains active below that width while two-column content layouts still start at 992 px | Six-viewport browser matrix passes with no horizontal overflow |
| Storefront credibility | Removed invented named customer testimonials, unsupported “in stock” / dispatch promises, and unverified product review presentation; delivery/returns/newsletter wording now clearly describes demo limitations | Browser assertions verify testimonials are absent and Quick View has honest inventory/review copy |
| Legacy admin preview | Removed ID-derived invented stock quantities; preview now says “Not tracked” | Static checks and browser regression pass |

### Test and tool hardening

- `scripts/playwright_audit.js` now tests signed-in-only checkout rather than obsolete guest checkout, retains the cart after the login redirect, accepts required registration consent, checks the canonical city set, wishlist auth state, admin ordering/environment and current logout behavior.
- The browser test uses local Playwright, `NOVA_BASE_URL`, and random per-run customer/admin passwords; no fixed test password is stored in source.
- `scripts/cleanup_test_data.php` now requires the exact generated E2E customer email, scopes order/address/customer deletion to that customer's rows, requires an explicit flag for the named temporary admin, wraps cleanup in a transaction, and refuses web execution.
- Database inspection/test/cleanup utilities now have explicit CLI-only guards in addition to directory protection.
- `package.json` exposes `npm run test:api` and `npm run test:browser`.

### Verification results

- API suite: **36 passed, 0 failed**.
- Full Playwright suite: **136 passed, 0 failed**; **0 page JavaScript errors** and **0 console errors**.
- Browser responsive matrix: **390 / 430 / 768 / 1024 / 1280 / 1366 px**, seven routes per width, no horizontal overflow.
- PHP syntax: **57 files checked, 0 failures**.
- Project JavaScript syntax: **8 files checked, 0 failures**; Playwright runner syntax also passes.
- `git diff --check`: passed (exit 0; Git emitted only LF→CRLF conversion warnings).
- Test cleanup: exact E2E order, customer, address and temporary admin removed successfully; no test customer order is intentionally retained.

### Maintainability assessment (updated after the 2026-11-12 refactor)

The project has a solid baseline for its current portfolio-demo scope: PHP bootstrap/auth/validation/database helpers are separated; APIs have explicit response contracts and public-field allowlists; the frontend separates catalogue loading, settings, cart state, shared UI and page behavior; CSS is layered into variables/base/components/pages/responsive; and browser/API checks are runnable through npm scripts.

The former large-file concentration has been addressed:

- All six storefront page controllers now live under `js/pages/`; `js/main.js` is a small dispatcher/shared-preview layer.
- Shared customer shell/auth, search autocomplete, and Quick View responsibilities now live under `js/ui/`; `js/ui.js` remains the shared card/toast/delivery/Shop-the-Look facade.
- Storefront header/footer templates still exist in JavaScript and mirrored PHP partials. The PHP partials are not the source rendered by static storefront pages, so copy/layout drift remains a maintenance consideration.
- Some PHP account pages still contain inline page-specific JavaScript; extract only when there is a clear shared responsibility, not simply to reduce line counts.
- Historical audit entries intentionally retain earlier measurements, but current status and next steps must follow the latest sections and the top-level project guide.

The remaining city ETA strings are illustrative frontend copy only, not a verified courier policy. The live host still needs a separate post-deployment re-check; this local run does not prove that deployed files match the working tree.


## 9. Homepage hero alignment and first JS extraction — 2026-11-12

### Hero image alignment

- Updated `.hero-frame--main` in `css/pages.css`: the main chair photo now uses a 2% top/right inset, an 86% composition height, and a matching 190px upper radius.
- Before: the frame started above and to the right of the decorative backdrop.
- After: the image frame aligns with the backdrop's top and right edges and sits approximately 10px inside its lower edge, while the pottery card and delivery chip keep their existing overlap.
- Verified visually and measured with Playwright at 1440px, 1024px and 390px. No document overflow or page JavaScript errors were reported during these checks.

### Gradual JavaScript extraction — first slice

- Added `js/pages/home.js` as the dedicated homepage controller.
- `index.html` loads this controller after `ui.js` and before `main.js`.
- The controller registers as `NOVA.pageControllers.home`; the existing dispatcher now supports registered page controllers while retaining the in-file handlers for pages not yet extracted.
- Kept Recently Viewed rendering as one shared `NOVA.renderRecentlyViewed()` helper in `main.js`, because it is called by both the homepage and the product detail page. This avoids duplicating behavior or breaking PDP initialization.
- `main.js` is now approximately 858 lines; the new homepage controller is approximately 63 lines. `ui.js` remains approximately 664 lines.
- This is the first incremental extraction only. Shop, product, cart, checkout and order-success controllers remain in `main.js`; no wholesale rewrite was attempted.

### Verification after the extraction correction

- Full Playwright browser suite: **136 passed, 0 failed**, **0 page JavaScript errors**, **0 console errors**.
- Responsive checks: **390 / 430 / 768 / 1024 / 1280 / 1366 px** passed across the existing route matrix.
- API suite: **36 passed, 0 failed**.
- PHP syntax: **57 files checked, 0 failures**.
- JavaScript syntax: **9 files checked, 0 failures**, including the new `js/pages/home.js`.
- `package.json` parses successfully.
- `git diff --check`: passed (exit 0; Git only emitted its existing LF→CRLF conversion warnings).

### Next extraction sequence (historical checkpoint; superseded)

This was the recommended next step at the first extraction checkpoint. The work was subsequently completed: all six page controllers are now extracted and the shared auth/shell, search, and Quick View modules are separated. See Sections 10 and 11 below for the completed architecture and later verification.


## 10. Hero composition recheck and storefront controller extraction — 2026-11-12

### Homepage hero image — corrected framing

- Rechecked the actual `index.html` hero at 1440px and 390px. The previous 2% top/right placement left the main image flush against two sides of its backing and cropped the square source into a frame that was too large for the intended inset composition.
- Updated `.hero-frame--main` in `css/pages.css` to `right: 5%; top: 5%; width: 78%; height: 82%`, with a matching 184px upper radius. The backdrop retains its current dimensions and position.
- Browser measurements at 1440px: backdrop approximately 403 × 465px; main frame approximately 374 × 433px, with approximately 14–16px inset on each side. The mobile 390px screenshot also shows the frame contained within the backing.
- The overlapping pottery craft card and delivery chip remain in place. No asset was replaced and no new feature was added.

### Remaining page controllers — extracted

- Added `js/pages/shop.js`, `product.js`, `cart.js`, `checkout.js`, and `success.js`. The existing `home.js` remains the homepage controller.
- Matching HTML pages load their controller after `ui.js` and before `main.js`.
- Each module registers one `NOVA.pageControllers` handler. `main.js` exposes a frozen `NOVA.pageHelpers` interface for shared formatting, UI, catalogue, DOM, debounce, summary-line, and checkout-auth helpers. Each controller declares only the dependencies it uses.
- `main.js` is now approximately 168 lines and remains responsible for dispatch, the shared Recently Viewed renderer, demo forms, and admin/account previews. The shared `ui.js` layer was intentionally not mixed into this extraction; its auth/shell, search, and Quick View concerns remain a separate next review.

### Browser-audit synchronization correction

- Updated the no-reference `order-success.html` route expectation to match its intentional “Order status / No order specified” informational state.
- The route test now waits until the asynchronous catalogue-dependent page controller has rendered the expected heading before reading `document.title`. This removes a timing race between static HTML and the controller’s settled empty state.
- Full Playwright browser suite: **137 passed, 0 failed**, with **0 page JavaScript errors** and **0 console errors**. All six responsive widths (390, 430, 768, 1024, 1280, 1366px) passed.
- API suite: **36 passed, 0 failed**.
- PHP syntax: **57 files checked, 0 failures**. JavaScript syntax: **14 files checked, 0 failures**. `package.json` parsed successfully.
- `git diff --check`: passed (exit 0); Git reported only existing LF→CRLF conversion warnings.
- Browser-generated order/customer data and temporary audit admin were removed by the test cleanup.

No database schema changes, commit, push, or deployment were made.


## 11. Shared UI responsibility extraction — 2026-11-12

The remaining shared-UI concentration in `js/ui.js` was separated behind small `NOVA` interfaces without adding storefront functionality:

- `js/ui/search.js` owns delegated header/shop search autocomplete and registers `NOVA.searchUI.bind()`.
- `js/ui/quick-view.js` owns Quick View state, modal population, quantity, wishlist synchronization and focus restoration; it registers `NOVA.quickViewUI.open()`. The existing `NOVA.ui.openQuick()` remains a compatibility alias.
- `js/ui/shell.js` owns header/footer templates, customer-auth lookup/presentation, category navigation synchronization, logout and `auth:change`; it registers `NOVA.shellUI`. The store-settings announcement text is exposed to the existing settings refresh through this module.
- `js/ui.js` is now the shared card/toast/delivery/Shop-the-Look and delegated add/wishlist event facade. The page controller modules remain under `js/pages/`.
- All 16 customer-facing root/account routes load `search.js`, `quick-view.js`, and `shell.js` before `ui.js`; page-specific modules load after `ui.js` and before `main.js`. Admin pages do not load this customer shell.

### Verification after shared UI extraction

- Full Playwright browser suite: **137 passed, 0 failed**, **0 page JavaScript errors**, **0 console errors**. The route/workflow suite and responsive widths 390, 430, 768, 1024, 1280 and 1366px passed.
- API suite remains **36 passed, 0 failed** (shared UI refactor did not touch API code).
- PHP syntax: **57 files checked, 0 failures**. JavaScript syntax: **17 files checked, 0 failures**. `package.json` is valid; `git diff --check` exits 0 (only line-ending conversion warnings).
- No database/schema changes, commits, pushes or deployments. The Playwright-generated order/customer and temporary audit account are cleaned by the test runner.

The former `ui.js` maintainability concern is now decomposed into shell/auth, search, Quick View and a smaller shared UI facade. Remaining future maintenance should focus on reviewing whether `ui.js` still has any cohesive concerns worth extracting; avoid splitting small cohesive helpers merely to reduce line count.


## 12. Full changeset audit, output encoding and consent hardening — 2026-11-12

### Changeset review and integrity

- Audited the accumulated frontend, backend, API, account, admin, image, test, and documentation changes as a whole. Preserved the existing working tree and did not reset or discard any prior work.
- Checked database-backed image references: all **14 product-image rows** and **5 category-image rows** resolve to existing files. No remaining source references were found for the deleted legacy product SVG assets.
- Corrected the documented image totals using the current files on disk: 14 product WebP files total **1,050,924 bytes (~1,026.3 KiB / 1.05 MB)**; the homepage craft image is **81,650 bytes (~79.7 KiB)**; combined approximately **1.13 MB**.
- Updated privacy and terms copy to avoid claiming live support, self-service account deletion, tracked inventory, or real returns/refunds. Placeholder phone/email and shared-demo data are clearly identified. Privacy copy now discloses that registration consent is checked but no separate timestamp or policy-version record is retained.

### Browser test hardening

- Removed the broad Playwright suppression of all console messages containing `401` or `404`. Unexpected console errors and unexpected HTTP responses now fail the test process.
- The only HTTP exception is an exact `401` from `api/customer-profile.php` while the browser is on signed-out `checkout.html`. The corresponding console message is accepted only after the response handler verifies that exact endpoint, status, and page; the suite reports these separately.
- Added client-only regression probes for product and category strings that resemble HTML. Both probes confirm that output is rendered as literal text, not parsed into injected elements.
- Full Playwright workflow after the registration-consent API change: **139 passed, 0 failed**; **0 page JavaScript errors**, **0 unexpected console errors**, **0 unexpected HTTP errors**; 7 expected guest-auth console messages and 7 corresponding expected HTTP responses. Responsive widths **390 / 430 / 768 / 1024 / 1280 / 1366 px** passed.
- Browser test cleanup removed the exact generated customer, address/order data, and temporary audit admin.

### Output encoding and registration consent

- Added shared `NOVA.escapeHTML()` and applied it at dynamic HTML-template boundaries for product cards, Shop the Look, category navigation, search suggestions, category/filter controls, product specifications/gallery attributes, cart lines, admin preview rows, and order-confirmation items. DOM `textContent`/property assignments remain preferred where applicable.
- Registration now sends `terms_accepted`; `api/customer-register.php` requires the boolean value `true` after CSRF validation and rejects missing/false consent before any account insert.
- Added a negative API regression case for the missing-consent request. No schema change was made; a timestamped/versioned consent audit record remains future work if the project is used beyond a demonstration.

### Final local verification

- Browser workflow: **139 passed, 0 failed**.
- API suite: **38 passed, 0 failed**.
- PHP syntax: **57 files checked, 0 failures**.
- JavaScript syntax: **17 files checked, 0 failures**.
- `package.json`: valid JSON.
- `git diff --check`: exit 0; Git reports only existing LF-to-CRLF working-copy conversion warnings.
- Added a guarded root `.htaccess` response policy for `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, and `Permissions-Policy` disabling camera, microphone, and geolocation. Verified all four headers on local static, PHP, and API routes; existing sensitive-directory requests continue to return 403.
- npm dependency audit: **0 vulnerabilities**; tracked-file scan found no high-confidence private-key or common provider-token patterns.
- Public-host requests on 2026-11-12 returned an OpenResty AES JavaScript challenge page before the application; current hosted route/config status therefore remains unverified. The last repository-recorded live check (2026-10-17) reported `env = development` and a public `health.php` response, so production configuration must be confirmed directly in the host panel before the next deployment.
- No database schema change, commit, push, or deployment. See `docs/RELEASE_READINESS.md` for the release decision and remaining gates.
