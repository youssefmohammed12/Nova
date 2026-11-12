<?php
/**
 * NOVA Home — Phase 11 Automated API & Security Audit Suite.
 */
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$baseUrl = rtrim((string) (getenv('NOVA_BASE_URL') ?: 'http://localhost/nova-home/nova-home/'), '/') . '/';

function http_req(string $method, string $path, $data = null, array $headers = [], ?string &$cookieJar = null): array {
    global $baseUrl;
    $url = $baseUrl . ltrim($path, '/');
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

    $h = $headers;
    if (is_array($data)) {
        $body = json_encode($data);
        $h[] = 'Content-Type: application/json';
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    } elseif (is_string($data)) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    }

    if ($cookieJar !== null) {
        curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieJar);
        curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieJar);
    }

    curl_setopt($ch, CURLOPT_HTTPHEADER, $h);
    $response = curl_exec($ch);
    if ($response === false) {
        $error = curl_error($ch);
        curl_close($ch);
        return ['status' => 0, 'headers' => '', 'body' => '', 'json' => null, 'error' => $error];
    }
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    curl_close($ch);

    $rawHeader = substr($response, 0, $headerSize);
    $rawBody = substr($response, $headerSize);
    $json = json_decode($rawBody, true);

    return [
        'status' => $httpCode,
        'headers' => $rawHeader,
        'body' => $rawBody,
        'json' => $json,
    ];
}

$passed = 0;
$failed = 0;

function assert_test(bool $cond, string $msg, $actual = null): void {
    global $passed, $failed;
    if ($cond) {
        $passed++;
        echo "  [PASS] {$msg}\n";
    } else {
        $failed++;
        echo "  [FAIL] {$msg}" . ($actual !== null ? " (Got: " . json_encode($actual) . ")" : "") . "\n";
    }
}

echo "=== STAGE D: API AUDIT ===\n\n";

// 1. api/csrf.php
echo "1. Testing api/csrf.php...\n";
$res = http_req('GET', 'api/csrf.php');
assert_test($res['status'] === 200, 'GET api/csrf.php returns 200', $res['status']);
assert_test(!empty($res['json']['data']['csrf_token']), 'csrf_token returned in JSON', $res['json']);
$resPost = http_req('POST', 'api/csrf.php');
assert_test($resPost['status'] === 405, 'POST api/csrf.php returns 405 Method Not Allowed', $resPost['status']);

// 2. api/store-settings.php
echo "\n2. Testing api/store-settings.php...\n";
$res = http_req('GET', 'api/store-settings.php');
assert_test($res['status'] === 200, 'GET api/store-settings.php returns 200', $res['status']);
$keys = array_keys($res['json']['data'] ?? []);
sort($keys);
$expectedKeys = ['address', 'business_name', 'delivery_cities', 'delivery_fee', 'email', 'free_delivery_threshold', 'phone'];
sort($expectedKeys);
assert_test($keys === $expectedKeys, 'Only the 7 allowlisted public settings fields are returned', $keys);
assert_test(is_int($res['json']['data']['delivery_fee']), 'delivery_fee is integer', $res['json']['data']['delivery_fee']);
assert_test(is_int($res['json']['data']['free_delivery_threshold']), 'free_delivery_threshold is integer', $res['json']['data']['free_delivery_threshold']);
$cities = $res['json']['data']['delivery_cities'] ?? [];
$cityKeys = array_keys($cities);
sort($cityKeys);
assert_test($cityKeys === ['alexandria', 'cairo', 'fayoum', 'giza', 'mansoura', 'other', 'tanta'], 'Delivery city keys are the canonical 7-city set', $cityKeys);
assert_test(($cities['other'] ?? '') === 'Other Egypt', 'The other city label matches checkout and estimator copy', $cities['other'] ?? null);
$resPost = http_req('POST', 'api/store-settings.php');
assert_test($resPost['status'] === 405, 'POST api/store-settings.php returns 405', $resPost['status']);

// 3. api/categories.php
echo "\n3. Testing api/categories.php...\n";
$res = http_req('GET', 'api/categories.php');
assert_test($res['status'] === 200, 'GET api/categories.php returns 200', $res['status']);
assert_test(is_array($res['json']['data']) && count($res['json']['data']) === 5, 'Returns 5 categories', count($res['json']['data'] ?? []));

// 4. api/products.php
echo "\n4. Testing api/products.php...\n";
$res = http_req('GET', 'api/products.php');
assert_test($res['status'] === 200, 'GET api/products.php returns 200', $res['status']);
assert_test(count($res['json']['data'] ?? []) === 14, 'Returns 14 products', count($res['json']['data'] ?? []));
$resBadCat = http_req('GET', 'api/products.php?category=invalid-cat-slug-that-is-not-alphanumeric!');
assert_test($resBadCat['status'] === 400, 'Invalid category slug returns 400', $resBadCat['status']);
$resBadPrice = http_req('GET', 'api/products.php?min_price=1000&max_price=500');
assert_test($resBadPrice['status'] === 400, 'min_price > max_price returns 400', $resBadPrice['status']);

