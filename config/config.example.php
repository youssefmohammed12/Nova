<?php
/**
 * NOVA Home — local configuration TEMPLATE (tracked example).
 *
 * SETUP: copy this file to `config/config.php` and adjust the values for your
 * machine. `config/config.php` is LOCAL-ONLY and git-ignored — it is where
 * real credentials live and it must NEVER be committed. This
 * `config.example.php` file is the only configuration tracked in Git and it
 * contains no secrets.
 *
 * ── Values to review during setup ─────────────────────────────────────────
 * db.*             Database connection. The defaults below match a stock
 *                  XAMPP setup (user `root`, empty password, database
 *                  `nova_home`) and are safe for LOCAL development only.
 *                  Use a dedicated least-privilege user with a strong
 *                  password in production.
 * base_url         Public URL path of the app root, with leading and trailing
 *                  slash. null = auto-detect from the request (works whether
 *                  the project lives at /nova-home/ or /nova-home/nova-home/ —
 *                  see relocation note in PROJECT_GUIDE.md).
 *                  Set explicitly in production, e.g. 'base_url' => '/',
 *                  or 'base_url' => '/shop/' when in a subdirectory.
 * env + debug      'development' | 'production'. Production MUST use
 *                  'env' => 'production' and 'debug' => false so PHP errors
 *                  are logged server-side and never displayed to visitors.
 * demo_access      Development-only one-click demo sign-in switch (see below).
 *                  Keep false.
 * public_demo_access  PUBLIC one-click demo switch for the hosted portfolio
 *                  demonstration (see below). Keep false except on the
 *                  intentional public demo site.
 *
 * ── Development-only demo sign-in ──────────────────────────────────────────
 * The demo customer/admin shortcuts (`api/demo-customer-login.php`,
 * `api/demo-admin-login.php`) are enforced SERVER-SIDE and require BOTH:
 *   1. 'env' => 'development'
 *   2. 'demo_access' => true
 * The committed default below is false, so a fresh checkout cannot enable
 * demo sign-in — even if a URL or client-side variable is manipulated, the
 * handlers return 403 unless both conditions hold. Only enable this in a
 * local development config; NEVER enable it on a public production server.
 *
 * ── Public (hosted) demo sign-in ───────────────────────────────────────────
 * A SEPARATE switch powers the interactive portfolio demonstration:
 *   `api/public-demo-customer-login.php` and `api/public-demo-admin-login.php`
 *   require ONLY 'public_demo_access' => true — they are independent of env
 *   and debug, so the public demo runs on a normal production configuration
 *   (env=production, debug=false). They sign in FIXED synthetic identities
 *   (demo.customer@novahome.eg / demo.admin@novahome.eg) established by
 *   `database/demo-data.infinityfree.sql`; no id, email, or role can be
 *   supplied by the client. Keep false everywhere except the intentional
 *   public demonstration. Recommended public-demo production set:
 *     'env' => 'production', 'debug' => false,
 *     'demo_access' => false, 'public_demo_access' => true.
 *
 * ── Frontend note ──────────────────────────────────────────────────────────
 * Delivery defaults below mirror the audited frontend values
 * (`NOVA.DELIVERY_FEE = 60`, `NOVA.FREE_DELIVERY_OVER = 1500` in
 * `js/products.js`). They are fallbacks only — the `settings` database table
 * is the source of truth (see `includes/functions.php` → `nova_setting()`).
 */

declare(strict_types=1);

return [
    // 'development' | 'production'. Controls error display in bootstrap.
    'env'   => 'development',
    'debug' => true,

    // One-click demo sign-in (development ONLY). Disabled by default.
    // Requires env === 'development' as well; production config must keep this false.
    'demo_access' => false,

    // Public one-click demo sign-in (HOSTED PORTFOLIO DEMO ONLY).
    // When true, api/public-demo-customer-login.php and
    // api/public-demo-admin-login.php accept one-click sign-in for the
    // dedicated demo identities, independent of env/debug. Keep false
    // everywhere except the intentional public demonstration site.
    'public_demo_access' => false,

    // PDO connection parameters (see config/database.php). No mysqli anywhere.
    'db' => [
        'host'    => '127.0.0.1',
        'port'    => 3306,
        'name'    => 'nova_home',
        'user'    => 'root',
        'pass'    => '', // XAMPP local default. Production secret goes ONLY in config.php.
        'charset' => 'utf8mb4',
    ],

    // Public URL path of the app root, with leading and trailing slash.
    // null = auto-detect from the request (works whether the project lives at
    // /nova-home/ or /nova-home/nova-home/ — see relocation note in PROJECT_GUIDE.md).
    // Set explicitly for production, e.g. 'base_url' => '/',
    'base_url' => null,

    // Fallback business values. Mirrors of the frontend; DB settings win when available.
    'business' => [
        'delivery_fee'            => 60,
        'free_delivery_threshold' => 1500,
    ],
];
