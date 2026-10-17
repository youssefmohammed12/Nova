<?php
declare(strict_types=1);
/**
 * NOVA Home - shared helpers (Backend Phase 1).
 * Only genuinely reusable, near-term helpers. Every function has a real
 * current or Phase-2 purpose. No business logic beyond tiny accessors.
 */
if (!function_exists('e')) {
    function e(mixed $value): string
    {
        return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}
if (!function_exists('nova_config')) {
    function nova_config(string $key, mixed $default = null): mixed
    {
        global $config;
        $parts = explode('.', $key);
        $node = $config ?? [];
        foreach ($parts as $part) {
            if (!is_array($node) || !array_key_exists($part, $node)) {
                return $default;
            }
            $node = $node[$part];
        }
        return $node;
    }
}
if (!function_exists('nova_base_url')) {
    function nova_base_url(): string
    {
        $configured = nova_config('base_url');
        if (is_string($configured) && $configured !== '') {
            return '/' . trim($configured, '/') . '/';
        }
        $docRoot = isset($_SERVER['DOCUMENT_ROOT']) ? (string) $_SERVER['DOCUMENT_ROOT'] : '';
        $root = defined('NOVA_ROOT') ? NOVA_ROOT : dirname(__DIR__);
        $norm = static function (string $p): string {
            $p = str_replace('\\', '/', $p);
            return rtrim($p, '/');
        };
        if ($docRoot !== '' && str_starts_with($norm($root), $norm($docRoot))) {
            $rel = substr($norm($root), strlen($norm($docRoot)));
            $rel = '/' . trim($rel, '/');
            return $rel === '/' ? '/' : $rel . '/';
        }
        // Auto-detection failed (root not under DOCUMENT_ROOT, or CLI context).
        // Neutral default — set 'base_url' explicitly in config for any
        // environment where auto-detection cannot infer the correct path.
        return '/';
    }
}
if (!function_exists('nova_asset')) {
    function nova_asset(string $path): string
    {
        return nova_base_url() . ltrim($path, '/');
    }
}
if (!function_exists('nova_url')) {
    function nova_url(string $path = ''): string
    {
        return nova_base_url() . ltrim($path, '/');
    }
}
if (!function_exists('is_post')) {
    function is_post(): bool
    {
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST';
    }
}
if (!function_exists('redirect')) {
    function redirect(string $path, int $status = 302): never
    {
        $target = str_starts_with($path, 'http') ? $path : nova_url($path);
        header('Location: ' . $target, true, $status);
        exit;
    }
}
if (!function_exists('json_response')) {
    function json_response(mixed $data, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}
if (!function_exists('nova_csrf_token')) {
    function nova_csrf_token(): string
    {
        nova_session();
        if (empty($_SESSION['csrf_token']) || !is_string($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }
}
if (!function_exists('nova_csrf_field')) {
    function nova_csrf_field(): string
    {
        return '<input type="hidden" name="csrf_token" value="' . e(nova_csrf_token()) . '">';
    }
}
if (!function_exists('nova_verify_csrf')) {
    function nova_verify_csrf(?string $token): bool
    {
        nova_session();
        $stored = $_SESSION['csrf_token'] ?? '';
        if (!is_string($stored) || $stored === '' || !is_string($token) || $token === '') {
            return false;
        }
        return hash_equals($stored, $token);
    }
}
if (!function_exists('nova_setting')) {
    function nova_setting(string $key, mixed $default = null): mixed
    {
        static $cache = null;
        if ($cache === null) {
            try {
                $pdo = nova_pdo();
                $stmt = $pdo->query('SELECT `key`, `value` FROM settings');
                $cache = [];
                foreach ($stmt->fetchAll() as $row) {
                    $cache[$row['key']] = $row['value'];
                }
            } catch (Throwable $e) {
                $cache = [];
            }
        }
        if (array_key_exists($key, $cache)) {
            return $cache[$key];
        }
        $fallbacks = [
            'delivery_fee' => (string) nova_config('business.delivery_fee', '60'),
            'free_delivery_threshold' => (string) nova_config('business.free_delivery_threshold', '1500'),
        ];
        return $fallbacks[$key] ?? $default;
    }
}
if (!function_exists('nova_cities')) {
    /**
     * Controlled delivery-city list (single server-side source of truth).
     * Keys match the frontend NOVA.deliveryCities keys; labels match the
     * checkout <select> display names. ETA text stays frontend-informational.
     */
    function nova_cities(): array
    {
        return [
            'cairo' => 'Cairo',
            'giza' => 'Giza',
            'alexandria' => 'Alexandria',
            'mansoura' => 'Mansoura',
            'tanta' => 'Tanta',
            'fayoum' => 'Fayoum',
            'other' => 'Other',
            'other egypt' => 'Other Egypt',
        ];
    }
}
if (!function_exists('v_city')) {
    /** Validate a submitted city against the controlled list. Case-insensitive. */
    function v_city(mixed $value): ?string
    {
        $s = strtolower(trim((string) ($value ?? '')));
        if ($s === '') {
            return null;
        }
        // Accept both keys ('cairo') and display names ('Cairo').
        foreach (nova_cities() as $key => $label) {
            if ($s === $key || $s === strtolower($label)) {
                return $label;
            }
        }
        return null;
    }
}
if (!function_exists('nova_money')) {
    function nova_money(int|float $amount): string
    {
        return 'EGP ' . number_format((float) $amount, 0, '.', ',');
    }
}
