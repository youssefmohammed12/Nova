# NOVA Home — InfinityFree Public Demo Setup

**Live site:** `https://nova-home.fast-page.org/`
**Purpose:** finish the interactive portfolio demo by adding the dedicated public
demo customer + administrator and enabling one-click public sign-in.

This is an internal runbook. It contains no credentials. Everything here is
performed manually in InfinityFree's **File Manager** and **phpMyAdmin** — no
SSH, no Composer, no CLI on the host.

---

## 1. What was already in place vs. what was missing

Already on the live site: storefront files uploaded; `schema.sql`, `seed.sql`,
and `migration 001` imported (tables + full catalog + settings exist).

**Missing (this task prepares all of it):**

| Item | Where it now lives |
| :--- | :--- |
| Public demo customer `demo.customer@novahome.eg` + 2 addresses + 5 sample orders / 9 line items | `database/demo-data.infinityfree.sql` |
| Dedicated demo administrator `demo.admin@novahome.eg` (not the owner's personal admin, not "first row") | same file |
| `public_demo_access` configuration switch (separate from dev-only `demo_access`) | `config/config.example.php` (template), set in your private `config/config.php` |
| Public one-click endpoints that sign in the **dedicated** identities under `env=production` | `api/public-demo-customer-login.php`, `api/public-demo-admin-login.php` |
| Login-page demo buttons for the public site | `account/login.php`, `admin/login.php` |
| Reset procedure for a demo database visitors can mutate | `database/demo-reset.infinityfree.sql` + §5 below |

`database/seed.sql` is **not** re-imported for demo accounts — it only restores
catalog and settings and does not touch customers/orders/admins.

---

## 2. Files to upload (InfinityFree File Manager)

Upload these to the site root (overwrite existing where noted):

| File | Action |
| :--- | :--- |
| `api/public-demo-customer-login.php` | **new** — upload |
| `api/public-demo-admin-login.php` | **new** — upload |
| `account/login.php` | **overwrite** |
| `admin/login.php` | **overwrite** |
| `database/demo-data.infinityfree.sql` | **new** — upload (imported once, then optional) |
| `database/demo-reset.infinityfree.sql` | **new** — upload (kept for future resets; never called by the app) |
| `config/config.example.php` | **overwrite** (documentation only) |

No other application file changed. The dev-only demo endpoints
(`api/demo-customer-login.php`, `api/demo-admin-login.php`) are untouched and
remain development-only.

---

## 3. Import the demo data (phpMyAdmin)

1. Open InfinityFree **phpMyAdmin** and **select the existing NOVA database**
   (the one that already holds `products`, `orders`, `customers`, etc. — the
   database you imported `schema.sql`/`seed.sql` into). Do **not** create a new
   database.
2. Choose **Import**.
3. Select `database/demo-data.infinityfree.sql`.
4. Leave all other options at their defaults (no `CREATE DATABASE`/`USE`
   statements are in the file; it runs against the selected database).
5. Go.

The file is **idempotent and insert-only**: it resolves rows by email and slug,
never by assumed numeric IDs, and it never deletes or edits your existing
customers, admins, orders, or catalog. Re-running it will not duplicate the
demo customer, addresses, orders, items, or admin.

**Order matters only if the catalog is not yet seeded.** On the live site the
catalog already exists, so this single import is all that is needed. For a
brand-new database the order is: `schema.sql` → `seed.sql` →
`demo-data.infinityfree.sql`.

**Optional sanity check** (SQL tab, run manually):

```sql
SELECT email, active FROM customers  WHERE email LIKE 'demo.%@novahome.eg';
SELECT email, active FROM admin_users WHERE email LIKE 'demo.%@novahome.eg';
SELECT order_ref, status, subtotal, delivery_fee, total FROM orders
 WHERE notes = 'NOVA_DEMO_ORDER' ORDER BY created_at;        -- expect 5
SELECT COUNT(*) FROM order_items i JOIN orders o ON o.id = i.order_id
 WHERE o.notes = 'NOVA_DEMO_ORDER';                          -- expect 9
```

## 4. Enable public demo access (private `config/config.php`)

On the live host, edit your **private** `config/config.php` (never committed).
Set:

```php
'env'                => 'production',
'debug'              => false,
'demo_access'        => false,      // dev-only switch stays OFF in production
'public_demo_access' => true,       // turn ON the interactive public demo
```

Keep your existing database credentials, explicit `base_url`, and every other
current setting exactly as they are — `public_demo_access` is the only key you
add/change for this feature. The tracked example config defaults it to `false`.

The two switches are independent:

- `demo_access` → development-only (`env === 'development'`), used by the local
  dev login buttons. Keep it `false` in production.
- `public_demo_access` → works with `env = production` / `debug = false`, used by
  the public login buttons. Only turn it on for the intentional public demo.

With `public_demo_access` off, the demo buttons are not rendered **and** direct
requests to the public demo endpoints are rejected with `403`. The dev-only
endpoints additionally still require `env === 'development'`, and `health.php`
still returns `404` in production — all verified.

---

## 5. Restore the demo later (reset procedure)

Visitors share one demo customer and one demo admin, so they can change profile
data, addresses, catalog rows, settings, and order statuses. Re-running
`seed.sql` alone does **not** undo that — it only restores catalog + settings.
Use the documented three-step sequence through phpMyAdmin, in order:

| Step | File | What it does |
| :--- | :--- | :--- |
| 1 | `database/demo-reset.infinityfree.sql` | **Destructive, demo DB only.** Removes all order items + orders, products/categories outside the baseline 14/5, all saved addresses of the demo customer, and resets the demo identity rows to baseline. |
| 2 | `database/seed.sql` | Restores the 5 categories, 14 products, 14 primary photographs + 42 specs, and the 6 store settings (idempotent). |
| 3 | `database/demo-data.infinityfree.sql` | Re-creates the demo customer, 2 addresses, 5 sample orders / 9 items, and the dedicated demo admin. |

> [!WARNING]
> Resetting removes every order and any catalog/category/settings changes made
> since the baseline. Run it against the **demonstration database only** —
> never a database holding real customer data. There is no HTTP reset endpoint;
> restoration is a manual phpMyAdmin action.

---

## 6. Live routes to test after setup

- Storefront: `https://nova-home.fast-page.org/`
- Customer demo: `https://nova-home.fast-page.org/account/login.php`
  → **Explore Customer Demo** button appears; clicking it signs in the demo
  customer (dashboard shows 5 sample orders, 2 addresses, 4-item wishlist).
- Admin demo: `https://nova-home.fast-page.org/admin/login.php`
  → **Explore Admin Demo** button appears; clicking it signs in the dedicated
  demo administrator with full management functionality (products, categories,
  orders, settings).
- Health probe (should be hidden): `https://nova-home.fast-page.org/health.php`
  → expect **404** while `env = 'production'`.

If the buttons do not appear, `public_demo_access` is not `true` in the live
`config/config.php`. If a button appears but sign-in returns an error, confirm
`demo-data.infinityfree.sql` was imported into the selected database.