// 5. api/product.php
echo "\n5. Testing api/product.php...\n";
$res = http_req('GET', 'api/product.php?slug=sahara-vase');
assert_test($res['status'] === 200, 'GET api/product.php?slug=sahara-vase returns 200', $res['status']);
assert_test(($res['json']['data']['product']['slug'] ?? '') === 'sahara-vase', 'Returns sahara-vase details');
assert_test(count($res['json']['data']['images'] ?? []) >= 1, 'Product has images');
assert_test(count($res['json']['data']['specifications'] ?? []) >= 1, 'Product has specifications');
$res404 = http_req('GET', 'api/product.php?slug=non-existent-vase');
assert_test($res404['status'] === 404, 'Non-existent product returns 404', $res404['status']);
$resNoSlug = http_req('GET', 'api/product.php');
assert_test($resNoSlug['status'] === 404, 'Missing slug returns 404', $resNoSlug['status']);

// 6. api/orders.php negative tests
echo "\n6. Testing api/orders.php negative validation...\n";
$res = http_req('GET', 'api/orders.php');
assert_test($res['status'] === 405, 'GET api/orders.php returns 405', $res['status']);
$res = http_req('POST', 'api/orders.php', '');
assert_test($res['status'] === 401 && ($res['json']['code'] ?? '') === 'auth_required', 'Unauthenticated order submission is rejected before parsing (401)', $res['status']);
$res = http_req('POST', 'api/orders.php', ['csrf_token' => 'invalid_csrf']);
assert_test($res['status'] === 401 && ($res['json']['code'] ?? '') === 'auth_required', 'Unauthenticated order submission is rejected before CSRF validation (401)', $res['status']);

// 7. api/order.php authorization / IDOR tests
echo "\n7. Testing api/order.php authorization & IDOR...\n";
$res = http_req('POST', 'api/order.php');
assert_test($res['status'] === 405, 'POST api/order.php returns 405', $res['status']);
$res = http_req('GET', 'api/order.php');
assert_test($res['status'] === 400, 'GET api/order.php without ref returns 400', $res['status']);
$res = http_req('GET', 'api/order.php?ref=invalid-format');
assert_test($res['status'] === 400, 'Malformed ref returns 400', $res['status']);
// Testing with an actual existing order reference (NH-20261005-14464A) from an unauthenticated session:
$res = http_req('GET', 'api/order.php?ref=NH-20261005-14464A');
assert_test($res['status'] === 404, 'Unbound session accessing existing order returns uniform 404', $res['status']);
$res = http_req('GET', 'api/order.php?ref=NH-99999999-FFFFFF');
assert_test($res['status'] === 404, 'Non-existent ref returns uniform 404', $res['status']);

// 8. api/admin-login.php
echo "\n8. Testing api/admin-login.php...\n";
$res = http_req('GET', 'api/admin-login.php');
assert_test($res['status'] === 405, 'GET api/admin-login.php returns 405', $res['status']);
$res = http_req('POST', 'api/admin-login.php', ['email' => 'admin@novahome.eg', 'password' => 'wrongpass', 'csrf_token' => 'invalid']);
assert_test($res['status'] === 400, 'POST with bad CSRF returns 400', $res['status']);

// 9. api/customer-*.php
echo "\n9. Testing customer endpoints unauthenticated access...\n";
$res = http_req('GET', 'api/customer-profile.php');
assert_test($res['status'] === 401, 'Unauth GET api/customer-profile.php returns 401', $res['status']);
$res = http_req('POST', 'api/customer-profile.php');
assert_test($res['status'] === 401, 'Unauth POST api/customer-profile.php returns 401', $res['status']);
$res = http_req('GET', 'api/customer-addresses.php');
assert_test($res['status'] === 401, 'Unauth GET api/customer-addresses.php returns 401', $res['status']);
$res = http_req('POST', 'api/customer-addresses.php');
assert_test($res['status'] === 401, 'Unauth POST api/customer-addresses.php returns 401', $res['status']);

// 10. customer registration requires explicit Terms/Privacy acceptance at the API.
echo "\n10. Testing customer registration consent enforcement...\n";
$consentCookieJar = tempnam(sys_get_temp_dir(), 'nova-consent-');
$consentCsrfRes = http_req('GET', 'api/csrf.php', null, [], $consentCookieJar);
$consentToken = $consentCsrfRes['json']['data']['csrf_token'] ?? '';
assert_test($consentCsrfRes['status'] === 200 && $consentToken !== '', 'Registration consent test obtains a session CSRF token');
if ($consentToken !== '') {
    $res = http_req('POST', 'api/customer-register.php', [
        'terms_accepted' => false,
        'csrf_token' => $consentToken,
    ], [], $consentCookieJar);
    assert_test(
        $res['status'] === 400 && str_contains((string) ($res['json']['error'] ?? ''), 'accept the Terms'),
        'Registration API rejects missing Terms/Privacy consent before account creation',
        $res['status']
    );
}
if (is_file($consentCookieJar)) {
    unlink($consentCookieJar);
}

echo "\nSummary: {$passed} passed, {$failed} failed.\n";
