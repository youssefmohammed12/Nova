<?php
declare(strict_types=1);
/**
 * NOVA Home - input validation helpers (Backend Phase 1).
 * Small focused validators for near-term POST forms (checkout, admin, auth).
 * All return clean values or null/false; never throw, never touch the DB.
 */
if (!function_exists('v_required')) {
    function v_required(mixed $value): bool
    {
        return trim((string) ($value ?? '')) !== '';
    }
}
if (!function_exists('v_email')) {
    function v_email(mixed $value): bool
    {
        $s = trim((string) ($value ?? ''));
        if ($s === '') {
            return false;
        }
        return filter_var($s, FILTER_VALIDATE_EMAIL) !== false;
    }
}
if (!function_exists('v_int_range')) {
    function v_int_range(mixed $value, int $min, int $max): ?int
    {
        $int = filter_var($value, FILTER_VALIDATE_INT);
        if ($int === false || $int < $min || $int > $max) {
            return null;
        }
        return $int;
    }
}
if (!function_exists('v_money_int')) {
    function v_money_int(mixed $value): ?int
    {
        return v_int_range($value, 0, 100000000);
    }
}
if (!function_exists('v_slug')) {
    function v_slug(mixed $value): bool
    {
        $s = (string) ($value ?? '');
        return $s !== '' && (bool) preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $s);
    }
}
if (!function_exists('v_phone_eg')) {
    function v_phone_eg(mixed $value): bool
    {
        $digits = preg_replace('/\D+/', '', (string) ($value ?? ''));
        $len = strlen($digits);
        return $len >= 8 && $len <= 15;
    }
}
if (!function_exists('v_image_path')) {
    /**
     * Admin image-path validation (Phase 6 / Photography Migration): only
     * existing project asset references are accepted — relative, inside
     * assets/images/, approved extensions (webp, jpg, jpeg, png, svg),
     * no traversal, no absolute paths, no URLs, resolving to an existing file.
     */
    function v_image_path(mixed $value): bool
    {
        $s = trim((string) ($value ?? ''));
        if ($s === '' || strlen($s) > 255) {
            return false;
        }
        if (strpos($s, '..') !== false || strpos($s, '\\') !== false || strpos($s, '://') !== false || ($s !== '' && $s[0] === '/') || strpos($s, "\0") !== false) {
            return false;
        }
        if (!preg_match('#^assets/images/(?:[a-zA-Z0-9_-]+/)*[a-zA-Z0-9_-]+\.(?:webp|jpg|jpeg|png|svg)$#i', $s)) {
            return false;
        }
        $root = defined('NOVA_ROOT') ? NOVA_ROOT : dirname(__DIR__);
        $allowedRoot = realpath($root . '/assets/images');
        $realFile = realpath($root . '/' . $s);
        if ($realFile === false || !is_file($realFile)) {
            return false;
        }
        if ($allowedRoot === false || strpos($realFile, $allowedRoot) !== 0) {
            return false;
        }
        return true;
    }
}
if (!function_exists('v_text')) {
    function v_text(mixed $value, int $maxLen = 500): string
    {
        $s = trim((string) ($value ?? ''));
        if (function_exists('mb_substr')) {
            return mb_substr($s, 0, $maxLen, 'UTF-8');
        }
        return substr($s, 0, $maxLen);
    }
}
