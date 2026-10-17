<?php
/**
 * NOVA Home — shared PHP bootstrap (Backend Phase 1).
 *
 * Responsibilities ONLY:
 *  1. Load configuration (local config/config.php, fallback to config.example values)
 *  2. Set error-reporting policy from config (display only in development)
 *  3. Start a secure session on demand (lazy — not on every include)
 *  4. Expose the PDO connection via nova_db()
 *  5. Load common helpers (functions.php, validation.php)
 *
 * No business logic lives here. Include with:
 *   require_once __DIR__ . '/../includes/bootstrap.php';
 */

declare(strict_types=1);

define('NOVA_ROOT', dirname(__DIR__));

// ---------------------------------------------------------------------------
// 1. Configuration
// ---------------------------------------------------------------------------
$configFile = NOVA_ROOT . '/config/config.php';
$config = is_file($configFile)
    ? require $configFile
    : [
        'env'      => 'development',
        'debug'    => true,
        'db'       => [
            'host' => '127.0.0.1', 'port' => 3306, 'name' => 'nova_home',
            'user' => 'root', 'pass' => '', 'charset' => 'utf8mb4',
        ],
        'base_url' => null,
        'business' => ['delivery_fee' => 60, 'free_delivery_threshold' => 1500],
    ];

define('NOVA_ENV', $config['env'] ?? 'development');
define('NOVA_DEBUG', (bool) ($config['debug'] ?? false));

// ---------------------------------------------------------------------------
// 2. Error policy — file logging always; on-screen display in dev only.
// ---------------------------------------------------------------------------
error_reporting(E_ALL);
ini_set('display_errors', NOVA_DEBUG ? '1' : '0');
ini_set('log_errors', '1');

// ---------------------------------------------------------------------------
// 3. Secure session infrastructure (lazy starter — call nova_session()).
// ---------------------------------------------------------------------------
function nova_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    session_set_cookie_params([
        'lifetime' => 0,          // session cookie: expires with the browser
        'path'     => '/',
        'domain'   => '',
        'secure'   => $secure,    // HTTPS-only cookie when served over TLS
        'httponly' => true,       // never readable from JavaScript
        'samesite' => 'Lax',      // CSRF-friendly default for a shop
    ]);
    session_start();
}

// ---------------------------------------------------------------------------
// 4. Database + 5. Helpers
// ---------------------------------------------------------------------------
require_once NOVA_ROOT . '/config/database.php';
require_once NOVA_ROOT . '/includes/functions.php';
require_once NOVA_ROOT . '/includes/validation.php';

/** Shortcut: shared PDO for the current request. */
function nova_pdo(): PDO
{
    global $config;
    return nova_db($config);
}
