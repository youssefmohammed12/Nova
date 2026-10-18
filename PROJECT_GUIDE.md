# NOVA Home — Project Guide

> **Purpose**: Canonical developer and AI navigation document.  
> A future AI session or developer should read this file first before touching any code.  
> All facts here are verified against the actual source files. Where this document conflicts with the code, **trust the code and update this file**.

---

## Table of Contents

1. [Project Identity](#1-project-identity)
2. [Current Status](#2-current-status)
3. [Project Goals](#3-project-goals)
4. [Design System](#4-design-system)
5. [Technology Stack](#5-technology-stack)
6. [Dependency Policy](#6-dependency-policy)
7. [Folder Structure](#7-folder-structure)
8. [JavaScript Architecture](#8-javascript-architecture)
9. [State Management](#9-state-management)
10. [Business Rules](#10-business-rules)
11. [Customer Features](#11-customer-features)
12. [Account UI](#12-account-ui)
13. [Admin UI](#13-admin-ui)
14. [Product Data Model](#14-product-data-model)
15. [Cart Data Model](#15-cart-data-model)
16. [Order Data Model](#16-order-data-model)
17. [CSS Architecture](#17-css-architecture)
18. [Responsive Design Rules](#18-responsive-design-rules)
19. [Animation and Motion Rules](#19-animation-and-motion-rules)
20. [Accessibility Rules](#20-accessibility-rules)
21. [Performance Rules](#21-performance-rules)
22. [Security Rules](#22-security-rules)
23. [QA and Testing](#23-qa-and-testing)
24. [Completed Audit Findings](#24-completed-audit-findings)
25. [Current Known Issues](#25-current-known-issues)
26. [PHP/MySQL Migration Map](#26-phpmysql-migration-map)
27. [AI Development Rulebook](#27-ai-development-rulebook)
28. [Changelog](#28-changelog)
29. [Roadmap](#29-roadmap)
30. [Document Maintenance Rules](#30-document-maintenance-rules)
31. [Source of Truth Hierarchy](#31-source-of-truth-hierarchy)

---

## 1. Project Identity

| Field | Value |
| :--- | :--- |
| **Name** | NOVA Home |
| **Type** | Small-business Egyptian home & lifestyle e-commerce platform |
| **Domain** | Home décor, lighting, kitchen, storage, small furniture |
| **Market** | Egypt — Cairo, Giza, Alexandria, and nationwide delivery |
| **Stage** | **Frontend complete and audited. Backend Phases 1–11 complete: MySQL catalog, real orders, admin management, settings sync, customer accounts, customer order history, and project-wide audit & hardening. Real product photography migration complete (WebP, licensed Pexels assets).** |
| **Purpose** | Portfolio-grade project demonstrating professional frontend, UX, vanilla JS state management, e-commerce workflows, and PHP/MySQL backend development |
| **Language** | English UI with EGP currency |

> [!IMPORTANT]
> Payment flow is COD only (no external payment gateway). **Customer and Admin authentication are real** (PHP sessions, bcrypt `password_hash`/`password_verify`, session regeneration, per-session throttling). **Order persistence is real**: authenticated customer checkouts write `orders`/`order_items` in `nova_home` (guest checkout removed 2026-10-17 — `api/orders.php` requires a customer session and returns `401` otherwise), success page reads MySQL via session-authorized `api/order.php` (Phase 4), and authenticated order history is SQL-ownership protected (Phase 10). Cart remains localStorage-based. Directory access is protected via `.htaccess` and sensitive endpoints are guarded (Phase 11). **Catalog product images use authentic, high-resolution photography** in modern WebP format under `assets/images/products/<slug>/main.webp`, fully documented with Pexels licensing in `docs/IMAGE_SOURCES.md`.

---

## 2. Current Status

### Frontend — Complete

The following has been built, integrated, tested, and audited:

| Area | Status |
| :--- | :--- |
| Static code audit | ✅ Complete |
| Runtime QA (Playwright) | ✅ Complete |
| Responsive QA (390 → 1366px) | ✅ Complete (0 horizontal overflow) |
| Accessibility review (Lighthouse 100/100) | ✅ Complete |
| Performance review | ✅ Complete |
| Feature integration testing | ✅ Complete |
| Visual refinement & real photography | ✅ Complete |

**Customer features built:**
Product catalogue · Search · Search suggestions · Filters · Sorting · Quick View · Recently Viewed · Wishlist · Shop the Look · Free-delivery progress · Delivery estimator · Sticky mobile Add to Cart · Cart · Authenticated checkout (account required) · Order success · Account UI · Order history · Admin UI

### Backend — Phase 11 Complete & Real Photography Migration Complete

> Backend Phases 1–11 built and verified the complete infrastructure: MySQL storage, secure PDO wrapper, catalogue APIs, authenticated checkout (guest path removed 2026-10-17), session-bound order retrieval, admin auth & CRUD, dynamic settings sync, customer accounts & address book, customer order history, directory hardening, real product photography in WebP format, and full-route automated verification.

| Area | Current state |
| :--- | :--- |
| **Backend foundation & security** | ✅ Complete — `config/`, `includes/`, `database/`, `scripts/` directory `.htaccess` protection (403 direct access); dev-only `health.php` guard; zero PHP syntax warnings |
| **Database** | ✅ Complete — `nova_home`, 10 tables, baseline 5 categories, 14 products, 14 high-resolution WebP photographs, 42 specs, 6 settings, 15 historical orders preserved |
| **Authentication** | ✅ Real Admin (Phase 5) + Real Customer (Phase 9): bcrypt (`password_hash`/`password_verify`), session regeneration, separate session fields, `require_customer()`, `require_admin()`, per-session throttle (5/60s→429) |
| **Payments** | ❌ COD only — no payment gateway integration (by design) |
| **Orders** | ✅ Phases 3/4/7/9/10 + 2026-10-17 auth requirement: customer COD orders with transactional DB persistence (authenticated sessions only — `api/orders.php` returns `401` for guests); server-side revalidation of pricing and delivery fees; session-authorized success retrieval; customer order history with SQL-level ownership |
| **Admin data** | ✅ Phases 5–7: authenticated dashboard, category management, product management with image/spec repeaters, order status progression, store settings management |
| **Product API / cart / checkout wiring** | ✅ Phase 2: catalogue APIs live, storefront reads MySQL. ✅ Phase 3: checkout submits real orders; cart cleared upon server confirmation. ✅ Phase 8: storefront synchronized with `settings` via `GET api/store-settings.php` + `js/settings.js` |
| **Project-wide audit & verification** | ✅ Phase 11: 48 routes inventoried and tested; 128 Playwright assertions passed with 0 JS errors; Lighthouse 100/100 Accessibility, 100/100 Best Practices, 100/100 SEO; test data cleanly purged; historical data preserved |
| **Product Photography Migration** | ✅ Complete — 14 authentic, high-res Pexels photographs cropped 1:1 and converted to optimized WebP (~780 KB total); `v_image_path()` updated; DB & `seed.sql` synchronized; single-image gallery thumbnail handling perfected; verified across cards, PDP, quickview, cart, wishlist, admin form |
| **GitHub publication preparation** | ✅ Complete — repository initialized with safe `.gitignore`, tracked config example (`demo_access => false`), public `README.md` with 23 real screenshots in `docs/screenshots/`, readiness fixes, and deployment documentation |

---

## 3. Project Goals

### Primary Goal
A believable, professional small-business e-commerce platform suitable for a freelance portfolio — demonstrating clean frontend, real UX patterns, and a clear migration path to a PHP/MySQL backend.

### Secondary Goals
- Clean, readable architecture with minimal dependencies
- Good performance (verified Lighthouse 100 locally)
- Genuine responsive design across all tested viewports
- Accessibility that meets WCAG AA at a minimum
- Code that a single developer can understand and maintain
- A clear, documented path to PHP/MySQL migration

### What NOVA Home Is NOT Trying to Become
- Amazon-scale marketplace
- Multi-vendor platform
- Overly complex enterprise system
- AI-heavy showcase
- Animation showcase
- Framework-heavy application (no React, Vue, Angular)

---

## 4. Design System

### Personality
Warm · Minimal · Premium · Boutique · Approachable · Modern Egyptian

### Colors (from `css/variables.css` — verified)

| Token | Hex | Usage |
| :--- | :--- | :--- |
| `--c-bg` | `#F7F3EC` | Page background (ivory) |
| `--c-surface` | `#FFFDF9` | Card, modal, panel surfaces |
| `--c-stone` | `#EBE3D6` | Section background, image placeholder fills |
| `--c-sand` | `#D8CCB8` | Form borders, subtle dividers |
| `--c-ink` | `#24201C` | Primary text, headings |
| `--c-muted` | `#6B635A` | Secondary text, labels |
| `--c-line` | `#E2D9CA` | Borders and rule lines |
| `--c-accent` | `#A94F2C` | Terracotta — CTA buttons, links, highlights |
| `--c-accent-dark` | `#8A3E20` | Accent hover/active state |
| `--c-success` | `#3F6B4F` | Success states (e.g., free delivery unlocked) |
| `--c-cream` | `#EDE5D8` | Used in footer brand text |
| `--c-footer-text` | `#D8CFC0` | Footer body text |
| `--c-footer-line` | `#3A342D` | Footer rule lines |
| `--c-footer-dim` | `#A99F90` | Footer secondary/dim text |
| `--c-star` | `#9A6416` | Star rating colour |

### Typography (from `css/variables.css` — verified)

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--font-display` | `'Newsreader', Georgia, serif` | Headings (h1, h2, h3) |
| `--font-body` | `'Instrument Sans', system-ui, ...` | All body text, UI elements |

Both fonts loaded from Google Fonts CDN.

### Spacing and Radius Tokens

| Token | Value |
| :--- | :--- |
| `--radius-sm` | `8px` |
| `--radius` | `14px` |
| `--radius-lg` | `22px` |
| `--shadow-sm` | `0 1px 2px rgba(36,32,28,.06)` |
| `--shadow-md` | `0 10px 28px rgba(36,32,28,.09)` |
| `--space-section` | `clamp(3rem, 6vw, 5rem)` |
| `--space-head` | `1.75rem` |
| `--ease` | `cubic-bezier(.2, .7, .2, 1)` |
| `--dur` | `.25s` |

### Design Rules (do not break these)
- Preserve the current ivory/terracotta/ink identity
- Improve rather than redesign
- Use whitespace and type hierarchy as primary layout tools
- Avoid excessive gradients, excessive box shadows, glassmorphism
- Avoid neon or high-saturation colours
- Avoid a generic Bootstrap template appearance — override Bootstrap's defaults using the token system
- Do not change fonts without explicit instruction

---

## 5. Technology Stack

### Current Frontend Stack

| Technology | Version | How it is used |
| :--- | :--- | :--- |
| **HTML5** | — | All pages; semantic markup with ARIA |
| **CSS3** | — | 5-file architecture (see §17) |
| **Vanilla JavaScript** | ES2020+ | All behaviour; `NOVA` global namespace |
| **Bootstrap** | 5.3.8 (CDN) | Grid, offcanvas nav, modals, toasts, form validation, utility classes |
| **Bootstrap Icons** | 1.13.1 (CDN) | Icon library throughout the UI |
| **Swiper** | 14.3.0 (CDN) | Bestsellers carousel on the homepage only |
| **Google Fonts** | — | Instrument Sans + Newsreader via CDN |

### Current Backend (implemented, verified 2026-10-17)

| Component | Implementation |
| :--- | :--- |
| Language | PHP 8.1+ (developed and tested on PHP 8.2.12) |
| Database | MariaDB 10.4 / MySQL 8 compatible — database `nova_home`, 10 tables |
| Data access | PDO with prepared statements only (`config/database.php` → `nova_db()`, emulated prepares off) |
| Server | Apache / XAMPP (development), then hosted Apache with `.htaccess` support |
| No ORM | Raw PDO for transparency at this project scale |

---

## 6. Dependency Policy

Rules for all future AI and developer work:

1. **Prefer native browser APIs** before reaching for a library.
2. **Prefer existing libraries** (Bootstrap, Bootstrap Icons, Swiper) before adding another.
3. **Do not add a package** when CSS or vanilla JS can solve the problem cleanly.
4. **Any new dependency requires a documented reason** and a measurable benefit.
5. **Avoid overlapping libraries** — e.g., do not add another icon set, another modal library, or another utility-CSS framework.
6. **Do not add animation libraries** for simple animations — `transition` / `@keyframes` handles everything currently needed.
7. **Keep CDN versions pinned** to exact versions (e.g., `bootstrap@5.3.8`), not `latest`.
8. The three current CDN dependencies (Bootstrap, Bootstrap Icons, Swiper) should be **preserved unless there is a documented reason to replace one**.

---

## 7. Folder Structure

```
nova-home/
├── index.html               # Homepage (storefront shell booted by the shared JS layer)
├── shop.html                # Catalogue / search / filter / sort
├── product.html             # Product detail page (PDP)
├── cart.html                # Shopping cart
├── checkout.html            # Checkout form (signed-in customers only, COD)
├── order-success.html       # Post-checkout confirmation (server-authoritative)
├── favicon.svg              # Site favicon
├── README.md                # Public project introduction and setup guide
├── PROJECT_GUIDE.md         # This file
│
├── account/                 # Customer area — server-rendered PHP behind require_customer()
│   ├── index.php            # Customer dashboard (metrics + latest order)
│   ├── login.php            # Login form (development demo button when enabled)
│   ├── register.php         # Registration form
│   ├── logout.php           # Server-side logout
│   ├── orders.php           # Order history (SQL ownership enforced)
│   ├── order.php            # Order detail (?ref=, SQL ownership enforced)
│   ├── profile.php          # Profile management
│   ├── addresses.php        # Saved-address book
│   ├── wishlist.html        # Account wishlist (localStorage state via shared JS)
│   └── *.html               # Legacy redirect stubs pointing at the PHP pages
│
├── admin/                   # Administrator portal — PHP behind require_admin()
│   ├── index.php            # Dashboard: live metrics, recent orders, quick actions
│   ├── login.php            # Admin login (throttled; development demo button when enabled)
│   ├── logout.php           # Server-side logout (admin session keys only)
│   ├── products.php         # Product table + search/filter/sort + visibility toggles
│   ├── product-form.php     # Create/Edit product (spec & image repeaters)
│   ├── categories.php       # Category management with product counts
│   ├── orders.php           # Order list with filters and status workflow
│   ├── order.php            # Order detail + fulfilment status transitions
│   ├── settings.php         # Business identity + delivery pricing rules
│   └── *.html               # Legacy redirect stubs pointing at the PHP pages
│
├── css/
│   ├── variables.css        # Design tokens — the only place to change brand colours/fonts
│   ├── base.css             # Reset, typography, buttons, form controls, reveal animation
│   ├── components.css       # Shared components: header, footer, cards, badges, toast, modal
│   ├── pages.css            # Page-specific styles: hero, shop, PDP, cart, checkout, account, admin
│   └── responsive.css       # Breakpoint overrides and layout shifts
│
├── js/
│   ├── products.js          # NOVA init + frontend-only constants (NO product records since Phase 2)
│   ├── cart.js              # Cart, wishlist, recently viewed — localStorage CRUD + custom events
│   ├── catalog.js           # Fetches categories+products from api, emits catalog:ready/error
│   ├── ui.js                # Header/footer injection, product card, toast, Quick View, search suggestions, Shop the Look, delivery progress
│   ├── settings.js          # Applies store settings from api/store-settings.php to the UI
│   └── main.js              # Page-specific behaviour dispatched by data-page, demo forms, admin/account previews
│
├── assets/
│   └── images/              # Category artwork (SVG) + real product photography (WebP)
│       ├── hero.svg  promo.svg  shop-look.svg  cat-*.svg
│       └── products/<slug>/main.webp    # 14 licensed photographs — see docs/IMAGE_SOURCES.md
│
├── config/                  # Configuration — DB credentials stay OUT of Git
│   ├── config.php           # LOCAL ONLY (git-ignored): env, debug, demo_access, public_demo_access, db, base_url, business
│   ├── config.example.php   # Tracked template — copy to config.php for local dev (demo_access + public_demo_access => false)
│   └── database.php         # nova_db(): single PDO factory (exceptions, assoc, real prepares, utf8mb4)
│
├── includes/                # Shared PHP (no business logic)
│   ├── bootstrap.php        # Loads config, error policy, lazy secure session, DB + helpers
│   ├── functions.php        # e(), nova_config(), nova_base_url()/asset()/url(), is_post(), redirect(), json_response(), CSRF trio, nova_setting(), nova_money()
│   ├── validation.php       # v_required/email/int_range/money_int/slug/phone_eg/text/city
│   ├── customer-auth.php    # require_customer(), customer login/logout, per-session login throttle
│   ├── admin-auth.php       # require_admin(), admin login/logout, per-session login throttle
│   ├── header.php / footer.php      # PHP mirrors of ui.js header/footer (available; not included by pages)
│   └── admin-head.php / admin-foot.php  # Shared admin shell partials
│
├── database/                # Init scripts (rerunnable)
│   ├── schema.sql           # CREATE DATABASE nova_home + 10 tables, FKs, CHECKs
│   ├── seed.sql             # 5 categories, 14 products, 14 images, 42 specs, 6 settings
│   ├── demo-data.infinityfree.sql    # phpMyAdmin: dedicated demo customer + admin (idempotent)
│   ├── demo-reset.infinityfree.sql   # phpMyAdmin: destructive demo-DB reset step 1
│   ├── migrations/          # Historical migrations (fresh installs need schema.sql only)
│   └── backups/             # LOCAL ONLY, git-ignored — may contain customer/order data
│
├── docs/                    # Documentation
│   ├── IMAGE_SOURCES.md     # Photography provenance & licensing (tracked)
│   ├── screenshots/         # README screenshot gallery (tracked)
│   └── development/         # Deployment runbooks (tracked) + local-only notes (git-ignored)
├── api/                     # JSON endpoints: categories, products, product, orders, order, csrf,
│                            # admin-login, customer auth/profile/addresses, store-settings,
│                            # dev-gated demo sign-in, and PUBLIC demo sign-in
│                            # (public-demo-customer / public-demo-admin)
├── scripts/                 # CLI-only utilities (web access denied): create_admin, seed_demo_customer,
│                            # cleanup/test/inspection scripts, Playwright audit, capture_screenshots
├── health.php               # Dev-only infra probe: JSON in development, 404 otherwise
└── .gitignore               # Local config, DB backups, node_modules, test artifacts, logs, OS/editor noise
```

### Responsible Areas

| Directory | Responsibility |
| :--- | :--- |
| Root HTML | Customer storefront pages (rendered shell + shared JS layer) |
| `account/` | Customer account screens — real session auth, SQL-backed data, ownership enforced server-side |
| `admin/` | Administrator screens — real admin auth via `require_admin()`, MySQL-backed management |
| `api/` | JSON endpoints for the storefront and both login flows |
| `css/` | All styling. Changes to the brand belong in `variables.css` only. |
| `js/` | All behaviour. Each file has a single focused responsibility (see §8). |
| `assets/images/` | Category artwork (SVG) and licensed WebP product photography (see docs/IMAGE_SOURCES.md) |
| `config/` + `includes/` | Configuration, bootstrap, helpers, validation, auth gateways |
| `database/` | Schema, safe seed data, historical migrations (backups are local-only) |
| `scripts/` | CLI-only developer utilities and verification tooling |

---

## 8. JavaScript Architecture

All JS lives in the `NOVA` global namespace, initialised by `products.js`.

**Script load order on every page:**
```html
<script src="js/products.js"></script>   <!-- must be first -->
<script src="js/cart.js"></script>
<script src="js/ui.js"></script>
<script src="js/main.js"></script>
```

Pages inside `account/` and `admin/` use `../js/` relative paths.

---

### `products.js` — Catalogue, Config, Utilities

**Responsibility:** Initialises `window.NOVA`, defines all static data and shared utility functions. Must load before all other scripts.

**Key exports on `NOVA`:**

| Property / Method | Type | Description |
| :--- | :--- | :--- |
| `NOVA.products` | `Array` | 14 product objects (the catalogue) |
| `NOVA.categories` | `Array` | 5 category objects |
| `NOVA.FREE_DELIVERY_OVER` | `1500` | Free delivery threshold in EGP |
| `NOVA.DELIVERY_FEE` | `60` | Flat delivery fee in EGP |
| `NOVA.BASE` | `string` | `'../'` for pages inside subdirs, `''` for root |
| `NOVA.imgs(id)` | `fn → string[]` | Returns `[main, alt2, alt3]` SVG paths for a product |
| `NOVA.fmt(n)` | `fn → string` | Formats a number as `'EGP 1,234'` |
| `NOVA.find(id)` | `fn → product\|undefined` | Looks up a product by ID |
| `NOVA.catName(id)` | `fn → string` | Returns a category display name |
| `NOVA.lookSpots` | `Array` | 4 hotspot definitions for Shop the Look |
| `NOVA.deliveryCities` | `Object` | 5 city keys with `name` and `days` strings |
| `NOVA.delivery` | `Object` | Delivery city state: `get()`, `set(id)`, `info(id)`, `ids()`, `key`, `def` |
| `NOVA.search` | `Object` | Search: `popular[]`, `norm(q)`, `suggestions(q, limit)` |

---

### `cart.js` — Cart, Wishlist, Recently Viewed

**Responsibility:** All localStorage-backed state CRUD. Dispatches custom events on change. Zero DOM access — pure data layer.

**`NOVA.cart`:**

| Method | Signature | Description |
| :--- | :--- | :--- |
| `items()` | `→ {id, qty}[]` | Returns validated cart array (unknown IDs discarded) |
| `count()` | `→ number` | Total item count across all lines |
| `add(id, qty)` | `→ boolean` | Adds qty to existing line or creates new. Clamps to 1–10. |
| `setQty(id, qty)` | `→ void` | Sets exact qty, clamped to 1–10 |
| `remove(id)` | `→ void` | Removes a product line |
| `clear()` | `→ void` | Empties the cart |
| `subtotal()` | `→ number` | Sum of `price × qty` resolved from catalogue |
| `delivery()` | `→ number` | `0` if subtotal = 0 or ≥ 1500, else `60` |
| `total()` | `→ number` | `subtotal() + delivery()` |

**`NOVA.wish`:**

| Method | Description |
| :--- | :--- |
| `has(id)` | `boolean` — is this product wishlisted? |
| `ids()` | `string[]` — all wishlisted product IDs |
| `toggle(id)` | Adds or removes; returns `true` if now wishlisted |

**`NOVA.recent`:**

| Method | Description |
| :--- | :--- |
| `items()` | `string[]` — up to 6 recently-viewed product IDs, newest first |
| `add(id)` | Prepends ID, deduplicates, trims to max 6 |
| `clear()` | Removes the key from localStorage |

**Storage keys (defined inside the IIFE — not on NOVA directly):**

| Internal constant | Key | Purpose |
| :--- | :--- | :--- |
| `KEY` | `nova_cart` | Cart persistence |
| `WISH` | `nova_wish` | Wishlist persistence |
| `RECENT` | `nova_recently_viewed` | Recently viewed persistence |

**Events dispatched:**

| Event | Fired by | Listeners |
| :--- | :--- | :--- |
| `cart:change` | `save(KEY, ...)` | Cart badge update, delivery progress, cart page render, checkout render, PDP estimator |
| `wishlist:change` | `save(WISH, ...)` | Card wish-button sync, Quick View wish sync, account wishlist grid, shop wishlist mode |

---

### `ui.js` — Shared UI Layer

**Responsibility:** Header/footer injection, product card HTML, toast, Quick View modal, search suggestions panel, Shop the Look renderer, delivery progress bar. Exposed on `NOVA.ui`.

**`NOVA.ui`:**

| Method | Description |
| :--- | :--- |
| `mount()` | Called once on `DOMContentLoaded`. Injects header/footer, binds cart badge, binds delivery progress, binds search, binds click delegation for add/wish/quick/look. |
| `card(p, wishSet?)` | Returns product card HTML string. `wishSet` is an optional `Set<id>` for batch rendering without repeated localStorage reads. |
| `toast(msg)` | Shows Bootstrap Toast; falls back to a DOM element if Bootstrap is unavailable. |
| `openQuick(id, trigger?)` | Populates and opens the shared Quick View modal. Stores the trigger element for focus return on close. |
| `shopLook()` | Renders hotspot buttons and product list into `#look-spots` and `#look-items`. |
| `deliveryProgress(subtotal?)` | Pure function — returns `{ subtotal, threshold, remaining, pct, unlocked }`. |
| `renderDeliveryProgress()` | Reads cart state and updates the `#ship-progress` DOM element. |

**Click delegation** in `mount()` handles (via `document` listener):
- `[data-look]` → `openQuick(id, trigger)`
- `[data-quick]` → `openQuick(id, trigger)`
- `[data-add]` → `NOVA.cart.add()` + toast
- `[data-wish]` → `NOVA.wish.toggle()` + DOM sync + toast

**Header/footer** are injected into `#site-header` and `#site-footer` slots on every page. In a future PHP backend these become `include` files.

---

### `main.js` — Page-Specific Behaviour

**Responsibility:** Dispatches page behaviour based on `document.body.dataset.page`. Each page gets its own function inside `pages`. Also runs `demoForms()`, `adminPreview()`, and `accountPreview()` on every page.

**Page keys (matched to `data-page` attribute):**

| `data-page` value | File | What it does |
| :--- | :--- | :--- |
| `home` | `index.html` | Renders category grid, featured products, bestseller Swiper, recently viewed, Shop the Look |
| `shop` | `shop.html` | Filter/sort/search state machine, renders catalogue grid, wishlist mode banner |
| `product` | `product.html` | PDP: gallery, specs, qty, add, wish, delivery estimator, sticky CTA, related products, recently viewed |
| `cart` | `cart.html` | Cart lines, qty controls, summary, delivery progress |
| `checkout` | `checkout.html` | Form validation, order snapshot, redirect to success |
| `success` | `order-success.html` | Reads + validates sessionStorage snapshot, renders order summary |

**`demoForms()`** — Attaches submit handlers to `#demo-login`, `#demo-register`, `#demo-profile`, `#demo-settings`, `#demo-product-form`. Validates honestly but never saves. Shows a "demo only" toast.

**`adminPreview()`** — Renders real catalogue data into admin tables (`#ap-rows`, `#ac-rows`). Provides live product filter by name and category. Populates product form when `?id=` is present.

**`accountPreview()`** — Renders the real local wishlist (`NOVA.wish.ids()`) into `#account-wish-grid`. Listens for `wishlist:change` to re-render.

---

## 9. State Management

### localStorage Keys

#### `nova_cart`

```js
// Shape: array of cart lines
[
  { "id": "sahara-vase", "qty": 2 },
  { "id": "luna-floor-lamp", "qty": 1 }
]
```

- `id` must be a valid product ID (validated against `NOVA.products` on every read)
- `qty` is clamped to 1–10; invalid entries are discarded
- Prices are **never stored in the cart** — they are always resolved live from `NOVA.products`
- Persistence: survives browser sessions
- Event: `cart:change` on every mutation

#### `nova_wish`

```js
// Shape: array of product ID strings
["sahara-vase", "halo-mirror"]
```

- Only valid product IDs are kept (empty strings filtered out)
- Persistence: survives browser sessions
- Event: `wishlist:change` on toggle

#### `nova_recently_viewed`

```js
// Shape: array of product ID strings, newest first, max 6
["sahara-vase", "luna-floor-lamp", "cairo-boucle-chair"]
```

- Validated against `NOVA.products` on read (unknown IDs skipped)
- Deduplicated; maximum 6 entries
- Persistence: survives browser sessions
- No custom event — components re-render directly when needed

#### `nova_delivery_city`

```js
// Shape: a string key from NOVA.deliveryCities
"cairo"  // or: "giza", "alexandria", "fayoum", "other"
```

- Default: `"cairo"` (used if missing or invalid)
- Persistence: survives browser sessions
- Shared between PDP estimator and checkout form

### sessionStorage Keys

#### `nova_last_order` — REMOVED (Phase 4)

No sessionStorage keys are written or read by NOVA anymore. The Phase 3 order
snapshot was deleted in Phase 4 because `order-success.html` now fetches the
authoritative order from `GET api/order.php` (session-authorized, MySQL-backed).
Tampered/stale snapshot values are therefore impossible to display — verified
by test. Legacy snapshots left over in existing browsers are simply ignored.

### Custom Events

| Event name | Fired by | Who listens |
| :--- | :--- | :--- |
| `cart:change` | `NOVA.cart` mutations | Cart badge (`ui.js`), delivery progress (`ui.js`), cart page render (`main.js`), checkout summary (`main.js`), PDP estimator (`main.js`) |
| `wishlist:change` | `NOVA.wish.toggle()` | Product cards DOM sync (`ui.js`), Quick View wish button (`ui.js`), account wishlist grid (`main.js`), shop wishlist mode (`main.js`) |

---

## 10. Business Rules

> [!NOTE]
> All rules below are **DEMO/FRONTEND** constants. They live in `js/products.js` as `NOVA.FREE_DELIVERY_OVER` and `NOVA.DELIVERY_FEE`. Do not hardcode these values anywhere else — always reference the constants. The backend will eventually own these values in a settings table.

| Rule | Current value | Source of truth | Demo? |
| :--- | :--- | :--- | :--- |
| **Delivery fee** | EGP 60 | `NOVA.DELIVERY_FEE` (`products.js`) | ✅ Demo |
| **Free delivery threshold** | EGP 1,500 | `NOVA.FREE_DELIVERY_OVER` (`products.js`) | ✅ Demo |
| **Cart quantity minimum** | 1 | `QTY_MIN` constant in `cart.js` | ✅ Demo |
| **Cart quantity maximum** | 10 | `QTY_MAX` constant in `cart.js` | ✅ Demo |
| **Recently viewed max** | 6 | `RECENT_MAX` constant in `cart.js` | ✅ Demo |
| **Search suggestion limit** | 5 (default), max 10 | `NOVA.search.suggestions(q, 5)` | ✅ Demo |
| **Payment method** | Cash on delivery only | Static copy in header and checkout | ✅ Demo |
| **Checkout** | Signed-in customer account required (guest path removed 2026-10-17) | `api/orders.php` 401s unauthenticated POSTs; login/registration return via whitelisted `?return=checkout` | ✅ Live |
| **Stock status** | All items shown as "In stock" | Hardcoded in Quick View and PDP | ✅ Demo |
| **Egyptian phone validation** | `required`, `type="tel"`, browser-native | Checkout form HTML5 validation | ✅ Demo |

**Demo delivery estimates (DEMO only — not courier guarantees):**

| City key | Display name | Demo estimate |
| :--- | :--- | :--- |
| `cairo` | Cairo | 1–2 working days |
| `giza` | Giza | 1–2 working days |
| `alexandria` | Alexandria | 2–3 working days |
| `fayoum` | Fayoum | 2–4 working days |
| `other` | Other Egypt | 3–5 working days |

Default city: `cairo` (fallback if key is missing or invalid).

---

## 11. Customer Features

### Search
- **Where:** Header search (Bootstrap modal, `#searchModal`) and Shop page inline (`#f-search`)
- **Module:** `products.js` (`NOVA.search`), `ui.js` (`searchBind`, `searchOpen`, `searchClose`)
- **How it works:** In-memory search over `NOVA.products`. Ranks results: name-starts-with → name-includes → category-includes → description/specs-includes. Normalises query (lowercase, collapsed whitespace).
- **Suggestion limit:** 5 items + "View all results" row
- **Keyboard:** Arrow keys navigate suggestions; Enter navigates to product or shop; Escape closes panel
- **Popular searches:** Shown when input is focused but empty: `['Lamps', 'Vases', 'Lighting', 'Storage']`
- **Limitation:** Static data only. No server-side search.

### Search Suggestions
- Rendered as a `[role="listbox"]` panel below the input
- Each suggestion shows product thumbnail, name, category, price
- "View all results" button submits the search to `shop.html?q=…`
- On the Shop page, "View all results" applies the query to the live filter instead of navigating

### Quick View
- **Where:** All product cards (`.quick-btn`), Shop the Look list rows
- **Module:** `ui.js` (`openQuick`, `qvSyncQty`, `qvSyncWish`)
- **How it works:** Single shared Bootstrap modal (`#quickModal`), populated on-demand from `NOVA.find(id)`. No duplicated product state.
- **Features:** Image, name, category, rating, price (with discount badge), stock note, description, quantity control (1–10), Add to Cart, Wishlist toggle, "View Full Details" link
- **Accessibility:** Focus returns to the triggering element on modal close
- **Limitation:** Shows first product image only; no gallery. Stock info is always "In stock, ships within 2 working days" (static copy).

### Recently Viewed
- **Where:** Homepage (`#recent-section`) and PDP (`#recent-section`)
- **Module:** `cart.js` (`NOVA.recent`), `main.js` (`renderRecent`)
- **How it works:** PDP calls `NOVA.recent.add(p.id)` on load. Homepage and PDP render the stored IDs as product cards.
- **Max:** 6 products, newest first, deduplicated
- **Invalid products:** Unknown IDs are silently skipped on read
- **Limitation:** Shows section only when there is at least one valid entry.

### Wishlist
- **Where:** All product cards (`.wish-btn`), Quick View (`#qv-wish`), PDP (`#pdp-wish`), Shop (`?wish=1`), Account (`account/wishlist.html`)
- **Module:** `cart.js` (`NOVA.wish`), `ui.js` (click delegation), `main.js` (`accountPreview`)
- **How it works:** `nova_wish` localStorage array. `wishlist:change` event propagates state to all visible wish buttons without page reload.
- **Account wishlist:** Renders the real localStorage wishlist — this is the one feature in the Account UI backed by real frontend state.
- **Limitation:** No server-side sync. Clearing browser storage removes the wishlist.

### Shop the Look
- **Where:** Homepage (`#look-spots`, `#look-items`)
- **Module:** `products.js` (`NOVA.lookSpots`), `ui.js` (`shopLook`)
- **How it works:** Reads `NOVA.lookSpots` (4 products with percentage-based `x/y` hotspot coordinates). Renders clickable hotspot buttons over the scene image and a product list below. Both open Quick View.
- **Hotspot products:** Luna Arc Floor Lamp, Cairo Boucle Accent Chair, Aswan Oak Side Table, Sahara Ceramic Vase
- **Limitation:** Hardcoded product selection. Backend would allow admin-configurable looks.

### Free-Delivery Progress
- **Where:** Cart page, Checkout page (anywhere `#ship-progress` exists)
- **Module:** `ui.js` (`deliveryProgress`, `renderDeliveryProgress`)
- **How it works:** ARIA `progressbar`. Shows remaining amount to unlock free delivery, or a "Free delivery unlocked" state with stacked title/subtitle. Updates on every `cart:change` event.
- **Unlocked:** When subtotal ≥ `NOVA.FREE_DELIVERY_OVER` (1,500 EGP)
- **Hidden:** When cart is empty

### Delivery Estimator
- **Where:** PDP (`#ship-est`)
- **Module:** `products.js` (`NOVA.delivery`, `NOVA.deliveryCities`), `main.js` (`product()`)
- **How it works:** Dropdown of 5 cities. Selected city is stored in `nova_delivery_city`. Checkout pre-selects the stored city. Demo text appended: "(demo estimate)".
- **Limitation:** Delivery days are static estimates, not real courier data.

### Sticky Mobile Add to Cart
- **Where:** PDP, mobile only (≤ 767.98px)
- **Module:** `main.js` (`product()`)
- **How it works:** `IntersectionObserver` watches `#pdp-actions`. The bar only becomes visible when the primary actions have been **scrolled past** (i.e., `!en.isIntersecting && en.boundingClientRect.bottom < 0`). A passive scroll listener handles edge cases (instant jumps).
- **Quantity sync:** Shares the PDP `qty` variable. Incrementing/decrementing PDP qty updates the sticky bar's `data-qty`.
- **Desktop:** Always hidden via `.d-md-none`.
- **Limitation:** Demo-only — uses same `NOVA.cart.add()` flow.

### Cart
- **Where:** `cart.html`
- **Module:** `cart.js`, `main.js` (`cart()`)
- **How it works:** Renders all `NOVA.cart.items()` as lines. Inline qty controls call `NOVA.cart.setQty()`. Remove calls `NOVA.cart.remove()`. Totals re-render on `cart:change`.
- **Empty state:** Shows when cart has no items.

### Checkout
- **Where:** `checkout.html`
- **Module:** `main.js` (`checkout()`)
- **Requires authentication (2026-10-17):** an active customer session is mandatory. Signed-out visitors are redirected to `account/login.php?return=checkout` (also from the cart CTA); the return value is whitelisted server-side to the literal `checkout` only, and the `localStorage` cart survives every redirect. `api/orders.php` independently rejects unauthenticated POSTs with `401 auth_required` before any parsing or database write.
- **How it works:** HTML5 `required` form validation; profile + default saved address prefill for signed-in customers (stored phones are whitespace-normalised for the strict input pattern). On valid submit: `GET api/csrf.php` → `POST api/orders.php` → server validation/pricing → on success the cart clears and the page redirects to `order-success.html?ref=NH-YYYYMMDD-XXXXXX`. A `401` mid-submit (session expiry) returns to the login flow without clearing the cart.
- **City sync:** Pre-selects the city from `nova_delivery_city`.

### Order Success
- **Where:** `order-success.html`
- **Module:** `main.js` (`success()`)
- **How it works:** The URL ref is display/navigation only. The page renders the authoritative order from MySQL via the session-authorized `GET api/order.php?ref=...` (bound at checkout; see §16). Loading/error/missing states are handled explicitly.

---

## 12. Account UI

**Files:** `account/login.html`, `account/register.html`, `account/index.html`, `account/orders.html`, `account/order.html`, `account/profile.html`, `account/addresses.html`, `account/wishlist.html`

> [!IMPORTANT]
> **All Account pages are currently static/demo UI screens.**
> - There is **no real authentication**.
> - There is **no real account persistence**.
> - Form submissions show a toast: *"Demo only: nothing was saved."*
> - Hardcoded demo user: "Mariam" with sample order history and address.

**Exception — Account Wishlist (`account/wishlist.html`):**  
This page renders the real `nova_wish` localStorage state using `NOVA.ui.card()`. It responds live to `wishlist:change` events. This is the only Account page with real frontend state.

**Future backend responsibilities:** Real session-based auth, server-side account records, address persistence, real order history from the database.

---

## 13. Admin UI

**Files:** `admin/login.php`, `admin/index.php`, `admin/logout.php` (Phase 5 auth); `admin/products.php`, `admin/categories.php`, `admin/product-form.php` (Phase 6); `admin/orders.php`, `admin/order.php`, `admin/settings.php` (Phase 7); redirect stubs for `login/index/products/categories/product-form/orders/order/settings.html`. **No static admin pages remain** — every admin route is a protected PHP page or a redirect to one.

> [!IMPORTANT]
> **Phase 5 made admin authentication/authorization real; admin CRUD is still demo.**
> - ✅ Real login/logout/session (`api/admin-login.php`, `admin/logout.php`, `includes/admin-auth.php`).
> - ✅ `admin/index.php` is server-gated by `require_admin()` — anonymous requests 302 → `admin/login.php`.
> - ⚠️ The remaining `.html` admin pages are static demos with **no database-backed data** (fake numbers/rows) and are not yet PHP-gated; they convert to protected `.php` pages in Phase 6.
> - Product/order/settings forms still show the demo toast; no CRUD exists yet.

### Admin Authentication Architecture (Phase 5, verified 2026-10-05)

| Piece | File | Behavior |
| :--- | :--- | :--- |
| Authorization helper | `includes/admin-auth.php` | **Single gateway.** `require_admin($api=false)`: page mode → `302 login.php`, API mode → `401 JSON`. Also `nova_admin_user()` (session→DB re-check: id must exist and `active=1` — deactivation kills live sessions immediately), `nova_admin_login()` (`session_regenerate_id(true)` **before** storing identity), `nova_admin_logout()` (clear identity → regenerate id → `session_destroy()`) |
| Login endpoint | `POST api/admin-login.php` | JSON `{email, password, csrf_token}`. Non-POST → 405. CSRF → 400. Invalid format/creds → **generic 401 `Invalid email or password.`** (identical for unknown email, wrong password, inactive account; dummy `password_verify()` equalizes timing). Success → 200 `{success, data:{name, redirect}}`. Faults → 500 generic + `error_log()` (never passwords/hashes) |
| Login page | `admin/login.php` | Server-rendered clone of the old demo design (`.auth-card` markup preserved); CSRF embedded via `data-csrf`; fetch-POST to the API; Bootstrap alert for errors; already-authenticated visits skip to `index.php` |
| Logout | `admin/logout.php` | **POST + CSRF only** (GET → 405; missing/bad token → 400) → destroys the session → `302 login.php`. Triggered from the sidebar Sign-out link (fetch POST with embedded token) |
| Protected dashboard | `admin/index.php` | `require_admin()` before any markup; sidebar identity shows `Signed in as {session name}` (server data, never client-supplied) |
| Dev account creator | `scripts/create_admin.php` | **CLI-only** (`PHP_SAPI !== 'cli'` → bare 404), name/email args, password via STDIN (never argv), `password_hash()`, duplicate-email refusal, min 8 chars. No credentials in repo/seed/guide |
| Throttle | same as login endpoint | Per-session: 5 failed attempts → 429 `Too many attempts…` for 60s (applies before credential checks). Dev-safe mitigation only — **distributed rate limiting remains a production item** |

**Session fields used (nothing else):** `admin_id` (int), `admin_name` (string), `admin_login_attempts`, `admin_login_last`. No password/hash/profile data in the session. Transport = existing HttpOnly/SameSite=Lax cookie via `nova_session()`.

**Password storage:** `admin_users.password_hash` = `password_hash(..., PASSWORD_DEFAULT)` bcrypt (`$2y$`, 60 chars), verified via `password_verify()`. Never MD5/SHA1/plaintext.

**Development admin setup (documented procedure):**
```
C:/xampp/php/php.exe scripts/create_admin.php "Full Name" "admin@example.com" < password-file
```
(password piped via STDIN; generated per machine, never committed). Remove `scripts/create_admin.php` before deployment per policy. Login at `http://localhost/nova-home/nova-home/admin/login.php`.

**Future (NOT implemented):** RBAC/roles, password reset, audit log, rate limiting beyond the per-session counter, order/settings admin pages.

### Admin Management Architecture (Phase 6, verified 2026-10-06)

**Shared layout partials** (no duplicated sidebar): `includes/admin-head.php` (doctype→head→`.admin-shell`→sidebar with `aria-current` + embedded logout CSRF token; expects `$adminTitle`, `$adminNav`) and `includes/admin-foot.php` (closes shell, Bootstrap, shared server-side logout fetch handler). Admin PHP pages load **no storefront JS** (server-rendered; avoids `main.js` demo-preview id collisions).

| Page | Role |
| :--- | :--- |
| `admin/index.php` | Protected dashboard: **live counts** (products, categories, total orders, pending orders from `COUNT(*)`), recent real orders (last 5 from `orders`), "Top sellers" remains labeled `(demo)` (no sales model); fake revenue/low-stock analytics removed rather than invented |
| `admin/categories.php` | List (LEFT JOIN product counts), create, edit (`?form=<id>`), guarded delete. **Schema has no `active` column — all categories are live; none added** |
| `admin/products.php` | Server-side list with validated GET filters: `q` (name/slug LIKE, ≤60ch), `cat` (slug), `status` (all/active/inactive), `sort` (**whitelist**: name/price_asc/price_desc/new); per-row **Activate/Deactivate** toggle (POST). **No product deletion** (deactivation is the lifecycle; `order_items` keep `SET NULL` + snapshots) |
| `admin/product-form.php` | Create + edit (`?id=<slug>`, legacy-link compatible): fields name/slug/category(FK select)/price/old_price/rating/reviews/is_new/is_best/description/active + **spec repeater** (`spec_key[]`/`spec_value[]`, row order = `sort_order`, ≤20) + **image repeater** (`image_path[]`/`alt_text[]`, ≤9, first row primary) |

**Transaction (Step 17):** validate everything first → `BEGIN` → product INSERT/UPDATE → delete+insert specs → delete+insert images → `COMMIT`; any failure → `ROLLBACK` + friendly message (`23000` → "Slug already exists…", else "Unable to save product." + `error_log()`). Verified with a temporary probe trigger: a spec insert failure rolled back the already-executed product UPDATE (price/desc/specs all unchanged after a mid-transaction failure).

**Validation rules:** name req (≤160 product/≤100 category); slug `v_slug` req + unique (23000 handled; **slug edits allowed but warned** — storefront links/cart/wishlist store product slugs); category_id must exist in `categories`; price int 1–100,000,000; old_price optional int; rating float 0–5; reviews int 0–1,000,000; description req (≤5000); spec pairs both-non-empty (≤80/≤255); image paths via **`v_image_path()`** — allows relative paths under `assets/images/` with approved extensions (`.webp`, `.jpg`, `.jpeg`, `.png`, `.svg`), resolves via `realpath()`, enforces strict directory containment (rejects `../` traversal, absolute system paths, remote URLs, null bytes); image alt ≤200.

**Category deletion policy:** delete button only rendered for **empty** categories; server double-checks `COUNT(products)` → `?err=has_products` if non-empty (FK `ON DELETE RESTRICT` is the backstop). Tested: deleting `decor` (4 products) rejected; empty test category deleted.

**Mutations:** every state change is **POST + `require_admin(false)` + `nova_verify_csrf()`**; success → PRG redirect (`?ok=`/`?err=` flash); CSRF failure → `?err=csrf`; unauthenticated → 302 login **before any handler runs** (verified: forged anonymous POST cannot mutate). Redirects use root-relative `admin/...` paths via `nova_url()` (admin pages must prefix `admin/`).

**Old routes:** `admin/index.html`, `products.html`, `categories.html`, `product-form.html` (and earlier `login.html`) are redirect stubs → their `.php` equivalents (`product-form.html` preserves `?id=` query). **Static demos kept:** `orders.html`, `order.html`, `settings.html` (no DB-backed data; sidebar marks them "soon").

**Not implemented (by design):** product hard-delete UI, image upload (paths reference existing assets), order/settings CRUD, RBAC.

### Orders & Settings Management (Phase 7, verified 2026-10-12)

| Page | Behavior |
| :--- | :--- |
| `admin/orders.php` | Real list from `orders` (ref → detail, customer, phone, city, date, item count via scalar subquery, total, payment, status badge, mobile cards mirroring the old demo layout). **GET filters:** `q` (ref/customer LIKE ≤60ch), `status` (whitelist: all + 5 enum values), `sort` (newest/oldest whitelist). Plain listing — no pagination (Step 5: tiny dataset) |
| `admin/order.php` | `?ref=` lookup (format-validated; safe distinct messages for malformed vs nonexistent). Customer block (name/phone/email/city/address/notes), order block (payment/status/ref/timestamps), financials (server-recorded subtotal/delivery/total, labeled historical), **items from `order_items` snapshots** (product_name/unit_price/quantity/line_total authoritative; `LEFT JOIN products` supplies only a cosmetic thumbnail). Status form shows only valid next states; terminal states show a note, no form |
| `admin/settings.php` | Edits exactly the 6 supported keys (`business_name`, `phone`, `email`, `address`, `delivery_fee`, `free_delivery_threshold`). **Key whitelist enforced server-side** — unknown submitted keys → `?err=invalid_key`, nothing written. Save = one transaction of `INSERT … ON DUPLICATE KEY UPDATE` (handles the UNIQUE `settings.key`; exactly one row per key verified). Integer money only |

**Status transitions implemented (server whitelist, independent of the `<select>`):**
`pending → confirmed|cancelled` · `confirmed → shipped|cancelled` · `shipped → delivered` · `delivered`/`cancelled` = **terminal** (no options rendered, POST rejected). `shipped → cancelled` intentionally NOT allowed (COD refusal handling is future scope). Update touches **only `orders.status`** — financials/customer/items never editable (verified: order 1 went pending→confirmed→shipped→delivered with subtotal/fee/total and all item snapshots byte-identical). Cancellation = status only, no deletions.

**Settings source of truth:** write side = admin page (validated, CSRF, PRG); read side unchanged = `nova_setting()` consumed by `api/orders.php`. **Integration-proven:** with fee=77/threshold=100 a real checkout stored `0` delivery; with threshold=5000 a real checkout stored `77` fee (420+77=497) — while the frontend's static constants still displayed 60. Settings restored to **60/1500** afterwards; historical orders 1–5 kept their original totals (settings affect new orders only).

**Public consumers — live vs static (honest status):**
- **Live (DB):** `api/orders.php` delivery pricing (fee + threshold), admin dashboard count/order rows, `includes/header.php` threshold text (partial — not yet included by any page)
- **Static (frontend constants, unchanged this phase):** the entire JS storefront (`NOVA.DELIVERY_FEE`/`FREE_DELIVERY_OVER` in `js/products.js`, cart progress, PDP estimator, checkout summary display) and `includes/footer.php` contact block (phone/email/address hardcoded). Migrating storefront display text to settings is later-phase storefront work — **not claimed as live**
- No settings history/audit log, no password fields, no config-file editor (per spec)

**Mutations:** POST + `require_admin(false)` + `nova_verify_csrf()` + prepared statements + PRG flashes (`?ok=status`, `?ok=saved`, `?err=csrf|invalid_status|not_found|invalid_key|…`). No new API endpoints (plain PHP forms per Step 23). Dashboard "View all" → `orders.php`; sidebar Orders/Settings now point at the real pages (soon badges removed — implemented).

### Admin Portal Visual Redesign (2026-10-17, verified)

Complete visual redesign of all administrative pages into a professional, cohesive e-commerce management interface matching NOVA Home's warm, sophisticated brand identity.

**Shared layout partials redesigned:**

| Component | Implementation |
| :--- | :--- |
| `includes/admin-head.php` | Full responsive admin shell: offcanvas mobile drawer (`#adminNavDrawer`) with brand + avatar + nav + sign-out; desktop sticky sidebar (`.admin-side--desktop`) with brand logo + badge + user card (initials avatar from session name) + icon nav with `aria-current` + divider + storefront link + sign-out; shared topbar (`.admin-topbar`) with mobile hamburger toggle, breadcrumb-style section title, storefront link, signed-in identity, and sign-out button |
| `includes/admin-foot.php` | Closes `.admin-main-col` / `.admin-shell` / container; unified `.admin-logout-btn` click handler (POST with CSRF token → `login.php` fallback) applied to all logout buttons across topbar, sidebar, and drawer |

**Pages redesigned:**

| Page | Key Design Changes |
| :--- | :--- |
| `admin/login.php` | Centered `.admin-login-card` with brand + shield badge + "Admin Portal" label, input groups with icon prefixes, password visibility toggle (`#toggle-pwd`), Bootstrap spinner on submit, accessible error alert, "Return to storefront" link |
| `admin/index.php` | 4 interactive `.admin-metric-card` links (Products with active count, Categories, Total Orders, Pending Orders with amber accent when >0), recent orders table (6 rows, clickable refs, date subtext), Quick Actions card (create product, add category, review pending, delivery settings), Catalog Health summary (active ratio, taxonomy, environment) |
| `admin/products.php` | `.admin-filter-bar` with search input group, category/status/sort dropdowns, Apply/Reset buttons; product table with `.admin-prod-thumb` thumbnails, monospace slug, category badges, star rating with review count, New/Best subtle badges, Active/Inactive status with icons, Edit/Deactivate or Activate action buttons; empty state with search icon; result count header |
| `admin/product-form.php` | Two-column layout: left column with 3 `.admin-card` sections (Basic Information with name/slug/category/description, Technical Specifications repeater with trash buttons, Product Photography repeater with image icon input groups); right column with Pricing & Reviews card (EGP input groups, compare-at price, rating/reviews), Publishing & Flags card (form-switch for active visibility, checkboxes for New Arrival/Bestseller), and Action Panel (submit + cancel) |
| `admin/categories.php` | Category table with inline thumbnails, monospace slug, sort order badges, linked product counts (→ `products.php?cat=`), Edit/Delete buttons; expandable add/edit form `.admin-card` with close button; deletion guard with confirm dialog |
| `admin/orders.php` | `.admin-filter-bar` with search/status/sort/Apply/Reset; desktop table with monospace refs, customer names, phone, city badges, date, item count badge, total, status badges, Details link; mobile `.admin-card` articles with structured key-value layout and full-width "View Order Details" CTA |
| `admin/order.php` | Back-to-orders breadcrumb + monospace ref + status badge header with creation timestamp; 3-column overview row (Customer Details with contact icons, Payment & Status with method/fulfillment/items/account, Recorded Financials with lock icon and "never recomputed" note); Items Snapshot table with thumbnails + "View in catalog" links; Fulfillment Workflow card with status-aware transition select and allowed-transitions documentation |
| `admin/settings.php` | Two-column layout: Business Identity card (name, phone with tel icon, email with envelope icon, address) and Delivery Pricing Rules card (EGP fee/threshold input groups, info alert about new-orders-only scope, Save button) |

**CSS additions (`css/pages.css`):**

`.admin-brand` (flex container), `.admin-brand-logo` / `.admin-brand-logo span` (serif brand with italic accent), `.text-terracotta` (accent color utility), `.admin-topbar__title` (body font breadcrumb-style, ellipsis overflow). Duplicate status badge definitions consolidated to the authoritative set (`.status--confirmed/pending/shipped/delivered/cancelled/active/inactive` with semantic colors and `font-weight: 600`).

**Session isolation hardened (`includes/admin-auth.php`):** `nova_admin_logout()` clears only admin session keys (`admin_id`, `admin_name`, `admin_login_attempts`, `admin_login_last`) and regenerates the session ID — **never destroys the full session**, preserving active customer sessions and `nova_order_ref`. `admin/logout.php` updated with safe GET fallback.

**Responsive behavior:** Desktop (≥992px): sticky 250px sidebar + main content column. Mobile (<992px): sidebar hidden, hamburger toggle in topbar opens Bootstrap offcanvas drawer. All 5 admin pages verified at 390px, 768px, 1024px, and 1366px with **0 horizontal page overflow**.

**Testing (54 assertions, all passed, 0 JS errors):** Login page (title, password toggle show/hide, invalid credentials error, valid login redirect); Dashboard (title, topbar user name, 4 metric cards, recent orders visibility and row count); Products (filter bar, 14 product rows, thumbnail, "vase" search filter); Product Form (edit form loaded, prefilled name "Sahara Ceramic Vase", 3 spec rows, 1 image row); Categories (5 rows, thumbnail, add form); Orders (16 rows, order detail ref/customer/financials/items); Settings (prefilled business_name, delivery_fee); Responsive (20 overflow checks across 4 viewports × 5 pages, mobile hamburger toggle, offcanvas drawer opened); Sign Out (redirect to login, dashboard blocked after logout, Customer 12 "Youssef Mohammed Hassan" intact in MySQL). Test script removed after passing.

**Database integrity verified:** 1 admin user (`admin@novahome.eg`, id=1), 1 customer (`Youssef Mohammed Hassan`, id=12), 16 orders, 14 products, 5 categories, 42 specs, 42 images, 6 settings — all unchanged.

### Storefront Settings Integration (Phase 8, verified 2026-10-14)

**Architecture:** admin settings → `settings` table → **`GET api/store-settings.php`** (public, read-only) → **`js/settings.js`** (one fetch, validated, syncs runtime constants) → existing storefront JS → consistent UI. DB stays the source of truth; `api/orders.php` remains authoritative for all order pricing.

| Piece | Behavior |
| :--- | :--- |
| `api/store-settings.php` | **GET only** (non-GET → 405). **Mandatory allowlist** of exactly six public keys (`business_name`, `phone`, `email`, `address` as strings; `delivery_fee`, `free_delivery_threshold` as **integers**) read via `nova_setting()`; junk query params ignored; `Cache-Control: no-store` so admin edits appear on the next page load; safe 500 + `error_log()` on faults; returns no HTML/currency strings/internals |
| `js/settings.js` (new, loaded on all 14 storefront pages after `products.js`) | Mirrors the `catalog.js` pattern: immediate single fetch (`cache: 'no-store'`), type-validates all six fields before accepting any, stores in `NOVA.storeSettings` (`{loaded, error, data}`), then **the single controlled sync point**: `NOVA.DELIVERY_FEE = fee; NOVA.FREE_DELIVERY_OVER = threshold`; dispatches `settings:ready` (or `settings:error`). On failure the `products.js` fallback constants stand (display-only fallback, clearly not "loaded") and the page keeps working; a later load recovers |
| `js/ui.js` (`applyStoreSettings()` + one-time hook in `mount()`) | Covers both load orderings (already loaded → apply now; else `settings:ready` with `{once:true}` — no duplicate listeners, no re-render loops). Patches: announcement bar (shared `announcementText()` wording, configured threshold), `data-delivery-note`/`data-delivery-info`, footer contact (`data-nova-tel/email/address/business` hooks added to `footer()`; **link targets validated before writing `tel:`/`mailto:` hrefs**, `textContent` used — no unsafe concatenation), then dispatches **one** `cart:change` so every computation-based consumer (cart summary, checkout summary, free-delivery progress, PDP estimator — all already listening) refreshes from the synced constants |

**Synced UI (all verified live with temporary values, then restored):** announcement "Free delivery over EGP X…" · footer tel/mailto/address/copyright business name · PDP estimator fee + `data-delivery-info` (city list + ETA unchanged, "(demo estimate)" kept) · cart summary + progress (`threshold>0` guard pre-existing; zero-threshold safe) · checkout summary. Client values are display estimates only — order POST still sends only `{slug, qty}`.

**Delivery rule consistency:** UI `subtotal >= threshold → free else fee` matches `api/orders.php` exactly — proven across **below** (fee 77 UI+order), **exactly-at** (Free/0), and **above** (Free/0) threshold cases with changed settings; fake client `price/subtotal/delivery_fee/total` ignored by the server. Settings restored to originals (60/1500 + original contacts) and verified in MySQL; historical orders' totals never recalculated.

**Still static (honest scope):** the PHP storefront partials `includes/footer.php` (contact block) and parts of `includes/header.php` are **not included by any page yet** — untouched this phase; `account/login.html`/`register.html` demo forms and the header brand "NOVA Home" wordmark remain static identity markup. No schema change; no localStorage settings; no second settings store.

### Customer Accounts (Phase 9, verified 2026-10-15)

**Schema + migration:** pre-migration backup `database/backups/nova_home-pre-phase9-20261014.sql` (mysqldump). Upgrade script `database/migrations/001_customer_accounts.sql` adds `customers` (id, name, email **UNIQUE**, `password_hash`, phone, active, timestamps), `customer_addresses` (FK → customers **CASCADE**, label, recipient_name, phone, city, address, apartment, is_default), and `orders.customer_id` (nullable, `ON DELETE SET NULL`, `idx_orders_customer`) via guarded `information_schema` ALTER (re-runnable). `database/schema.sql` updated so fresh installs create the customer tables **before** orders. Historical orders remain `customer_id = NULL` — never back-filled by email/phone match. Applied + verified live: 11 orders/14 items preserved.

**Auth architecture (`includes/customer-auth.php`):** mirror of admin-auth but fully separate. Session fields: `nova_customer_id`, `nova_customer_name` (+ `cust_login_attempts`/`cust_login_last` throttle). `nova_customer_user()` re-checks MySQL (inactive/removed → stale state cleared), `nova_customer_login()` regenerates the session ID then stores identity, `nova_customer_logout()` clears **only** customer fields + regenerates the ID (harness-verified: `nova_order_ref` and admin state survive). `require_customer($api)` — pages 302 → `account/login.php`, APIs 401 JSON. No admin/customer namespace crossover.

| Endpoint | Behavior |
| :--- | :--- |
| `POST api/customer-register.php` | name(req≤120)/email(`v_email`, trim+**lowercase**)/phone(`v_phone_eg`)/password(≥8)+confirm; bcrypt; duplicate → `409` safe message (DB UNIQUE, case-normalized); success → login session + `{name, redirect}` |
| `POST api/customer-login.php` | generic `401 Invalid email or password.` for unknown/wrong/inactive (dummy `password_verify` equalizes timing); throttle 5 fails/60s per session → 429 (checked before verification); CSRF; GET → 405 |
| `POST api/customer-logout.php` | CSRF; clears customer state only; GET → 405 |
| `GET/POST api/customer-profile.php` | `require_customer`; GET → own {name,email,phone}; POST updates name+phone **WHERE id = session customer** — any submitted `customer_id`/`id` ignored (tested); email read-only |
| `GET/POST api/customer-addresses.php` | GET own list (default first); POST `action=create\|update\|delete\|default`; every mutation `WHERE id AND customer_id` (cross-customer → uniform 404); ≤10 per account; default swaps transactional; deleting the default promotes the oldest remaining; city via shared `v_city()`/`nova_cities()` |

**Pages:** `account/login.php`, `register.php` (guest-only; authed → redirect to dashboard), `index.php` (dashboard: profile summary), `profile.php` (edit name/phone; email readonly with explainer), `addresses.php` (server-rendered own list + add/edit form + default/delete buttons; empty state) — all reuse the demo `auth-card`/`account-layout` design; shared sidebar partial `includes/account-side.php` (Orders badged "soon" = Phase 10). Old `login/register/index/profile/addresses.html` → redirect stubs; `wishlist.html` (real localStorage) and `orders.html`/`order.html` (static demo) unchanged. Header account icon already routes through `account/index.html` → stub → real page.

**Checkout integration:** `api/orders.php` resolves `nova_customer_user()` at order time → `orders.customer_id` (guest NULL). Browser-supplied `customer_id` ignored (tested: payload `9999` → stored session id; later verified). Phase 4 `nova_order_ref` binding + success-page auth unchanged. `js/main.js checkout()` prefills name/phone + default address (city matched by display text) via `customer-profile`/`customer-addresses` GETs; 401/failure silently keeps the guest flow; submission unchanged. *(2026-10-17 update: guest checkout removed — `api/orders.php` now 401s unauthenticated POSTs and `customer_id` is always the session customer; see §16.)*

**Passwords:** bcrypt (`PASSWORD_DEFAULT`, `$2y$`, 60 chars, verified; 0 plaintext rows). Never logged/stored outside the DB. **Throttling:** session-scoped 5/60s (tested: `401×5 → 429`, valid creds also 429 during lockout) — NOT distributed/production-grade.

**Deferred (honest):** customer order history + UI (Phase 10 — relationship table exists), password reset, email verification, guest-order claiming by email match, account deletion, per-IP rate limiting. **Test-data policy:** dev accounts created via the real registration flow, then deliberately deleted (addresses CASCADE, order `customer_id` → NULL via FK; orders/snapshots preserved — final DB: 0 customers, 13 orders, 16 items).

### Customer Order History (Phase 10, verified 2026-10-16)

| Route | Behavior |
| :--- | :--- |
| `account/orders.php` | `require_customer(false)`; **ownership inside SQL** — `WHERE o.customer_id = :me` (session id from `nova_customer_user()` DB re-check), `ORDER BY created_at DESC, id DESC`, scalar item-count subquery; renders the existing `.table-card` table (ref/date/items/total/status/View) newest-first; **empty state** ("No orders yet" + Start shopping) when the customer has no linked orders; no pagination (small dataset) |
| `account/order.php?ref=` | Reference format validated (`NH-YYYYMMDD-XXXXXX`); **single query `WHERE order_ref = :ref AND customer_id = :me LIMIT 1`** — ownership never fetched-then-filtered; items via `order_items` snapshots (LEFT JOIN products only for a cosmetic thumbnail); totals/city/address/name/date/status straight from the `orders` row (**never recalculated**); read-only |
| Not-found policy | Missing ref, malformed ref, nonexistent ref, **another customer's order**, and **guest orders** all render safe states with **identical wording** for valid-format-but-unowned (`Order not found / does not belong to your account`) — existence never disclosed. Invalid/missing → `That is not a valid order reference` |
| Navigation | `includes/account-side.php` Orders → `orders.php` with `aria-current`, **"soon" badge removed**; legacy `account/orders.html` → stub, `account/order.html` → stub **preserving `?ref=`** |

**Authorization model:** server-side session identity only — no customer id/email/ref parameter can grant access (`?customer_id=15` tamper test: page still returned only the caller's orders). Unauthenticated and post-logout visits → `302 account/login.php` with no private data. Admin auth, Phase 4 guest `nova_order_ref` success-page flow, and guest `customer_id = NULL` orders all untouched (regression-checked). No customer cancel/refund/status-change endpoint exists.

**Tests (direct + focused browser, no site-wide sweep):** A/B list isolation; own detail fields matched MySQL (890/60/950, snapshots); identical safe-not-found for other-customer/fabricated/guest refs; invalid+missing ref; unauth 302 (both pages); `?customer_id=` tamper; post-logout 302; browser: sidebar nav → list → detail → unauthorized → logout → empty state (fresh customer), **0 console / 0 network errors** on tested routes; Phase 4 anonymous API still 404 + success page loads. **Cleanup:** the three temporary customers deleted; orders 14/15 `customer_id` → NULL via FK with totals/snapshots byte-intact; final DB 0 customers / 0 addresses / **15 orders / 18 items** / catalog 5/14/42/42 / settings 6 / admin 1; no test emails/passwords in any repo file.

---

## 14. Product Data Model

**Source (Phase 2+):** MySQL `nova_home.products` via `api/products.php` / `api/product.php`, loaded into `NOVA.products` by `js/catalog.js` (14 products, verified). `js/products.js` holds only frontend constants.

```js
{
  id:      "sahara-vase",          // string: URL-safe slug, unique, primary key
  name:    "Sahara Ceramic Vase",  // string: display name
  cat:     "decor",                // string: must be a key in NOVA.categories
  price:   890,                    // number: current price in EGP (integer)
  old:     1100,                   // number (optional): original price — drives discount badge
  rating:  4.7,                    // number: 0–5
  reviews: 38,                     // number: review count (integer)
  best:    true,                   // boolean (optional): bestseller flag — used in Swiper
  isNew:   true,                   // boolean (optional): new-arrival flag — used in badge
  desc:    "...",                  // string: product description (one paragraph)
  specs:   [["Material", "Glazed ceramic"], ["Height", "32 cm"], ...]  // [key, value][]
}
```

**5 Categories:**

| ID | Display name |
| :--- | :--- |
| `decor` | Decor |
| `lighting` | Lighting |
| `kitchen` | Kitchen |
| `storage` | Storage |
| `furniture` | Furniture |

**14 Products (current):**

| ID | Name | Category | Price (EGP) |
| :--- | :--- | :--- | :--- |
| `sahara-vase` | Sahara Ceramic Vase | decor | 890 |
| `luna-floor-lamp` | Luna Arc Floor Lamp | lighting | 2,450 |
| `olive-serving-board` | Olive Wood Serving Board | kitchen | 480 |
| `nile-basket-set` | Nile Woven Basket Set | storage | 720 |
| `halo-mirror` | Halo Round Wall Mirror | decor | 1,650 |
| `dune-table-lamp` | Dune Bedside Table Lamp | lighting | 990 |
| `terra-mug-set` | Terra Stoneware Mug Set | kitchen | 540 |
| `aswan-side-table` | Aswan Oak Side Table | furniture | 2,900 |
| `cairo-boucle-chair` | Cairo Boucle Accent Chair | furniture | 6,800 |
| `stack-shelf` | Stack Modular Shelf | storage | 3,200 |
| `pillar-candles` | Pillar Soy Candle Trio | decor | 420 |
| `oasis-pendant` | Oasis Pendant Light | lighting | 1,850 |
| `copper-rack` | Copper Utensil Rack | kitchen | 610 |
| `minimal-clock` | Minimal Wall Clock | decor | 560 |

**Image naming convention:**  
For product `{id}`, the three gallery images are:
```
assets/images/{id}.svg        → main image
assets/images/{id}-2.svg      → alternate image 1
assets/images/{id}-3.svg      → alternate image 2
```
Currently all are SVG placeholders. The backend should replace filename assumptions with database-driven image records that store real URLs/paths.

---

## 15. Cart Data Model

**localStorage key:** `nova_cart`

```js
// Array of line objects
[
  { "id": "sahara-vase", "qty": 2 },
  { "id": "luna-floor-lamp", "qty": 1 }
]
```

- `id` is the product ID — must exist in `NOVA.products`
- `qty` is an integer, clamped to 1–10
- **Price is never stored in the cart.** It is always resolved live from `NOVA.products` via `NOVA.find(id).price`
- Unknown IDs are silently discarded on every read
- Totals (subtotal, delivery, total) are calculated client-side

> [!CAUTION]
> **This client-side pricing is ONLY valid for the current static demo.**  
> In the backend, **NEVER trust client-submitted prices or totals**. Recalculate all prices server-side from the database before accepting or persisting any order.

---

## 16. Order Data Model

### Live order flow (✅ Phase 3; guest path removed 2026-10-17 — authenticated only)

**Storage:** `orders` + `order_items` tables in `nova_home` (schema from Phase 1, unchanged).

**Authentication requirement (2026-10-17):** `api/orders.php` requires an active customer session (`nova_customer_user()`), checked immediately after the method guard and BEFORE any body parsing or database work. Unauthenticated POSTs receive `401 {"code":"auth_required"}`; no `orders`/`order_items` row is created and the client cart is never cleared by a rejected submission. The customer identity written to `orders.customer_id` comes exclusively from the re-checked server-side session — client-submitted ids are never read. Admin sessions do NOT satisfy this gate (separate session model). Historical guest rows (`customer_id NULL`) remain intact; the schema keeps the column nullable for them. Frontend: the cart CTA and `checkout.html` redirect signed-out visitors to `account/login.php?return=checkout` (whitelisted return — exact literal only, no open redirect); a session expiring mid-submit surfaces as a `401` that returns to the login flow with the cart intact.

**Flow:** localStorage cart → `checkout.html` (customer session required) → `GET api/csrf.php` (session token) → `POST api/orders.php` → server validation/pricing → transaction (`orders` row + `order_items` rows) → commit → **session binds `$_SESSION['nova_order_ref']`** → cart cleared → `order-success.html?ref=...` → **`GET api/order.php?ref=...` (session-authorized) → MySQL → authoritative render** (Phase 4).

**Order retrieval authorization (Phase 4):** the URL ref is display/navigation only. `api/order.php` returns the order **iff** `hash_equals($_SESSION['nova_order_ref'], ref)` — the ref was bound server-side at checkout and lives only in the PHP session (HttpOnly cookie; never in localStorage/sessionStorage/query/HTML). Knowing/guessing a ref exposes nothing: wrong-session, expired-session, nonexistent and unowned refs all return an **identical `404 {"error":"Order not found."}`** so existence never leaks. Malformed/missing refs → `400`; non-GET → `405`; server faults → `500` generic. Response exposes only success-page fields: `order_ref, customer_name, city, address, subtotal, delivery_fee, total, items[{product_name, unit_price, quantity, line_total, slug}]` — no phone/email/notes/status; monetary values are raw ints (frontend formats via `NOVA.fmt`). Items load by the authorized order's DB id (`ORDER BY id`), snapshot columns only, with a cosmetic `LEFT JOIN products.slug` for the summary thumbnail (null-safe fallback). Session holds only the ref (minimal, overwritten by the latest checkout).

**Order reference:** `NH-YYYYMMDD-XXXXXX` (6 random hex chars), generated server-side, retried up to 5× on `uq_orders_ref` (23000) collisions.

**Pricing (server-side only — client money never trusted):**
- `subtotal` = Σ (DB `products.price` × qty), products resolved in one batched `IN (...)` query, `active = 1` only
- `delivery_fee` = 0 when `subtotal >= nova_setting('free_delivery_threshold')` (1500), else `nova_setting('delivery_fee')` (60)
- `total` = `subtotal + delivery_fee`
- Fake client `price`/`subtotal`/`delivery_fee`/`total` fields are ignored (verified by test)

**Order item snapshots:** `product_id`, `product_name`, `unit_price`, `quantity`, `line_total` copied/calculated at order time — historical accuracy survives product edits.

**Validation:** name required; phone (`v_phone_eg`); email optional (`v_email`); city must match `nova_cities()` controlled list (Cairo/Giza/Alexandria/Mansoura/Tanta/Fayoum/Other/Other Egypt); address required (apartment merged); `payment_method` must be `cod` (400 otherwise); items: slug format, qty integer 1–10, duplicates aggregated then re-capped (6+5 → 400), empty cart → 400; `csrf_token` verified via `hash_equals`.

**Status:** `pending` on insert (admin management = later phase).

**Client snapshot:** `sessionStorage.nova_last_order` still written for display only, now carries `server: true` + the returned `order_ref`/totals; the success page's demo note hides for server-confirmed orders. DB remains authoritative.

**Duplicate handling:** cart/API normalise duplicate slugs into one aggregated quantity; aggregation may not exceed the 1–10 cap (aggregating 6+5 is rejected, not clamped).

**Rollback:** any failure after `beginTransaction()` rolls back (verified: mixed valid+invalid product cart → 400, order count unchanged, 0 orphan `order_items`).

### Legacy demo snapshot shape (pre-Phase 3, still tolerated for display)

```js
{ ref, items: [{id, qty, name, price}], subtotal, delivery, total, name, city, address, at }
```
Lacking `server: true`, it renders with the explanatory demo note.

---

## 17. CSS Architecture

Five files, loaded in this order:

| File | Responsibility |
| :--- | :--- |
| `variables.css` | All design tokens: colours, fonts, radius, shadows, spacing, easing. **The only file to edit for brand-level changes.** |
| `base.css` | Bootstrap variable overrides, typography scale, button variants (`.btn-nova`, `.btn-ghost`), form controls, focus styles, skip link, entrance animations (`[data-reveal]`, hero) |
| `components.css` | Shared components used across multiple pages: site header, announcement bar, footer, product card, wishlist button, quick-view button, Quick View modal, delivery progress bar, category card, cart badge, cart item, admin shell, account layout, sticky mobile CTA, search panel |
| `pages.css` | Page-specific styles: hero, promo, benefits, Shop the Look, shop layout and filters, product detail gallery, PDP price/stock/specs, cart page, checkout, order success, account pages, admin pages, breadcrumb |
| `responsive.css` | Breakpoint overrides. Mobile-first base lives in the other files; this file adjusts for larger screens and corrects edge cases at small sizes. |

Key rule: **brand tokens in `variables.css` only**. Component layout in `components.css`. Page-specific rules in `pages.css`. Breakpoint corrections in `responsive.css`.

---

## 18. Responsive Design Rules

### Tested Viewports

| Width | Represents |
| :--- | :--- |
| 390px | iPhone 14 / common small mobile |
| 430px | iPhone 14 Pro Max / larger mobile |
| 768px | iPad / tablet boundary |
| 1024px | Laptop / small desktop |
| 1280px | Standard desktop |
| 1366px | Common laptop screen |

### Key Bootstrap Breakpoints Used

| Breakpoint | Min-width | Notes |
| :--- | :--- | :--- |
| `sm` | 576px | Cart item two-column layout |
| `md` | 768px | Hero text stacking, promo two-column, header layout change, sticky CTA hidden |
| `lg` / `992px` | 992px | Full desktop nav visible, shop sidebar appears, account sidebar sticky, admin sidebar sticky |
| Custom | 1400px | Container max-width capped at 1280px |

### Major Responsive Behaviours

| Feature | Mobile behaviour | Desktop behaviour |
| :--- | :--- | :--- |
| **Header** | Hamburger + offcanvas drawer | Full horizontal nav bar |
| **Product grid** | 2 columns (`col-6`) | 3 columns on shop, 4 columns elsewhere |
| **Shop filters** | Offcanvas sidebar | Sticky left column (250px) |
| **Account sidebar** | Stacks above content | Sticky left column (248px) |
| **Admin sidebar** | Stacks above content | Sticky left column (240px) |
| **Quick View** | Full-width modal | Centred `modal-lg` with media+info side-by-side |
| **Sticky mobile CTA** | Visible (after scroll past main CTA) | Always hidden (`d-md-none`) |
| **Shop the Look** | Stacked scene + list | Side-by-side 1.6fr + 1fr grid |
| **Hero** | Art below text, full-width | Art alongside text in two columns |
| **Checkout** | Single column | Two-column (form + order summary) |

---

## 19. Animation and Motion Rules

### Philosophy
Restrained. Motion supports the UI; it does not decorate it.

- **Transform and opacity only** — no layout-shifting animations
- **No continuous decorative animations** (no looping backgrounds, no spinning icons)
- **CSS-first** — all current animations use `transition` or `@keyframes`
- **No animation libraries** — Bootstrap, Swiper, and native CSS handle everything
- `prefers-reduced-motion` must be respected for all interactive motion

### Current Interactive Motion

| Feature | Animation |
| :--- | :--- |
| Section reveal | `[data-reveal]` → `translateY(16px)` → `none`, triggered by IntersectionObserver |
| Hero entrance | Text children stagger in on `body.is-ready` (set after `mount()`) |
| Product card hover | `translateY(-4px)` + shadow deepens |
| Wishlist button | `.is-beat` class — scale pulse via `@keyframes beat` |
| Cart badge | `.is-pop` class — scale bounce |
| Quick View image swap | `.is-swap` → fade crossfade via `opacity` |
| Sticky CTA | Slides up via `translateY(100%)` → `translateY(0)` on `is-visible` |
| Shop the Look hotspot | `scale(1.12)` on hover/focus; tooltip fades in |
| Gallery thumb swap | `.is-swap` fade on main image |
| Search panel | CSS visibility/opacity transition on `[hidden]` removal |
| Reduced motion | `responsive.css` and `pages.css` include `@media (prefers-reduced-motion: reduce)` overrides |

---

## 20. Accessibility Rules

Current standards — future features must preserve or improve upon these.

| Rule | Implementation |
| :--- | :--- |
| Semantic HTML | `<header>`, `<nav>`, `<main>`, `<footer>`, `<article>`, `<section>`, `<form>`, `<fieldset>`, `<legend>` |
| Visible focus states | `2px solid var(--c-accent)` via `:focus-visible` in `base.css` |
| Skip link | `.skip-link` targets `#main` on every page |
| Heading hierarchy | Single `<h1>` per page; `<h2>` for sections; `<h3>` for cards (inside sections). Checked in audit. |
| Meaningful `aria-label` | All icon buttons, cart badge, modal closes, gallery thumbs |
| `aria-pressed` | Wishlist buttons, admin status filter buttons |
| `aria-expanded` | Search input when suggestions panel is open |
| `aria-current` | Active nav link (`aria-current="page"`), active gallery thumb |
| `aria-live` | Cart badge count, toast container, Quick View qty output |
| ARIA progressbar | Free delivery progress bar (`role="progressbar"`, `aria-valuenow`, `aria-valuetext`) |
| Accessible modal | Bootstrap modal with labelled title, focus management, keyboard close |
| Reduced motion | All `transition`-based animations respect `prefers-reduced-motion: reduce` |
| Labelled forms | All inputs have associated `<label>` or `aria-label` |
| Image alt text | All meaningful images have descriptive alt text; decorative hover images have `alt=""` and `aria-hidden="true"` |
| Lighthouse score | **100 / 100 Accessibility** (verified in final audit) |

---

## 21. Performance Rules

### Philosophy
Minimal dependencies, lazy loading, no unnecessary network requests.

### Current Practices

- Images use `width` and `height` attributes to prevent layout shift
- All below-the-fold images use `loading="lazy"`
- Swiper is only initialised on the homepage — no library overhead on other pages
- No continuous animation loops; all motion is event-driven
- Cart and wishlist state is cached in `Set` objects within single render passes (no repeated localStorage reads per card)
- `IntersectionObserver` for reveal animation — no scroll listener polling
- Sticky CTA uses `IntersectionObserver` primary + passive scroll listener fallback

### Lighthouse Result
A Lighthouse run was performed under **local development conditions** (simulated mobile throttling).

> **Score: 100 / 100 Performance** — local development audit result only.  
> This should not be treated as a production benchmark. Production performance depends on real image file sizes, CDN behaviour, and server response times.

---

## 22. Security Rules

### Current Frontend Limitations (acceptable for demo)

- Product catalogue is trusted static data (`NOVA.products`) — no external input
- `localStorage` and `sessionStorage` are **untrusted client state** — all reads are validated before use
- `innerHTML` is used for rendering HTML strings, acceptable only because all rendered content comes from the trusted static catalogue — no user-generated content reaches `innerHTML`

### Backend Phase 1 — Implemented Foundations (✅ verified 2026-10-05)

| Foundation | Where | Notes |
| :--- | :--- | :--- |
| PDO prepared-statement contract | `config/database.php` (`EMULATE_PREPARES=false`) | Only query style allowed; no mysqli anywhere |
| Output escaping helper | `includes/functions.php` → `e()`; used in `header.php`/`footer.php` | `htmlspecialchars(ENT_QUOTES | ENT_SUBSTITUTE, UTF-8)` |
| Secure session defaults | `includes/bootstrap.php` → `nova_session()` (lazy) | HttpOnly, SameSite=Lax, Secure-when-HTTPS; no session started unless needed |
| No plaintext passwords | `admin_users.password_hash` column; 0 rows seeded | Dev-account process deferred to auth phase; never commit secrets |
| Secrets out of Git | `config/config.php` git-ignored; `.gitignore` excludes DB backups, logs, `node_modules/`, test artifacts | Only `config.example.php` tracked (with `demo_access => false` and `public_demo_access => false`); the project is now a Git repository (initialized 2026-10-17, no commits made during preparation) |
| CSRF foundation | `nova_csrf_token()` / `nova_csrf_field()` / `nova_verify_csrf()` | Implemented, not yet wired to forms (no POST forms exist in Phase 1) |

### Future Backend Security Requirements (planned — mandatory, still open)

> [!CAUTION]
> These are hard requirements for any backend implementation. Shortcuts here create real security vulnerabilities.

| Requirement | Details |
| :--- | :--- |
| **PDO prepared statements** | All database queries must use parameterised prepared statements. No string interpolation into SQL. |
| **Server-side validation** | Validate all user input server-side — do not trust HTML5 validation alone |
| **Server-side pricing** | Recalculate all prices and totals from the database on the server. Never trust client-submitted prices. |
| **Server-side stock checks** | Check stock before accepting or confirming any order |
| **Output escaping** | `htmlspecialchars()` for all database values rendered into HTML |
| **CSRF protection** | CSRF tokens on all state-changing forms |
| **Secure sessions** | `session_regenerate_id()` after login; `HttpOnly` and `Secure` cookie flags |
| **Authorization** | Admin routes must verify admin role server-side — never trust client-side role indicators |
| **Rate limiting** | Login and registration endpoints should rate-limit to prevent brute force |
| **Safe file uploads** | Validate MIME type server-side, store outside webroot, rename on upload |
| **No client total trust** | The cart total from the client request must never be stored in the database directly |
| **No secrets in frontend** | No API keys, credentials, or database details in any HTML/CSS/JS file |

---

## 23. QA and Testing

### Current Tools

| Tool | Used for |
| :--- | :--- |
| `node --check` | JavaScript syntax validation |
| Playwright | Functional flows, responsive checks, state persistence, storage resilience, keyboard interaction, screenshot capture |
| Lighthouse | Accessibility, performance, best practices, SEO scores |

### What Has Been Tested with Playwright

- All 24 URLs — no 404s, no console errors, no network errors
- Cart CRUD: add, increment, decrement, remove, clear, subtotal, delivery, total
- Checkout → order success full flow including snapshot rendering
- Order success: 9 hostile sessionStorage permutations (null, malformed JSON, number, string, object without items, null items, object items, valid array)
- Sticky CTA: hidden at load (`scrollY=0`), visible after scroll past, hidden on scroll back, hidden at desktop viewports, quantity sync
- Free delivery typography: stacked heading and subtext at 390px and 1280px
- Admin layout: sibling columns and unclipped table at 390, 768, 1024, 1280
- Wishlist/Quick View sync
- Wishlist/Account wishlist sync
- Delivery estimator/Checkout city sync
- Recently viewed homepage rendering
- Keyboard navigation of search suggestions
- Lighthouse accessibility, performance, best practices, SEO

### Testing Policy for Future Work

- Any major new feature should receive targeted browser verification before being marked complete
- Regression checks should verify that the affected page's existing workflows still pass
- A full audit is not required after every small change — run a targeted check on the affected feature set
- `node --check` should be run on all JS files after any JS edit

---

## 24. Completed Audit Findings

The following issues were identified in the final full-project audit and have been **resolved**.

| Issue | File | Resolution | Status |
| :--- | :--- | :--- | :--- |
| `.col-lg-7` not closed before `.col-lg-5` in admin dashboard — Recent Orders table clipped, Top Sellers pushed into wrong container | `admin/index.html` | Added missing `</div>` to close `.admin-table-wrap` and `.col-lg-7` | ✅ Resolved |
| Sticky CTA appeared immediately on page load when primary CTA was merely below the fold (not scrolled past) | `js/main.js` | Changed observer condition to `!en.isIntersecting && en.boundingClientRect.bottom < 0` | ✅ Resolved |
| Order success would throw `TypeError` on `snap.items.map()` if sessionStorage was malformed or missing | `js/main.js` | Added full guard: non-null object check + `Array.isArray(snap.items)` before any access | ✅ Resolved |
| Free delivery unlocked text rendered as run-on: "Free delivery unlockedYour order ships free." | `js/ui.js`, `css/pages.css` | Wrapped in `.ship-progress__body` container with `.ship-progress__title` and `.ship-progress__sub` block elements | ✅ Resolved |
| Footer brand "Home" span had insufficient contrast against dark footer background (3.8:1) | `css/components.css` | Applied `color: var(--c-cream)` raising contrast to 12.3:1 | ✅ Resolved |
| Shop the Look `.look-row` had a conflicting `aria-label` override that mismatched visible content | `js/ui.js` | Removed the `aria-label` override; visible content forms the accessible name naturally | ✅ Resolved |
| Fallback "Product not found" heading was an `<h1>`, creating duplicate `<h1>` on valid PDPs | `product.html` | Changed to `<h2 class="h3">` | ✅ Resolved |
| Dead `#orderModal` Bootstrap modal markup and its event listener remained from an earlier revision | `checkout.html`, `js/main.js` | Removed markup and listener | ✅ Resolved |
| Empty `assets/icons/` directory with no contents | filesystem | Deleted | ✅ Resolved |
| Header dropdown, drawer, and footer missing category links on initial render | `js/ui.js` | Added `updateCategoryNav()` synchronized with `catalog:ready` / `catalog.ready` | ✅ Resolved |
| Product card hover blurry flicker caused by duplicate alt-image overlay on single-image products | `js/ui.js`, `css/components.css` | Only render `.product-card__img--alt` when a distinct secondary image exists; scale both smoothly on hover | ✅ Resolved |
| QuickView modal empty `src=""` generating redundant HTTP request on page load | `js/ui.js` | Initialized with lightweight inline data SVG placeholder | ✅ Resolved |
| Broken image thumbnails in `admin/products.php` due to missing directory traversal prefix | `admin/products.php` | Normalized relative path prefix to `../` | ✅ Resolved |
| Item thumbnails in `admin/order.php` and `account/order.php` hardcoded to legacy paths | `admin/order.php`, `account/order.php` | Dynamic resolution of `product_images.image_path` from database with directory boundary validation and fallback to `hero.svg` | ✅ Resolved |
| Shop search "Clear filters" triggering full page reload | `js/main.js` | Reset search, filters, and URL in-place without page reload | ✅ Resolved |
| Initial PDP load flashing hardcoded Sahara Vase SVG before JavaScript resolves product | `product.html` | Replaced initial src with neutral SVG placeholder | ✅ Resolved |
| Direct access to `order-success.html` showing fake ref or 'None' literal | `order-success.html`, `js/main.js`, `css/pages.css` | Clean informational state: ref line hidden, neutral heading, shop/order history links, no false order confirmation | ✅ Resolved |
| Customer account order detail "Shipping to" box (`.addr-card`) overlapping footer | `css/pages.css`, `account/order.php` | Removed errant `height: 100%` from `.addr-card` and added `align-items-start` to `.row` | ✅ Resolved |
| Homepage hero artwork `.hero__art` using outdated flat SVG illustration | `index.html`, `css/pages.css`, `css/responsive.css` | Redesigned with editorial layered composition using real licensed WebP photography (`cairo-boucle-chair`, `sahara-vase`), architectural arch, and refined delivery assurance chip | ✅ Resolved |
| Shop the Look section using flat SVG illustration with artificial hotspots | `index.html`, `css/pages.css`, `css/responsive.css`, `js/ui.js` | Replaced with editorial ensemble: anchor showcase card + 4-piece catalog grid with live pricing, dynamic set total, and Quick View integration | ✅ Resolved |
| Promotional section `.promo` using flat bookshelf SVG illustration | `index.html`, `css/pages.css`, `css/responsive.css` | Upgraded to art-directed decor composition featuring `halo-mirror` and `pillar-candles` with clear typography and natural value highlights | ✅ Resolved |
| Shop page product discovery basic and sparse with stuck Quick View button after close | `shop.html`, `css/pages.css`, `css/components.css`, `css/responsive.css`, `js/main.js`, `js/ui.js`, `js/catalog.js`, `api/products.php` | Redesigned shop browsing experience: editorial hero header, horizontal category navigation pills with live item counts, material facets powered by DB specifications, clean price partitioning, alphabetical & price sorting, active filter tags with individual dismiss, instant in-place reset, and fixed Quick View `:focus-visible` button lifecycle preventing stuck focus states on modal close | ✅ Resolved |
| Shared storefront navbar and footer visual hierarchy, alignment, and mobile drawer polish | `css/components.css`, `css/responsive.css`, `js/ui.js`, `includes/header.php`, `includes/footer.php` | Refined shared navigation and footer: frosted-glass sticky header with backdrop blur, centered desktop navigation links with terracotta hover indicators, 42px touch-friendly action buttons, ring cutout for cart badge, mobile offcanvas drawer with quick actions and delivery note, 4-column balanced footer layout (`col-6 col-md-3 col-lg-2` and `col-12 col-md-6 col-lg-4`), structured contact icon badges (`.footer-contact-list`), polished social link placeholders, and reassuring COD/express badges in bottom copyright bar across all viewports | ✅ Resolved |

---

## 25. Current Known Issues

> [!NOTE]
> The following are **intentional limitations of the current scope**, not unresolved bugs. Earlier "demo stage" issues (simulated authentication, unpersisted orders, static catalogue, no admin authorization) were resolved by Backend Phases 3–11 and are intentionally **not** listed here.

| Issue | Nature | Resolution path |
| :--- | :--- | :--- |
| Payment is "Cash on delivery" only | Scope decision | Future: payment gateway integration (e.g. Paymob, Fawry) |
| Cart and wishlist are browser-local | Scope decision | Future: server-persisted carts for signed-in customers |
| Delivery estimates are informational | Demo rule | Future: real courier API integration |
| Stock is always shown as "In stock" | Demo copy | Future: real inventory tracking |
| No email/SMS notifications, no password reset | Not built | Future: transactional email/SMS provider |
| Single administrator role (no RBAC/audit log) | Scope decision | Future: multi-tier roles and activity logging |
| Newsletter form does not save | Demo form | Future: mailing list integration |
| Social media links are placeholders | Scope decision | Fill in when real accounts exist |
| Automated database backups not scheduled | Not built | Future: cron dumps to offsite storage |

**No unresolved technical defects remain from the audit.**

---

## 26. PHP/MySQL Migration Map

> Backend Phases 1–11 are **implemented and verified**; the frontend reads the catalogue through `api/*.php` (`js/catalog.js` fetch + `catalog:ready` boot gate). The "TOMORROW" data-flow below describes the architecture that now exists end-to-end; sections marked ✅ exist, sections marked 🔜 remain future work.

### Data Flow Today vs. Tomorrow

```
CURRENT (live since Phases 2–11):
  MySQL / MariaDB (nova_home)
       ↓
  PHP / PDO (prepared statements only)
       ↓
  ├── api/*.php  ──JSON──► js/catalog.js fetch() ──► NOVA.products ──► shared card/UI components
  ├── account/*.php, admin/*.php ──► server-rendered, auth-gated pages
  └── checkout: api/orders.php re-prices items from the DB and writes orders transactionally

REMOVED (Phase 2): the legacy products.js static 14-record array
```

### Database Tables

### Actual Schema (✅ implemented in `database/schema.sql`, database `nova_home`)

| Table | Actual columns (utf8mb4/InnoDB) | Seed |
| :--- | :--- | :--- |
| `categories` ✅ | `id` AUTO, `slug` UNIQUE, `name`, `image`, `sort_order`, timestamps | 5 rows |
| `products` ✅ | `id` AUTO, `slug` UNIQUE, `category_id` FK→categories RESTRICT, `name`, `price` INT, `old_price` NULL, `rating` DECIMAL(2,1) 0–5, `reviews_count`, `is_new`, `is_best`, `description` TEXT, `active`, timestamps | 14 rows |
| `product_images` ✅ | `id` AUTO, `product_id` FK CASCADE, `image_path`, `sort_order`, `alt_text` | 14 rows (1 per product after the photography migration) |
| `product_specifications` ✅ | `id` AUTO, `product_id` FK CASCADE, `spec_key`, `spec_value`, `sort_order` | 42 rows (3/product) |
| `customers` ✅ (Phase 9) | `id` AUTO, `name`, `email` UNIQUE, `password_hash`, `phone`, `active`, timestamps | 0 rows (fresh install) |
| `customer_addresses` ✅ (Phase 9) | `id` AUTO, `customer_id` FK→customers CASCADE, `label`, `recipient_name`, `phone`, `city`, `address`, `apartment`, `is_default` | 0 rows (fresh install) |
| `orders` ✅ (live; authenticated customers only since 2026-10-17 — `customer_id` NULL only for historical guest rows) | `id` AUTO, `order_ref` UNIQUE, `customer_id` NULL FK→customers, `customer_name`, `phone`, `email`, `city`, `address`, `notes`, `payment_method`='cod', `subtotal`, `delivery_fee`, `total`, `status` ENUM, timestamps | 0 rows (fresh install) |
| `order_items` ✅ (live) | `id` AUTO, `order_id` FK CASCADE, `product_id` FK SET NULL, `product_name` snapshot, `unit_price`, `quantity` 1–10, `line_total` | 0 rows (fresh install) |
| `admin_users` ✅ (created via CLI script) | `id` AUTO, `name`, `email` UNIQUE, `password_hash`, `active`, timestamps | 0 rows (fresh install) |
| `settings` ✅ | `id` AUTO, `key` UNIQUE, `value`, `updated_at` | 6 rows (fee 60, threshold 1500 + business contact) |

### Still Planned (🔜 future work)

| Table | Planned columns |
| :--- | :--- |
| `look_scenes` / `look_spots` 🔜 | Scene image + hotspot coordinates (currently hardcoded `NOVA.lookSpots`) |

> Customer accounts and addresses were planned here in Phase 1 and are now **implemented** as `customers` and `customer_addresses` (Phase 9).

### PHP Infrastructure (✅ Phase 1)

| File | Responsibility |
| :--- | :--- |
| `config/config.example.php` ✅ | Tracked template: env/debug, db params, `base_url => null` (auto-detect), business fallbacks, `demo_access => false` + `public_demo_access => false` |
| `config/config.php` ✅ | Local-only XAMPP values; git-ignored via `.gitignore` — never commit |
| `config/database.php` ✅ | `nova_db()`: PDO only, exceptions, assoc fetch, real prepares, utf8mb4 DSN |
| `includes/bootstrap.php` ✅ | Config load (+fallback), error policy, lazy secure session, requires DB+helpers, `nova_pdo()` |
| `includes/functions.php` ✅ | `e`, `nova_config`, `nova_base_url`/`nova_asset`/`nova_url`, `is_post`, `redirect`, `json_response`, CSRF trio, `nova_setting` (DB→config fallback), `nova_money` |
| `includes/validation.php` ✅ | `v_required`, `v_email`, `v_int_range`, `v_money_int`, `v_slug`, `v_phone_eg`, `v_text` |
| `includes/header.php` / `footer.php` ✅ | PHP mirrors of `ui.js` header/footer; use `nova_base_url()` + `e()`; not yet included by pages |
| `health.php` ✅ | Dev-only probe: bootstrap→PDO→counts→FK check→JSON `{status:ok}`; restrict/remove before production |
| `api/` ✅ | Reserved, intentionally empty until Phase 2 |

### Local Development (✅ verified 2026-10-05)

- XAMPP: PHP 8.2.12, MariaDB 10.4.32, Apache (`http://localhost/nova-home/nova-home/` → 200).
- Actual app path: `C:\xampp\htdocs\nova-home\nova-home` (nested one level deeper than the spec's ideal `C:\xampp\htdocs\nova-home`). `nova_base_url()` auto-detects, so the app works at either path; set `base_url` explicitly in production.
- Init: `C:/xampp/mysql/bin/mysql.exe -u root < database/schema.sql` then `C:/xampp/mysql/bin/mysql.exe -u root nova_home < database/seed.sql` (rerunnable; verified no duplicates: 5 categories / 14 products / 14 images / 42 specs / 6 settings).
- Verify: `C:/xampp/php/php.exe -l <every PHP file>` (55 files, all pass) + `curl http://localhost/nova-home/nova-home/health.php` → `"status":"ok"`.
- `healthbridge` database untouched.
- Repository: initialized 2026-10-17 (`git init`, branch `main`); the preparation task made **no commits**. `config/config.php`, `database/backups/`, `node_modules/`, test artifacts, and local `screenshots/` are git-ignored — see `docs/development/GITHUB_PREPARATION_REPORT.md` (local-only, git-ignored).
- Screenshots: `node scripts/capture_screenshots.js` regenerates the README gallery in `docs/screenshots/` (requires the local app running and the demo customer seeded).

### Phase 2 Read APIs (live, verified 2026-10-05)

| Endpoint | Method | Params | Response |
| :--- | :--- | :--- | :--- |
| `api/categories.php` | GET | none | `{success, data: [{id, slug, name, image, sort_order}]}` — 5 rows, sort_order ASC |
| `api/products.php` | GET | `category` (slug/`all`), `q` (<=120 chars, name+category+desc LIKE), `min_price`/`max_price` (int 0..1e8), `sort` whitelist (featured/new/low/high, default featured), `limit` 1..100, `offset` 0..10000 | `{success, data: [{id, slug, category, cat, name, price, oldPrice, old, rating, reviews, isNew, isBest, best, description, desc, image}], meta}` — active only, JOIN categories, primary image subquery |
| `api/product.php` | GET | `slug` (required, slug format) | `{success, data: {product, category, images[sort_order], specifications[sort_order]}}`; missing/invalid → 404 `{success:false, error}` |
| `api/orders.php` ✅ Phase 3 (+ 2026-10-17 auth gate) | POST (405 otherwise; **401 without a customer session**) | JSON body: `customer_name`, `phone`, `email?`, `city` (controlled list), `address` (+`apartment`), `notes?`, `payment_method` (`cod` only), `items:[{slug, qty}]`, `csrf_token` | `{success, data:{order_id, order_ref, subtotal, delivery_fee, total}}`; unauthenticated → `401 {"code":"auth_required"}`; validation → 400 with user-safe message; never echoes client money |
| `api/csrf.php` ✅ Phase 3 | GET (405 otherwise) | none — starts secure session, `no-store` | `{success, data:{csrf_token}}` — session-bound token for the checkout POST |
| `api/order.php` ✅ Phase 4 | GET (405 otherwise) | `ref` (required, `NH-YYYYMMDD-XXXXXX` format) | `{success, data:{order_ref, customer_name, city, address, subtotal, delivery_fee, total, items[product_name, unit_price, quantity, line_total, slug]}}` — only if session owns the ref; identical 404 for wrong-session/nonexistent; 400 missing/malformed ref |
| `api/admin-login.php` ✅ Phase 5 | POST (405 otherwise) | JSON `{email, password, csrf_token}` | 200 `{success, data:{name, redirect}}` on success; generic 401 `Invalid email or password.` (bad format/creds/inactive — indistinguishable); 400 missing/bad CSRF or malformed JSON; 429 after 5 failed attempts/60s; 500 generic |

Validation/security: authenticated-customer gate first (`401 auth_required` before parsing/writes); `v_slug`/`v_int_range` on all inputs; ORDER BY + LIMIT/OFFSET whitelisted (never interpolated); all values bound via PDO; LIKE uses three distinct placeholders (`:q1/2/3`); only frontend-needed fields exposed (no hashes/creds/paths); errors generic, details to server log via `error_log()`; `json_response()` throughout; bootstrap/PDO stack reused.

### Phase 2 Frontend Migration (live, verified 2026-10-05)

- `js/catalog.js` (new): fetches categories + full product list once, normalises to the legacy field shape (keeps `id/cat/name/price/old/rating/reviews/best/isNew/desc` aliases), emits `catalog:ready` / `catalog:error` on document. All 22 HTML pages load it after `products.js`.
- `js/products.js`: hardcoded 14-record array DELETED. Keeps frontend-only config: `FREE_DELIVERY_OVER`, `DELIVERY_FEE`, `BASE`, `imgs()` (DB primary image when resolved, legacy 3-file fallback otherwise), `fmt`, `find`, `catName`, `lookSpots`, `deliveryCities`, `delivery`, `search`.
- `js/main.js`: catalogue-backed boots (home/shop/product/cart/checkout/success/account/admin markers) wait for `catalog:ready`; error state renders existing-style empty-state + Retry. Mid-file `const { products }` destructure replaced with live `products() => NOVA.products` accessor; admin previews re-render on `catalog:ready`; product form specs guarded (`(p.specs||[])`). PDP paints instantly from list data, then surgically enriches specs + gallery from `api/product.php` (no full re-paint, no duplicate listeners).
- `js/ui.js`: `card()` hardened for single-image DB products (`imgs[1]||imgs[0]`); no other logic changed.
- Source of truth: DB owns identity/pricing/metadata/images/specs; JS owns UI behaviour + localStorage state. localStorage keys unchanged (`nova_cart`, `nova_wish` as slug arrays, `nova_recently_viewed`, `nova_delivery_city`, `nova_last_order`) — slugs stable, cart/wishlist/recent fully compatible.
- Verified pages: home (cats/featured/bestsellers/look), shop (filter/search/sort/price), product (detail+specs+gallery+related+recent+estimator+sticky), cart (lines+totals+delivery), checkout (lines+totals), wishlist (2 cards), admin products (14 rows), invalid-slug not-found. No console errors on tested pages.

---

## 27. AI Development Rulebook

> This section is the most important for future AI sessions (Cline, Antigravity, or any other agent).

### Before Modifying Any Code

1. **Read `PROJECT_GUIDE.md`** (this file) first.
2. **Read the relevant PHP/SQL file(s)** before touching them (`config/`, `includes/`, `database/`).
3. **Understand the existing architecture** — find where the problem is solved before creating a new solution.
4. **Reuse existing state and components** before creating new ones.
5. **Do not duplicate business logic** — cart totals, wishlist state, and delivery rules each have a single source of truth.

### Modification Rules

6. **Do not add dependencies** without a documented reason and a measurable benefit.
7. **Do not redesign** unless explicitly instructed by the user.
8. **Preserve accessibility** — do not remove ARIA attributes, labels, or focus management.
9. **Preserve responsive behaviour** — test at mobile and desktop after any layout change.
10. **Test affected functionality** after every change.
11. **Check for regressions** — verify that adjacent features still work.
12. **Update `PROJECT_GUIDE.md`** after meaningful architectural changes (see §30).

### Hard Rules — Never Break These

- **Never invent backend functionality** — do not add `fetch()` calls to APIs that do not exist.
- **Never silently remove an existing feature** — if a feature must be removed, discuss it first.
- **Never use mysqli** — PDO only, via `nova_db()` / `nova_pdo()`.
- **Never interpolate SQL values directly** — prepared statements with bound parameters only.
- **Never trust client prices/totals/stock** — recalculate server-side from the database before accepting or persisting any order.
- **Escape dynamic HTML** with `e()`; keep business logic out of presentation partials where practical.
- **Reuse existing helpers** (`nova_config`, `nova_setting`, `nova_base_url`, validators) instead of duplicating delivery rules or config access.
- **Do not add Composer/framework dependencies** without a real reason (none needed at this scale).
- **Update `PROJECT_GUIDE.md`** when architecture, schema, env, or status changes.
- **Test PHP syntax (`php -l`) and database operations** before marking any backend step complete.
- **Never trust client-side prices** in any future backend work — always recalculate server-side.
- **Never expose secrets** — no credentials, API keys, or database details in any frontend file.
- **Never hardcode values** that already have a project-wide source of truth (`NOVA.FREE_DELIVERY_OVER`, `NOVA.DELIVERY_FEE`, etc.).
- **Never create a one-off implementation** when an existing shared component already handles the problem.
- **Never change the design system** (colours, fonts, tokens) without explicit instruction.
- **Never describe demo/static functionality as real backend functionality** in documentation or comments.
- **Never add `innerHTML` with user-provided content** — only use `innerHTML` with trusted static catalogue data or properly escaped values.

### Code Quality Rules

- Prefer **simple code** over clever abstractions.
- Do not over-engineer.
- Do not add libraries for functionality that can be handled with existing tools.
- Keep demo/static behaviour clearly distinguishable from future real backend behaviour — use comments like `/* Demo only: replace with fetch() call later. */`.
- Preserve all existing comments and docstrings unrelated to the change.

---

## 28. Changelog

Chronological record of major completed stages. This is for navigation, not a Git replacement.

| Stage | Description |
| :--- | :--- |
| **Initial frontend** | Core storefront pages: Home, Shop, PDP, Cart, Checkout. Bootstrap 5, design system, product catalogue. |
| **Account UI** | Login, Register, Dashboard, Orders, Order Detail, Profile, Addresses pages (static/demo). |
| **Admin UI** | Login, Dashboard, Products, Product Form, Categories, Orders, Order Detail, Settings (static/demo with real catalogue data). |
| **Wishlist** | localStorage wishlist with card buttons, PDP button, account page, shop filter mode. |
| **Recently Viewed** | localStorage recently viewed with homepage and PDP rendering. |
| **Free-Delivery Progress** | ARIA progressbar on cart and checkout; unlocked state; responsive to `cart:change`. |
| **Quick View** | Shared Bootstrap modal with gallery image, qty, add to cart, wishlist, full details link. |
| **Search Suggestions** | Autocomplete panel for header search and shop search; keyboard navigation; popular searches chips. |
| **Delivery Estimator** | PDP city dropdown with demo estimates; city synced to `nova_delivery_city` and reused in checkout. |
| **Sticky Mobile Add to Cart** | IntersectionObserver-driven sticky CTA on PDP; hidden at load, visible only after scroll past primary CTA. |
| **Shop the Look** | Homepage hotspot scene with 4 products; hotspot buttons and product list both open Quick View. |
| **Order Success** | Reads validated sessionStorage snapshot; renders order ref, items, totals, delivery address. |
| **Final audit** | Full static + Playwright audit. 9 issues identified, all resolved. Lighthouse: 100/100 across all metrics. |
| **Backend Phase 1** | DB `nova_home` (8 tables, seeded 5/14/42/42/6, verified), PDO foundation, config, bootstrap, helpers, validation, PHP header/footer partials, `health.php` probe, `.gitignore`. Frontend untouched; no APIs/auth/cart/checkout wiring. |
| **Backend Phase 2** | Read APIs (categories/products/product, validated, prepared, whitelisted sorts) + storefront migration to MySQL via `catalog.js` (hardcoded 14-record array deleted, `catalog:ready` boot gate, PDP surgical enrichment). localStorage keys unchanged. Verified: API matrix + home/shop/product/cart/checkout/wishlist/admin/invalid-slug in a real browser, zero console errors on tested pages. No schema change. |
| **Backend Phase 3** | Real guest COD checkout: `api/orders.php` (server-side pricing via `nova_setting()`, batched product revalidation, controlled city list, COD-only, session CSRF via `api/csrf.php`, transactional order+items with `NH-YYYYMMDD-XXXXXX` refs, 5× collision retry) + `api/csrf.php` + `nova_cities()`/`v_city()` helpers. Checkout submits for real; cart clears only on success; success page shows server-confirmed ref/totals. Tests: 3 real orders persisted (free+paid delivery), 9 invalid-input rejections, trust test (fake money ignored), rollback test, browser E2E, 0 console errors. No schema change. |
| **Backend Phase 4** | Authoritative order success: `GET api/order.php` (session-authorized read — `$_SESSION['nova_order_ref']` bound at checkout, uniform 404 for wrong-session/nonexistent, 400 malformed ref, 405 non-GET) + `orders.php` session binding + `main.js success()` rewritten to fetch MySQL (loading/error states) + `nova_last_order` sessionStorage snapshot **removed entirely**. Success page renders DB values only. Tests: real checkout E2E, refresh, missing/fake/wrong/anonymous refs, two-order ownership swap, planted fake snapshot ignored, DB-vs-API match, 0 console/network errors. No schema change. |
| **Backend Phase 5** | Real admin authentication: `includes/admin-auth.php` (`require_admin()` single gateway, `nova_admin_user()` DB re-check, login/logout with `session_regenerate_id(true)`), `POST api/admin-login.php` (CSRF, generic 401s, timing-equalized dummy verify, per-session throttle 5/60s→429), `admin/login.php` + `admin/index.php` (server-gated, session identity in sidebar) + `admin/logout.php` (POST+CSRF), `admin/login.html` → redirect stub, CLI-only `scripts/create_admin.php` (bcrypt, STDIN password, duplicate refusal). 1 dev admin (hash verified, no plaintext). Tests: full API matrix, browser login/logout/refresh/navigation, inactive re-check, fixation harness, throttle sequence 401×5→429, 0 console/network errors. No schema change; no CRUD started. |
| **Backend Phase 6** | Admin products & categories management: shared partials (`includes/admin-head/admin-foot.php`), `admin/index.php` live counts, `admin/categories.php` (create/edit/guarded delete), `admin/products.php` (validated GET filters + active toggle), `admin/product-form.php` (transactional product+specs+images save, repeaters, `v_image_path()` guard), 4 `.html` routes → redirect stubs. Tests: anonymous blocks (4 pages + forged POST), full category/product validation matrix, create/edit/delete/toggle E2E, storefront reflection (created→live, deactivated→hidden, deleted category→gone), rollback probe trigger (mid-transaction failure reverted product UPDATE), duplicate/uniqueness, CSRF valid/invalid, logout block, 0 console/network errors, DB 5/14/42/42 restored with 0 orphans + 7 order snapshots intact. No schema change; no order/customer/payment work. |
| **Backend Phase 7** | Admin orders + settings: `admin/orders.php` (list, ref/customer search, status+sort filters, mobile cards), `admin/order.php` (snapshot-authoritative detail, whitelist transitions pending→confirmed/cancelled, confirmed→shipped/cancelled, shipped→delivered, delivered/cancelled terminal; status-only updates), `admin/settings.php` (6-key whitelist, per-field validation, transactional upsert), 3 remaining `.html` admin routes → stubs, sidebar/dashboard links live, `.status--confirmed` CSS, `health.php` → `backend-phase-7`. Tests: anonymous blocks incl. forged order/settings POSTs (0 mutations), full status battery (3-step chain + invalid-transition/invalid-value/nonexistent/forged-CSRF rejections, financials byte-identical after changes), 7-case settings validation, unknown-key rejection (still 6 rows), integration (fee=77/threshold=100→free order, threshold=5000→fee-77 order, restored 60/1500, historical totals untouched), 0 console/network errors, health ok, catalog 5/14/42/42 intact. No schema change. |
| **Backend Phase 8** | Storefront settings integration: `api/store-settings.php` (public read-only, 6-key allowlist, integers for money, no-store, 405 non-GET) + `js/settings.js` (validated fetch → `NOVA.storeSettings` → single constant-sync point → `settings:ready`) + `ui.js` `applyStoreSettings()` (announcement, footer tel/mailto/address/business via validated `textContent` patches, note/info texts, one `cart:change` refresh). 14 storefront pages load the new script. Tests: endpoint shape/allowlist/junk-params/405, dynamic change of all 6 values → home/PDP/cart/checkout showed test values, below/at/above-threshold UI+server orders (77/0/0 fees), fake client money ignored, restoration verified in MySQL, checkout→success regression, 0 console/network errors, responsive 390/1366 on changed elements, catalog 5/14/42/42 + historical orders intact. No schema change; roadmap: Phase 9 = customer accounts. |
| **Backend Phase 9** | Customer accounts: migration `001_customer_accounts.sql` (customers, customer_addresses, orders.customer_id SET NULL; backup taken; schema.sql updated) + `includes/customer-auth.php` (separate session fields, regen on login/logout, nova_order_ref preserved) + 5 APIs (register/login/logout/profile/addresses — CSRF, bcrypt, throttle, ownership-scoped WHERE id AND customer_id) + 5 real account pages + sidebar partial + checkout prefill + order customer_id linking. Tests: registration/login negative matrices, case-normalized duplicate 409, profile forged-id ignored, address CRUD + default consistency + cross-customer 404s, harness session-regen booleans, guest order NULL + authed order linked (forged 9999 ignored), post-logout 401s, throttle 401x5→429, deliberate test-account cleanup (0 customers, 13 orders/16 items preserved), bcrypt verified, health ok, catalog 5/14/42/42 + settings 6 + admin 1 intact. No payment/reset/verification/order-history. |
| **Backend Phase 10** | Customer order history: `account/orders.php` (list, SQL `WHERE customer_id = :me`, newest-first, item counts, empty state) + `account/order.php?ref=` (ownership inside SQL `WHERE order_ref AND customer_id`, identical safe not-found for missing/invalid/nonexistent/unowned/guest refs, snapshot items + historical totals). Sidebar Orders link live (soon badge removed); `account/orders.html`/`order.html` -> redirect stubs (order stub keeps `?ref=`). No APIs, no schema changes, no customer mutations. Tests: A/B list isolation, own-detail vs MySQL, safe-not-found trio, invalid+missing ref, unauth 302 login, `?customer_id=` tamper ignored, post-logout 302, Phase 4 success regression, browser nav/detail/unauthorized/logout/empty-state with 0 console+network errors, deliberate test-customer cleanup (0 customers; orders 14/15 NULLed via FK; 15 orders/18 items intact; catalog 5/14/42/42 + settings 6 + admin 1). No cancellation/refund/tracking/notifications. |
| **Backend Phase 11** | Final project-wide audit, hardening, and verification: Directory protection with `.htaccess` (403 forbidden) on `database/`, `config/`, `includes/`, and `scripts/`; `health.php` restricted to development environment (returns 404 in non-dev); `js/main.js` guarded against empty querySelector on `catalog:error`; stale demo order link updated in `order-success.html`; account wishlist breadcrumb/sidebar links updated to `.php`; admin dashboard dynamic badge color fixed for order status; 48 routes inventoried and tested; 34 API unit tests passed; 31 customer/order auth tests passed; Playwright browser test suite with 128 assertions passed (0 JS errors, 0 console errors) across all 6 viewports (390, 430, 768, 1024, 1280, 1366) and 5 workflows (Storefront & Quick View, Guest Checkout, Customer Registration & Saved Addresses, Authenticated Checkout & Order History Isolation, Admin Management); Lighthouse 100/100 Accessibility, 100/100 Best Practices, 100/100 SEO; test data cleanly cleaned up; all 15 historical orders intact. |
| **Real Product Photography Migration** | Replaced placeholder SVG illustrations with 14 real, high-resolution photographs under the Pexels License. Downloaded and centered/cropped 1:1 at 1200×1200 max, encoded to optimized WebP (~780 KB total, avg ~55 KB/img) under `assets/images/products/<slug>/main.webp`. Sourced metadata and full photographer attribution catalogued in `IMAGE_SOURCES.md`. Updated `v_image_path()` in `includes/validation.php` to accept `.webp`, `.jpg`, `.jpeg`, `.png`, and `.svg` with strict directory containment and traversal checks. Updated `product_images` table in MySQL and `database/seed.sql`. Updated `js/main.js` PDP gallery to cleanly suppress thumbnail strip for single-image galleries. Playwright verified across Homepage cards, Shop grid, PDP, Quick View modal, Cart, Wishlist, and Admin product edit form with 0 errors. |
| **UI Bug Fixes & Visual Polish** | Systematic audit and resolution of post-migration UI/visual defects. Fixed asynchronous category navigation synchronization across desktop header dropdown, mobile drawer, and footer Shop links (`updateCategoryNav()`). Eliminated single-image product card hover flicker and blurred alt image duplicate overlay in `ui.js` and `components.css`. Initialized QuickView image with neutral SVG data URI to eliminate redundant HTTP document self-requests. Restored product thumbnails in `admin/products.php` with normalized directory traversal prefix (`../`). Updated `admin/order.php` and `account/order.php` items queries and templates to render actual WebP photography rather than legacy `.svg` paths. Converted Shop Search "Clear filters" action into a smooth in-place reset (restoring products, search query, category, and sort without page reload). Replaced hardcoded initial PDP image with neutral SVG placeholder. Enhanced direct navigation to `order-success.html` with clean informational messaging. Targeted Playwright test suite passed with 100% success across all 11 assertions and zero 404/broken assets. |
| **Final UI Cleanup** | Direct access to `order-success.html` refined to hide the reference line completely, display neutral informational state without placeholder/fake refs or false order implications, and provide navigation to shop and account orders. Database-backed primary image path resolution implemented for `admin/order.php` and `account/order.php` with traversal protection and fallback to `hero.svg` without hardcoding product slugs or image formats. Removed temporary migration scripts and verified that `scripts/.htaccess` blocks public execution. Targeted tests verified across all 6 scenarios with 100% pass rate. |
| **Homepage Visual Improvements** | Comprehensive redesign of the 3 primary visual sections on the homepage: (1) `.hero__art` transformed into an architectural editorial collage featuring real licensed WebP photography (`cairo-boucle-chair`, `sahara-vase`), warm stone/sand backdrops, subtle depth shadows, and an integrated delivery assurance chip; (2) Shop the Look section elevated into an editorial ensemble featuring an anchor showcase card and 4 coordinated catalog cards with live database prices, dynamic total calculation, and direct Quick View modal triggers; (3) Promotional `.promo` section upgraded with real decor photography (`halo-mirror` and `pillar-candles`), clear typography hierarchy, and natural material guarantees while preserving the `shop.html?cat=decor` destination and reveal animation. Verified across desktop (1366px), tablet (768px), and mobile (390px) viewports with zero horizontal overflow, zero console errors, and zero failed network requests. |
| **Shop Page Redesign & Product Discovery** | Comprehensive redesign of `shop.html` and product discovery architecture: (1) Added `material` extraction to `api/products.php` via `product_specifications` subquery and added `alpha` sort; mapped in `js/catalog.js` `normProduct()`; (2) Modernized page header with editorial eyebrow, dynamic title, and horizontally scrollable category pills with live product counts; (3) Multi-faceted discovery engine in `js/main.js` supporting Category, Material (Wood, Ceramic, Metal, Glass, Textile), Price presets (Under 600, 600-1500, 1500-3000, Over 3000), Search query, and Sorting (Featured, New arrivals, Price: low-high, Price: high-low, Name: A-Z); (4) Active filter chips bar with individual dismiss buttons and in-place instant reset; (5) Resolved Quick View modal focus bug in `css/components.css` and `js/ui.js` by transitioning overlay button from `:focus-within` to `:focus-visible` and cleaning up backdrop/body state on close; (6) Verified across Desktop (1366px), Tablet (768px), and Mobile (390px) with 0 horizontal overflow, 0 console errors, and 0 network failures. |
| **Shared Navbar & Footer Polish** | Thoughtful visual refinement of the shared storefront navigation bar and footer: (1) Frosted-glass sticky header (`backdrop-filter: blur(12px)`) with subtle scrolled shadow and border transition; (2) Refined desktop `.main-nav` centered with warm terracotta active indicator, animated dropdown with smooth item hover cues, 42px touch-friendly action buttons, and cut-out cart badge styling to prevent visual collisions; (3) Refined mobile offcanvas drawer with 48px touch targets, serif display typography, quick account/wishlist actions, and dynamic delivery threshold note; (4) Balanced 4-column footer layout (`col-lg-4`, `col-6 col-md-3 col-lg-2`, `col-6 col-md-3 col-lg-2`, `col-12 col-md-6 col-lg-4`), structured icon badges for contact details (`.footer-contact-list`), circular social links with hover lifts, and reassuring bottom bar with COD/express badges; (5) Full parity maintained in `includes/header.php` and `includes/footer.php`; verified across 5 representative routes and 3 viewports with 0 errors. |
| **Customer Account Redesign & Auth-Aware Navbar** | Complete visual and architectural redesign of the customer account area and dynamic session-aware navbar: (1) Diagnosed navbar auth state bug where static "Customer Account" links were rendered regardless of session; created lightweight `api/customer-auth.php` (HTTP 200, zero console 401s), added dedicated `account/logout.php` endpoint with fallback, and updated `js/ui.js` + `includes/header.php` to dynamically toggle between guest actions (Sign in / Register) and customer dropdown (Name avatar, Dashboard, Orders, Wishlist, Addresses, Profile, Sign out) grounded authoritatively in `nova_customer_user()`; (2) Redesigned customer dashboard (`account/index.php`) featuring summary metrics (orders placed, saved addresses, wishlist items), recent order card with direct details link, profile & default delivery address quick-views, and catalog browsing prompt; (3) Redesigned orders view (`account/orders.php`) with `.table-card--orders` on desktop and `.order-mobile-list` cards on mobile viewports; (4) Redesigned saved addresses (`account/addresses.php`) with `.account-card` and `.addr-card--default` styling; (5) Polished profile (`account/profile.php`) and wishlist (`account/wishlist.html`) with unified layout; (6) Redesigned shared account sidebar (`includes/account-side.php`) featuring customer initials avatar badge, clean SVG navigation, and horizontal scrollable pill bar on mobile (<992px); (7) Verified across viewports (390px, 768px, 1366px) with zero horizontal overflow, zero console errors, clean test cleanup, and 100% test pass rate. |
| **Admin Portal Redesign** | Complete visual redesign of all 8 admin pages into a professional, cohesive e-commerce management interface: (1) Shared layout partials (`includes/admin-head.php`, `includes/admin-foot.php`) rebuilt with responsive desktop sticky sidebar (250px, initials avatar, icon nav, `aria-current`), shared topbar with breadcrumb title and signed-in identity, and Bootstrap offcanvas mobile drawer with unified logout handler; (2) `admin/login.php` redesigned with centered card, icon input groups, password visibility toggle, spinner on submit, and accessible error state; (3) `admin/index.php` dashboard with 4 interactive metric cards (products/categories/orders/pending with amber accent), 6-row recent orders table with clickable refs, Quick Actions shortcuts, and Catalog Health summary; (4) `admin/products.php` with filter bar (search/category/status/sort), 14-product table with thumbnails, monospace slugs, category badges, star ratings, New/Best badges, visibility toggles, and empty state; (5) `admin/product-form.php` restructured into two-column layout with 3 content cards (Basic Info, Specs repeater, Images repeater) and sidebar cards (Pricing, Publishing & Flags, Action Panel); (6) `admin/categories.php` with inline thumbnails, sort badges, linked product counts, and expandable add/edit card; (7) `admin/orders.php` with desktop table + mobile cards, monospace refs, status badges; (8) `admin/order.php` with 3-column overview (Customer/Payment/Financials), items snapshot table with catalog links, and fulfillment workflow card; (9) `admin/settings.php` with two-column Business Identity + Delivery Pricing layout; (10) Admin logout session isolation hardened (clears only admin keys, never destroys customer state); (11) CSS: `.admin-brand-logo`, `.text-terracotta`, status badge consolidation; (12) Targeted Playwright test: 54/54 passed, 0 JS errors, 0 horizontal overflow across 4 viewports × 5 pages, Customer 12 intact. |
| **Demo Sign-In & Dev Accounts** | Development-only one-click demo sign-in for both customer and admin portals: (1) `scripts/seed_demo_customer.php` (CLI-only, rerun-safe) creates dedicated demo customer `demo.customer@novahome.eg` (Sarah El-Masry) with 2 saved addresses (Home/Office in Cairo), 5 sample orders across all statuses (delivered/shipped/confirmed/pending/cancelled) using real catalog products, and suggested wishlist product IDs; demo orders identified by `notes='NOVA_DEMO_ORDER'` marker; (2) `api/demo-customer-login.php` — dev-only POST endpoint guarded by `NOVA_ENV==='development'` AND `config.demo_access===true` AND valid CSRF; uses `nova_customer_login()` for proper session establishment with `session_regenerate_id(true)`; returns wishlist product IDs for localStorage population; (3) `api/demo-admin-login.php` — dev-only POST endpoint with identical guards; authenticates as first active admin via `nova_admin_login()` without hardcoding or transmitting passwords; (4) `account/login.php` updated with server-rendered demo section (`$demoEnabled` PHP check) showing "Explore Demo Account" button with spinner and error handling; (5) `admin/login.php` updated with "Demo Admin Access" button in same pattern; (6) `config/config.php` extended with `'demo_access' => true` flag; (7) CSS: `.demo-access-card` (dashed border, stone background) and `.btn-outline-nova` added to `css/pages.css`; (8) Production safety verified: server returns 403 when `demo_access=false` or `env!=='development'`, buttons not rendered server-side; (9) Playwright: 14/14 passed covering button visibility, sign-in flows, dashboard data, orders, addresses, wishlist localStorage, logout, session isolation, CSRF rejection, and zero console errors on both login pages. |
| **GitHub Publication Preparation** | Repository safety and deployment documentation (2026-10-17): (1) `git init` (branch `main`) — the project had never been a Git repository; **no commits or pushes** were made during preparation; (2) comprehensive `.gitignore` excluding local `config/config.php`, `.env` files, `database/backups/` (contains customer/order records + hashes), `node_modules/`, Playwright/test artifacts, local `screenshots/` working files, logs, and OS/editor noise — while keeping `database/schema.sql`, `database/seed.sql`, migrations, docs, screenshots gallery, and all application source tracked; (3) `config/config.example.php` rewritten with full setup documentation and `'demo_access' => false` by default; (4) runtime cleanup: hardcoded `/nova-home/nova-home/` fallback removed from `nova_base_url()` and the header/footer partials (neutral `/` fallback; auto-detection unchanged); (5) bug fixes: `admin/order.php` Customer Account row read a nonexistent `user_id` column (now `customer_id` — eliminated an exposed PHP warning containing the local Windows path and an always-"Guest Checkout" label), demo wishlist now seeded with slug ids (`luna-floor-lamp`, `halo-mirror`, `oasis-pendant`, `aswan-side-table`) because numeric legacy ids stopped resolving after Phase 2, `health.php` image expectation corrected 42→14 after the single-image photography migration (health returns `ok` again); (6) real screenshot gallery captured from the running app into `docs/screenshots/` (23 images via Playwright, demo-only synthetic data, server-side-filtered admin orders, blurred non-demo dashboard names, no orders created); (7) public `README.md` created (features, stack, screenshot gallery, verified setup steps, demo access, architecture, attribution, security rules, limitations, deployment checklist) with no live-demo link since the app is not deployed; (8) `PROJECT_GUIDE.md` accuracy pass (§2 status, §5 stack, §7 folder tree, §22 git row, §25 known issues, §26 migration map + local dev, §28 changelog, §29 roadmap); (9) `GITHUB_PREPARATION_REPORT.md` added. |
| **Documentation Folder Organization** | Pre-commit documentation layout cleanup (2026-10-17): (1) `IMAGE_SOURCES.md` moved to `docs/IMAGE_SOURCES.md` (still tracked; README + guide links updated); (2) `GITHUB_PREPARATION_REPORT.md` moved to `docs/development/GITHUB_PREPARATION_REPORT.md` and added to `.gitignore` as a local-only internal record — kept on disk, removed from the staged index; (3) folder trees in README/guide updated to the new `docs/` layout; (4) application structure, routes, base-path detection, and the 23-image `docs/screenshots/` gallery untouched; no commits made. |
| **InfinityFree Public Demo** | Interactive hosted-portfolio demo (2026-10-17), separate from the dev-only demo: (1) new config switch `public_demo_access` (default `false` in the tracked example) — works with `env=production`/`debug=false`, fully independent of `demo_access`; (2) new endpoints `api/public-demo-customer-login.php` + `api/public-demo-admin-login.php`, gated ONLY on `public_demo_access===true` + POST + CSRF; they sign in FIXED identities (`demo.customer@novahome.eg`, `demo.admin@novahome.eg`) — no id/email/role from the client, never "the first admin", never the owner's personal account; both use `nova_customer_login()`/`nova_admin_login()` so sessions, regeneration, `require_*()` authorization, and logout separation are unchanged; (3) `account/login.php` + `admin/login.php` render the demo buttons when EITHER switch is on (public wins for endpoint/label), with shared-mutable-data and editable-environment notices in public mode; (4) `database/demo-data.infinityfree.sql` — phpMyAdmin-friendly (no CREATE DATABASE/USE), insert-only + NOT EXISTS guards resolving by email/slug, creates the demo customer, 2 addresses, 5 sample orders (all statuses, refs `NH-YYYYMMDD-DEA1xx`) and 9 line items with totals recomputed from catalog+settings, plus the dedicated demo admin (bcrypt hash, plaintext undisclosed); safe to re-import, skips creation when the demo customer already has orders; (5) `database/demo-reset.infinityfree.sql` — destructive demo-DB-only reset step; documented 3-step phpMyAdmin reset sequence (reset → seed.sql → demo-data) restores the full baseline (5 categories / 14 products / 14 images / 42 specs / 6 settings / demo accounts / 2 addresses / 5 orders + 9 items); (6) README gained a Live demo section with the two entry-point links + public-demo documentation; `docs/development/INFINITYFREE_DEMO_SETUP.md` runbook added; (7) verified on an isolated production-style instance (`env=production`, `debug=false`) against a disposable DB: buttons render/hide with the switch, both sign-ins 200, wishlist slugs returned, all customer + admin pages 200, product/order/category/settings mutations persist, logout 302s, config-off → buttons gone + endpoints 403, dev endpoints stay 403 in production, health 404, SQL idempotent on double import, and the 3-step reset restored a mutated DB to baseline. |
| **Authenticated Checkout** | Checkout now requires a signed-in customer account (2026-10-17): (1) `api/orders.php` gained a hard server-side gate — `nova_customer_user()` is checked immediately after the method guard and BEFORE any body parsing/database work; unauthenticated POSTs (including forged `customer_id` bodies) return `401 {"code":"auth_required"}` with no `orders`/`order_items` rows created and the client cart untouched; `orders.customer_id` now always comes from the re-checked session (`$me['id']`) — the old guest-NULL path was removed (schema unchanged; historical guest rows intact; admin sessions do not satisfy the gate); (2) `cart.html` checkout CTA got `id="cart-checkout"` and `main.js cart()` rewrites it to `account/login.php?return=checkout` for signed-out visitors; (3) `main.js checkout()` gates on `api/customer-auth.php` and `location.replace()`s signed-out visitors to the same login URL; a `401` during submit (session expiry) does the same WITHOUT clearing the cart (`NOVA.cart.clear()` still runs only after server confirmation); (4) safe return-to-checkout: `account/login.php` + `account/register.php` accept `?return=checkout`, whitelisted to the exact literal (never a raw URL — no open redirect), honored by the already-authenticated redirect, passed into the page JS as `CO_RETURN`, used by normal login, registration, and BOTH demo customer buttons (dev + public); both pages show an "An account is required to check out" notice and preserve the return on their cross-links; guest-checkout wording removed; (5) bug fix: profile prefill now strips whitespace from stored phones (e.g. '+20 112 345 6789') so the strict tel pattern validates the prefilled value; (6) docs: README + guide current-state sections updated (stale §11 "demo-only checkout" text rewritten to the real flow); (7) targeted tests on an isolated instance + disposable DB — 38/38 passed: anon 401 (plain + forged id, zero rows), cart CTA redirect, direct-`checkout.html` redirect, notices + cross-links preserve return, whitelist enforcement (evil URL → null), registration → checkout → order linked to the new customer (1430/60/1490, 2 items) + cart cleared only on success + history + `api/order.php` 200, session-expiry 401, demo customer → checkout → order linked to demo customer, admin session → 401 + admin dashboard regression, validation/CSRF 400s preserved; real local app re-verified read-only (unauth POST → 401, dev demo intact). No commit made; live site untouched. |

---

## 29. Roadmap

### Current state
Frontend complete and audited. Backend Phases 1–11, Real Photography Migration, UI Polish, Final UI Cleanup, Homepage Visual Improvements, Shop Page Redesign & Product Discovery, Shared Navbar & Footer Polish, Customer Account Redesign & Auth-Aware Navbar, Admin Portal Redesign, and Demo Sign-In & Dev Accounts complete and verified (2026-10-17): MySQL catalogue, authentic licensed WebP product photography, verified responsive UI with synchronized navigation and smooth interactions, real COD orders (authenticated customers only since 2026-10-17), session-authorized success retrieval, professionally redesigned admin management portal, settings sync, auth-aware storefront navbar with live customer dropdown / guest actions, redesigned customer account hub, customer order history with SQL-enforced ownership, directory hardening, development-only demo sign-in with dedicated customer account and production safety guards, GitHub publication preparation (repository hygiene, public README with real screenshots, and deployment documentation), and project-wide automated verification. Cart remains localStorage; cancellation/refunds/notifications/payment gateways are planned for future major milestones.

### Next steps (in approximate order)

| Stage | Area | Status |
| :--- | :--- | :--- |
| ✅ Backend Phase 1 | Project structure, PDO wrapper, schema + seed, config, bootstrap, helpers, partials, docs | Complete |
| ✅ Product/category backend | `api/categories.php`, `api/products.php`, `api/product.php` live and tested | Complete |
| ✅ Frontend API integration | `catalog.js` fetch + `catalog:ready` boot gate; `products.js` records deleted | Complete |
| ✅ Real order creation | `api/orders.php`: validate → revalidate products → server pricing → transaction → ref | Complete |
| ✅ Session-authorized order read | `api/order.php` + session binding in `orders.php` + DB-rendered success page | Complete |
| ✅ Phase 5 admin auth | `require_admin()` gateway, `api/admin-login.php`, `admin/login.php`/`index.php`/`logout.php`, CLI admin creation, throttle | Complete |
| ✅ Phase 6 admin CRUD | `admin/products.php`/`categories.php`/`product-form.php` + shared partials, transactional save, toggle, guarded delete | Complete |
| ✅ Phase 7 admin orders + settings | `admin/orders.php`/`order.php`/`settings.php`, whitelisted status transitions, 6-key settings with proven source-of-truth | Complete |
| ✅ Phase 8 storefront settings integration | `api/store-settings.php` + `js/settings.js` + `ui.js` sync — announcement/footer/PDP/cart/checkout driven by DB settings | Complete |
| ✅ Phase 9 customer accounts | Registration/login/logout, sessions, profile, saved addresses, checkout order linking | Complete |
| ✅ Phase 10 customer order history | `account/orders.php` + `account/order.php?ref=` with SQL ownership | Complete |
| ✅ Phase 11: project-wide final verification + hardening | Full 48-route inventory & Playwright suite, directory .htaccess protection, dev endpoint hardening, Lighthouse 100 audits, zero test leaks | Complete |
| ✅ Real Product Photography Migration | 14 licensed Pexels WebP photographs, DB/seed sync, v_image_path validation, single-image PDP handling, IMAGE_SOURCES.md | Complete |
| ✅ UI Bug Fixes & Visual Polish | Category nav sync, product card hover polish, QuickView asset fix, admin/account thumbnail fixes, in-place filter reset | Complete |
| ✅ Final UI Cleanup | Order success direct access state, dynamic DB-driven order detail thumbnails, test script sanitization | Complete |
| ✅ Homepage Visual Improvements | Hero artwork editorial collage, Shop the Look ensemble & catalog grid, decor promo redesign | Complete |
| ✅ Shop Page Redesign & Product Discovery | Editorial header, category pills with live counts, material facets, active filter tags, QuickView focus fix | Complete |
| ✅ Shared Navbar & Footer Polish | Frosted glass header, centered desktop nav, cut-out cart badge, structured 4-column footer, COD reassurance tags | Complete |
| ✅ Customer Account Redesign & Auth Navbar | Dynamic auth-aware navbar (guest actions vs customer dropdown), metrics dashboard, responsive order cards, initials avatar sidebar | Complete |
| ✅ Admin Portal Redesign | Professional admin management interface with responsive sidebar/topbar/drawer shell, 54/54 tests passed | Complete |
| ✅ Demo Sign-In & Dev Accounts | Dev-only one-click demo customer + admin sign-in, dedicated demo account with sample data, production safety guards | Complete |
| ✅ GitHub Publication Preparation | Safe `.gitignore`, tracked config example with demo access disabled by default, public README + real screenshot gallery, readiness fixes, deployment docs | Complete |
| 🔜 Payment Gateway Integration | Card / mobile wallet processing (e.g. Paymob, Fawry) | Planned Future Work |
| 🔜 Email / SMS Notifications | Order confirmation & dispatch alerts to customers | Planned Future Work |
| 🔜 RBAC & Audit Log | Multi-tier admin roles, staff activity logging | Planned Future Work |
| 🔜 Automated Backups | Scheduled cron database dumps to offsite storage | Planned Future Work |

---

## 30. Document Maintenance Rules

`PROJECT_GUIDE.md` is a living document.

### Update this file when:

- Architecture changes (new module, new namespace property, new storage key)
- A major feature is added or removed
- Storage/state contracts change (new key, changed shape, new event)
- Dependencies change (added, removed, version bump)
- Database schema changes
- API contracts change (endpoints, request/response shapes)
- Important business rules change (delivery fee, threshold, limits)
- Security architecture changes
- Testing strategy changes
- Major bugs reveal a design/code decision worth documenting

### Do NOT update this file for:

- Every CSS spacing tweak
- Typo fixes
- Trivial copy changes
- Minor one-line visual adjustments

### Always keep:

- **Current state accurate** — remove features that no longer exist
- **Future state clearly separated** from current state (use "planned" labels)
- **Resolved issues out of §25 Current Known Issues**

---

## 31. Source of Truth Hierarchy

When sources conflict, use this priority order:

| Priority | Source | What it is authoritative for |
| :--- | :--- | :--- |
| **1 (highest)** | Actual source code | Behavioural truth — what the system actually does |
| **2** | `PROJECT_GUIDE.md` | Architecture, context, and navigation truth |
| **3** | `README.md` | Public project explanation |
| **4 (lowest)** | Chat conversation history | Temporary working context only |

If `PROJECT_GUIDE.md` conflicts with the actual code:

1. Trust the actual code as the ground truth.
2. Update `PROJECT_GUIDE.md` to match the code.

This prevents the guide from becoming misleading over time.

---

*Last updated: 2026-10-17 · Frontend complete and audited; Backend Phases 1–11 complete and verified; Real Product Photography Migration complete; UI Bug Fixes & Visual Polish complete; Final UI Cleanup complete; Homepage Visual Improvements complete; Shop Page Redesign & Product Discovery complete; Shared Navbar & Footer Polish complete; Customer Account Redesign & Auth-Aware Navbar complete; Admin Portal Redesign complete; Demo Sign-In & Dev Accounts complete (dev-only one-click customer + admin sign-in with dedicated demo account, sample data, production safety guards, 14/14 Playwright tests passed).*