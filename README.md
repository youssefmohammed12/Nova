# NOVA Home

A full-stack furniture and home-decor e-commerce website for the Egyptian market — product discovery, search and filtering, a shopping cart, Cash on Delivery checkout, customer accounts, and a complete administrator portal, built with plain PHP and MySQL.

NOVA Home was built as a **full-stack portfolio project** to demonstrate production-style engineering across a real e-commerce flow: server-rendered account and admin areas, a JSON API driving a vanilla-JS storefront, session-based authentication, and a documented MySQL schema with safe seed data.

> [!IMPORTANT]
> **Cash on Delivery is the only checkout method** — there is no online payment gateway. NOVA Home is a **portfolio demonstration**, not a commercial store. An interactive public demo is hosted on InfinityFree (see [Live demo](#live-demo)); its accounts use **shared, mutable demonstration data** that visitors can change and that may be reset.

---

## Live demo

A hosted, **interactive** demonstration runs on InfinityFree. Both routes lead
to the standard login pages, where one-click demo buttons appear once the
public-demo configuration is enabled on the server.

| Entry point | Link |
| :--- | :--- |
| **Explore Customer Demo** | [nova-home.fast-page.org/account/login.php](https://nova-home.fast-page.org/account/login.php) |
| **Explore Admin Demo** | [nova-home.fast-page.org/admin/login.php](https://nova-home.fast-page.org/admin/login.php) |

- The **customer** demo signs into a synthetic example account (`Sarah El-Masry`)
  with sample orders, saved addresses, and a populated wishlist.
- The **admin** demo signs into a dedicated demonstration administrator with the
  **normal management functionality** — products, categories, order statuses,
  and store settings all work and persist.
- Both accounts share **mutable demonstration data**. Visitors can change it,
  and it may be reset periodically — changes made by others can appear in your
  session, and a reset can remove them.
- Please **do not enter real sensitive personal or payment information**. This
  is a portfolio showcase; use the demo identities, not your own details.
- Checkout is **Cash on Delivery** only. The live database and private
  configuration are never part of this repository.

The public demo is powered by a separate `public_demo_access` setting and
dedicated demo endpoints — see [Demo access](#demo-access) and the
[deployment notes](docs/development/INFINITYFREE_DEMO_SETUP.md).

---

## Features

### Storefront

- Homepage with editorial hero, category discovery, bestsellers carousel, and "Shop the Look" collections
- Product catalogue with **category navigation, live result counts, material facets, price filters, search, and sorting**
- Search with keyboard-navigable suggestions
- Product detail pages with gallery, specifications, ratings, and a delivery estimator
- **Quick View** modal from any product card
- Wishlist (persisted per browser) with a shop "wishlist mode" and an account wishlist page
- Shopping cart with a free-delivery progress indicator (localStorage-based)
- **Cash on Delivery checkout** with server-side validation and server-side price recalculation
- Order confirmation page that renders the persisted order straight from the database

### Customer accounts

- Registration and login (bcrypt-hashed passwords, session-based)
- Protected customer dashboard with order, address, and wishlist metrics
- Order history and order detail pages with **SQL-enforced ownership** — one customer can never read another customer's orders
- Saved address book (default address pre-fills checkout)
- Profile management (name and contact phone)
- Wishlist synced between the storefront and the account area
- Auth-aware navbar: guests see Sign in / Register, signed-in customers see a personal menu

### Admin portal

- Dedicated administrator login with **per-session throttling** (5 failed attempts per minute → 429) and generic error messages
- Dashboard with live store metrics, recent orders, and quick actions
- Product management: search/filter/sort, create/edit with specification and image repeaters, visibility toggles (products are deactivated, never deleted, to protect order history)
- Category management with product counts and guarded deletion
- Order management with a supported status workflow (pending → confirmed → shipped → delivered / cancelled)
- Store settings: business identity and delivery pricing rules that drive the live storefront
- Shared admin shell with responsive sidebar, topbar, and mobile drawer

### Security & engineering

- PHP 8.1+ with **PDO and prepared statements only** (emulated prepares disabled); no `mysqli` anywhere
- Server-side validation on every input; prices and delivery fees are always recalculated from the database — client-submitted totals are never trusted
- CSRF tokens on state-changing endpoints (checkout, logins, admin actions)
- Session hardening: `session_regenerate_id(true)` on login, HttpOnly + SameSite=Lax cookies, Secure flag automatically enabled under HTTPS
- Separate customer and administrator session state with server-side authorization gateways (`require_customer()`, `require_admin()`) — pages redirect unauthorized visitors themselves; nothing depends on hidden links
- bcrypt password hashing for both customers and administrators
- Sensitive directories (`config/`, `database/`, `includes/`, `scripts/`) blocked from direct web access via `.htaccess`
- Development-only probe (`health.php`) and development-only one-click demo sign-in — both enforced **server-side** and disabled unless the local configuration explicitly says so

## Tech stack

| Layer | Technology |
| :--- | :--- |
| Backend | PHP 8.1+ (developed and tested on PHP 8.2.12), plain PDO — no framework, no ORM |
| Database | MariaDB 10.4 / MySQL 8 compatible (`utf8mb4`, InnoDB) |
| Frontend | Semantic HTML5, hand-written CSS (5-file architecture), vanilla ES2020+ JavaScript — no React/Vue/Angular |
| UI libraries | [Bootstrap 5.3.8](https://getbootstrap.com/), [Bootstrap Icons 1.13.1](https://icons.getbootstrap.com/), [Swiper 14.3.0](https://swiperjs.com/) — pinned CDN versions |
| Typography | Instrument Sans + Newsreader (Google Fonts) |
| Testing / tooling | Playwright (dev-only, for screenshot capture and browser audits) |

**No build step is required.** There is no bundler, transpiler, or Composer install for normal runtime — you need a PHP + MySQL web server and the CDN assets reachable from the browser. Node.js is only needed if you want to run the optional developer tooling in `scripts/`.

---

## Screenshots

Captured from the running application (desktop 1440×900, mobile 390×844). Customer and admin views are signed in through the development demo account, which contains only synthetic fixture data.

### 1. Public storefront

![NOVA Home homepage — editorial hero and real product photography](docs/screenshots/homepage-desktop.png)

*Homepage — editorial hero with licensed product photography and the shared frosted-glass navbar.*

![NOVA Home homepage at a mobile viewport](docs/screenshots/homepage-mobile.png)

*The same homepage on a 390px mobile viewport.*

![Shop page with category pills, filters, and product cards](docs/screenshots/shop-desktop.png)

*Shop — category pills with live counts, material and price filters, sorting, and product cards.*

![Shop page with the Lighting category filter active](docs/screenshots/shop-filtered.png)

*A meaningful active filter: the Lighting category with its removable filter chip.*

![Product detail page](docs/screenshots/product-detail.png)

*Product detail — gallery, pricing, stock state, delivery information, and the city delivery estimator.*

![Quick View modal open on a product](docs/screenshots/quick-view.png)

*Quick View — inspect a product without leaving the catalogue.*

![Populated shopping cart with free-delivery progress](docs/screenshots/cart.png)

*Cart with a populated free-delivery progress bar and live order summary.*

![Checkout form filled with demo information](docs/screenshots/checkout.png)

*Cash on Delivery checkout, filled with the synthetic demo identity (nothing is submitted in this capture).*

![Shop page at a mobile viewport](docs/screenshots/shop-mobile.png)

*Responsive shop browsing on mobile — collapsible filters and two-column product cards.*

### 2. Customer account

![Customer login with development demo option](docs/screenshots/customer-login.png)

*Customer login. The "Explore Demo Account" card only renders when development demo access is enabled.*

![Customer dashboard](docs/screenshots/customer-dashboard.png)

*Dashboard — order, address, and wishlist metrics with the latest order and default address.*

![Customer order history](docs/screenshots/customer-orders.png)

*Order history with statuses across the full fulfilment workflow.*

![Customer wishlist](docs/screenshots/customer-wishlist.png)

*Populated wishlist (demo fixture items).*

![Address management](docs/screenshots/customer-addresses.png)

*Address book with default-address handling and the add-address form.*

![Profile management](docs/screenshots/customer-profile.png)

*Profile management — email is intentionally locked against direct changes.*

### 3. Admin portal

![Administrator login](docs/screenshots/admin-login.png)

*Administrator login. The one-click demo button appears only in development mode.*

![Administrator dashboard](docs/screenshots/admin-dashboard.png)

*Dashboard — live catalogue metrics, recent orders, and quick actions.*

![Product management table](docs/screenshots/admin-products.png)

*Product management with search, filters, thumbnails, badges, and visibility toggles.*

![Product edit form](docs/screenshots/admin-product-form.png)

*Product edit form — basic info, pricing, specifications, and publishing controls (opened on a real catalogue product, no changes saved).*

![Category management](docs/screenshots/admin-categories.png)

*Category management with linked product counts.*

![Order management list](docs/screenshots/admin-orders.png)

*Order management filtered to the demo customer's orders — only synthetic data is shown.*

![Order detail and fulfilment workflow](docs/screenshots/admin-order-detail.png)

*Order detail — customer block, fulfilment workflow, recorded financials, and the item snapshot.*

![Store settings](docs/screenshots/admin-settings.png)

*Store settings — business identity and the delivery pricing rules that drive checkout.*

---

## Getting started

### Requirements

- **PHP 8.1+** with the `pdo_mysql` extension
- **Apache** (or any PHP-capable web server) — Apache must allow `.htaccess` overrides (`AllowOverride All`) so the directory-protection rules in `config/`, `database/`, `includes/`, and `scripts/` take effect
- **MariaDB 10.4+ / MySQL 8+**
- A modern browser; internet access for the pinned CDN assets (Bootstrap, icons, fonts)
- Optional (developer tooling only): Node.js 18+ for Playwright screenshot/audit scripts

The instructions below use Windows + XAMPP, which is the environment the project was developed on. Any PHP/MySQL stack works — substitute the equivalent commands.

### 1. Install and start the stack

Install [XAMPP](https://www.apachefriends.org/) (or your preferred stack) and start **Apache** and **MySQL/MariaDB** from the control panel.

### 2. Get the code

Clone or download this repository into your web root, e.g. `C:\xampp\htdocs\nova-home\`.

```text
C:\xampp\htdocs\nova-home\     ← project root (contains README.md)
```

### 3. Create the database

The schema creates and configures the database itself (`nova_home`):

```bat
C:\xampp\mysql\bin\mysql.exe -u root < database/schema.sql
C:\xampp\mysql\bin\mysql.exe -u root nova_home < database/seed.sql
```

Equivalent with a password prompt: `mysql -u root -p < database/schema.sql` then `mysql -u root -p nova_home < database/seed.sql`.

- `database/schema.sql` — all 10 tables, foreign keys, and constraints (idempotent: safe to re-run)
- `database/seed.sql` — 5 categories, 14 products, 14 product photographs, 42 specifications, and 6 store settings
- `database/migrations/001_customer_accounts.sql` is **historical** (it upgraded pre-existing databases in Phase 9). Fresh installs already get these tables from `schema.sql` — you do not run it on a clean setup.

Neither file contains personal data: a fresh install ships with **no customer accounts and no orders**.

### 4. Create your local configuration

The real configuration file is intentionally **not** committed to Git. Create it from the tracked template:

```bat
copy config\config.example.php config\config.php
```

Then review `config/config.php` for your machine:

| Key | Local value | Notes |
| :--- | :--- | :--- |
| `env` | `'development'` | Use `'production'` on a live server |
| `debug` | `true` locally | Must be `false` in production (controls on-screen error display) |
| `demo_access` | `false` in the template | Development-only one-click demo. Requires `env => 'development'` too. **Never enable in production.** |
| `public_demo_access` | `false` in the template | Public one-click demo for the hosted portfolio demo. Independent of `env`/`debug`. Set `true` only on the intentional public demo. |
| `db.*` | Stock XAMPP defaults (`root`, empty password, `nova_home`) | Change to your own database user/password |
| `base_url` | `null` (auto-detect) | Works at any local path. Set explicitly in production, e.g. `'/'` or `'/shop/'` |

`config/config.php` is listed in `.gitignore` and must never be committed — that is where real credentials live.

### 5. Create an administrator account

No administrator exists in a fresh database, and none is ever created by a web request. Create one from the command line (CLI-only script; web requests to it return a bare 404):

```bat
C:\xampp\php\php.exe scripts/create_admin.php "Your Name" "admin@example.com"
```

The script prompts for the password on stdin (minimum 8 characters) so it never appears in shell history, refuses duplicate emails, and stores only a bcrypt hash.

### 6. Open the application

If the project lives at `C:\xampp\htdocs\nova-home\`, visit:

```text
http://localhost/nova-home/
```

The application auto-detects its own base path (`base_url => null`), so copies placed in a differently named or nested folder keep working without configuration. This development machine keeps the project one level deeper, served as `http://localhost/nova-home/nova-home/` — also auto-detected.

Quick health check (development environment only — it returns 404 in production):

```text
http://localhost/nova-home/health.php
```

### 7. (Optional) Enable the development demo experience

The demo shortcuts are gated **server-side** by two independent conditions: `env === 'development'` **and** `demo_access === true`. In `config/config.php`:

```php
'env'         => 'development',
'demo_access' => true,
```

Then seed the dedicated demo customer (CLI-only, safe to re-run):

```bat
C:\xampp\php\php.exe scripts/seed_demo_customer.php
```

This creates the synthetic demo customer, two saved addresses, and five sample orders covering every fulfilment status. See [Demo access](#demo-access) below.

### Troubleshooting

| Symptom | Likely cause / fix |
| :--- | :--- |
| Blank page or HTTP 500 | Read the PHP error log (`C:\xampp\apache\logs\`); most often a wrong database credential in `config/config.php` |
| `SQLSTATE[HY000] [1045] Access denied` | Database user/password in `config/config.php` do not match your MySQL setup |
| `Unknown database 'nova_home'` | Run `database/schema.sql`, then `database/seed.sql`, in that order |
| `health.php` shows `"status":"degraded"` | Seed data is incomplete — re-run `database/seed.sql` (it is idempotent) |
| HTTP 403 when opening files under `config/`, `database/`, `includes/`, `scripts/` | **Expected** — `.htaccess` directory protection is working |
| Directory protection seems to do nothing | Apache runs with `AllowOverride None` — enable `AllowOverride All` for the site (see notes below) |
| Unstyled page / missing icons | The pinned CDN assets could not load — check internet access, or vendor the libraries locally |
| Admin page redirects to login | Expected — create an account with `scripts/create_admin.php`, or use demo access in development |
| Port 80 already in use | Change Apache's port in XAMPP and use `http://localhost:8080/…`, or stop the conflicting service |

---

## Demo access

There are **two independent demo switches**, enforced server-side. Neither can be
enabled by manipulating a URL or a client-side variable — the API handlers
reject the request unless the configuration says so.

### Development-only demo (local)

- **Explore Demo Account** (customer login) and **Demo Admin Access** (admin
  login) appear as one-click buttons **only** when `env => 'development'` **and**
  `demo_access => true`. The committed example ships with `demo_access => false`
  and the handlers return `403` unless both hold.
- Demo data is created by `php scripts/seed_demo_customer.php` (CLI-only, safe to
  re-run): a dedicated synthetic customer with sample orders across every status,
  two saved addresses, and a populated wishlist. No real person's data is involved.
- Keep `demo_access => false` (the default) and `env => 'production'` on any
  public deployment.

### Public hosted demo (InfinityFree)

- **Explore Customer Demo** and **Explore Admin Demo** appear on the live login
  pages **only** when `public_demo_access => true`. This switch is **independent
  of `env`/`debug`**, so the public demo runs on a normal production
  configuration (`env => 'production'`, `debug => false`).
- The public endpoints (`api/public-demo-customer-login.php`,
  `api/public-demo-admin-login.php`) sign in **fixed synthetic identities**
  (`demo.customer@novahome.eg` / `demo.admin@novahome.eg`) created by
  `database/demo-data.infinityfree.sql`. No customer id, email, or role can be
  supplied by the client, and the admin demo is never "the first admin in the
  table" nor the owner's personal account.
- The admin demo has **full, normal administrative capability** (not read-only):
  visitors can create/edit products, change visibility, manage categories, move
  order statuses, and change store settings. Because the data is shared and
  mutable, it can be reset — see the
  [deployment runbook](docs/development/INFINITYFREE_DEMO_SETUP.md).
- **Recommended public-demo production set:**
  `'env' => 'production'`, `'debug' => false`, `'demo_access' => false`,
  `'public_demo_access' => true`. Turn `public_demo_access` off to remove the
  buttons and reject the endpoints entirely.

There is no shared or default password to document: demo sign-in establishes a
server-side session, and real accounts always authenticate through
bcrypt-verified passwords. Both demo accounts use synthetic fixtures — do not
enter real personal or payment information into the public demo.

---

## Project structure

```text
nova-home/
├── index.html  shop.html  product.html  cart.html  checkout.html  order-success.html
├── account/                # Customer area — server-rendered PHP pages behind require_customer()
│   ├── index.php  orders.php  order.php  addresses.php  profile.php
│   ├── login.php  register.php  logout.php
│   └── wishlist.html        # Wishlist page (localStorage-backed, renders through the shared JS layer)
├── admin/                  # Administrator portal — PHP pages behind require_admin()
│   ├── index.php  products.php  product-form.php  categories.php
│   ├── orders.php  order.php  settings.php
│   ├── login.php  logout.php
│   └── *.html               # Legacy redirect stubs pointing at the PHP pages
├── api/                    # JSON endpoints: catalogue, checkout, orders, auth, CSRF, store settings,
│                            # plus the development-only demo sign-in handlers
├── assets/images/          # Category artwork + real product photography (WebP) — see docs/IMAGE_SOURCES.md
├── config/                 # config.php (LOCAL, git-ignored), config.example.php (tracked), database.php (PDO factory)
├── css/                    # variables, base, components, pages, responsive
├── database/               # schema.sql, seed.sql, migrations/ (historical), backups/ (git-ignored)
├── docs/                   # Documentation
│   ├── IMAGE_SOURCES.md    # Photography provenance & licensing
│   ├── screenshots/        # README screenshot gallery
│   └── development/        # Local-only notes (git-ignored)
├── includes/               # bootstrap, functions, validation, auth gateways, header/footer/admin partials
├── js/                     # products (config), catalog (API fetch), cart, ui, settings, main
└── scripts/                # CLI-only utilities: admin creation, demo seeding, audits, screenshot capture
```

How the pieces fit together: the storefront pages boot a vanilla-JS layer that fetches the catalogue from `api/*.php` and renders it with shared UI components; cart and wishlist live in `localStorage` and are validated against the catalogue before use. Server-rendered PHP pages power the account and admin areas, talk to MySQL through the shared PDO factory, and enforce authentication server-side. Checkout is the bridge: the cart submits item slugs and quantities to `api/orders.php`, which re-prices everything from the database and writes the order transactionally.

---

## Photography and attribution

All catalog product photography is licensed under the [Pexels License](https://www.pexels.com/license/) and stored locally in `assets/images/products/`. Full provenance — photographer, source page, download date, processing details, and license — is documented in **[docs/IMAGE_SOURCES.md](docs/IMAGE_SOURCES.md)**. The project does not claim ownership of third-party photography; attribution is preserved as portfolio best practice even though the license does not require it.

---

## Security and deployment notes

Configuration rules that apply to every environment:

- **`config/config.php` must never be committed.** It is git-ignored; the tracked `config/config.example.php` contains only safe placeholders. Real secrets belong on the hosting environment only.
- **Database backups must never be published.** `database/backups/` is git-ignored precisely because dumps can contain customer records and password hashes. The tracked `database/schema.sql` and `database/seed.sql` are the supported way to build an install — they contain no personal data.
- **Development demo access must remain disabled in production** (`demo_access => false`, the shipped default, plus `env => 'production'`). Both conditions are enforced inside the API handlers themselves.
- **The public demo is a separate, deliberate opt-in.** `public_demo_access => true` enables one-click sign-in for the two dedicated demo identities and is intended only for the intentional portfolio demonstration. Keep it `false` on any deployment that is not the public demo. Turning it off removes the buttons and makes the public demo endpoints return `403`. It does not affect the dev-only demo switch, order-ownership checks, CSRF, or any authorization guard.
- **HTTPS is required for live hosting**, together with production-grade database credentials on a dedicated least-privilege MySQL user.
- **PHP error display must be off publicly**: `env => 'production'` and `debug => false` keep errors in the server-side log instead of the response.
- Private configuration and SQL files are additionally shielded by `.htaccess` (`Require all denied`). These rules only apply when Apache honors `.htaccess` (`AllowOverride` enabled) — on servers that ignore them, rely on placing the project outside the public web root or blocking those paths at the server level.
- **GitHub hosts the repository, not the application.** GitHub Pages cannot run this project's PHP/MySQL backend; a real deployment needs a compatible PHP/MySQL (or PHP/MariaDB) hosting environment and the host-specific configuration described below.

---

## Known limitations

- Cash on Delivery is the **only** payment method — no payment gateway (Paymob/Fawry etc.) is integrated.
- The cart and wishlist are browser-local (`localStorage`); only placed orders persist server-side.
- No email/SMS notifications, no password reset flow, and no order cancellation UI for customers.
- Single administrator role — no multi-user RBAC or audit log yet.
- Delivery estimates are informational demo values, not a courier integration.
- No inventory/stock tracking; product pages show standard availability copy.
- Newsletter sign-up and social links are placeholders.
- Automated database backups are not scheduled.

---

## Future deployment checklist

NOVA Home is **prepared for GitHub publication and documented for future deployment** — it is not live. When a hosting provider is chosen:

- [ ] Select hosting that supports PHP 8.1+ and MySQL/MariaDB with `pdo_mysql`
- [ ] Create the production database and a dedicated least-privilege database user
- [ ] Upload the codebase (excluding local-only `config/config.php`, `database/backups/`, `node_modules/`, and logs — `.gitignore` already excludes them)
- [ ] Create `config/config.php` from the example with production credentials, `env => 'production'`, `debug => false`, and an explicit `base_url`
- [ ] Confirm `demo_access` stays `false` (the default) — the development-only demo must be impossible in production
- [ ] Decide on the public demo: leave `public_demo_access => false` (no demo buttons, endpoints `403`), or set it `true` **only** on the intentional portfolio demo (see `docs/development/INFINITYFREE_DEMO_SETUP.md`) and import `database/demo-data.infinityfree.sql` via phpMyAdmin
- [ ] Apply `database/schema.sql` + `database/seed.sql` (and any newer migrations) to the production database; create the administrator via the CLI script or a secure one-off
- [ ] Enable HTTPS and verify session cookies carry the `Secure` flag
- [ ] Verify `.htaccess` protection is honored (or replicate the deny rules in server config) — confirm `config/`, `database/`, `includes/`, and `scripts/` return 403/404
- [ ] Confirm `health.php` returns 404 and no PHP warnings are visible anywhere
- [ ] Run the smoke checklist on the deployed site: homepage, product detail, cart, checkout, customer login/registration, one account page, admin login, one management page
- [ ] Add the real live-demo link to this README after successful deployment

---

## Further documentation

- **[PROJECT_GUIDE.md](PROJECT_GUIDE.md)** — the deep development guide: architecture, data models, business rules, security rules, testing policy, and full changelog
- **[docs/IMAGE_SOURCES.md](docs/IMAGE_SOURCES.md)** — photography provenance and licensing
- **[docs/development/INFINITYFREE_DEMO_SETUP.md](docs/development/INFINITYFREE_DEMO_SETUP.md)** — public demo deployment runbook: files to upload, SQL import order, enabling `public_demo_access`, and the demo-reset procedure
