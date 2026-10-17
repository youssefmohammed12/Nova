<?php
/** NOVA Home - /api/customer-addresses.php (Phase 9). Saved addresses for the
 * AUTHENTICATED customer only. GET lists own addresses (default first).
 * POST action=create|update|delete|default. Every mutation is scoped
 * WHERE id = :id AND customer_id = :me (cross-customer access impossible).
 * At most 10 addresses; at most one default (transactional swaps); deleting
 * the default promotes the oldest remaining address. Cities validated via
 * v_city() (same controlled list as checkout/orders).
 */
declare(strict_types=1);
require_once __DIR__ . '/../includes/bootstrap.php';
require_once NOVA_ROOT . '/includes/customer-auth.php';
require_customer(true);
$me = nova_customer_user();
if ($me === null) {
    json_response(['success' => false, 'error' => 'Authentication required.'], 401);
}
$pdo = nova_pdo();

/** Shared field validation for create/update. Returns [values, errors]. */
function nova_addr_validate(array $body): array
{
    $label = v_text($body['label'] ?? '', 60);
    $recipient = v_text($body['recipient_name'] ?? '', 120);
    $phone = trim((string) ($body['phone'] ?? ''));
    $city = v_city($body['city'] ?? null);
    $address = v_text($body['address'] ?? '', 255);
    $apartment = v_text($body['apartment'] ?? '', 120);
    $isDefault = !empty($body['is_default']) ? 1 : 0;
    $errs = [];
    if ($recipient === '') {
        $errs[] = 'Recipient name is required.';
    }
    if (!v_phone_eg($phone)) {
        $errs[] = 'Enter a valid phone number.';
    }
    if ($city === null) {
        $errs[] = 'Please choose a supported city.';
    }
    if ($address === '') {
        $errs[] = 'Street address is required.';
    }
    return [['label' => $label, 'recipient_name' => $recipient, 'phone' => $phone,
        'city' => $city, 'address' => $address, 'apartment' => $apartment,
        'is_default' => $isDefault], $errs];
}

try {
    if (strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
        $stmt = $pdo->prepare(
            'SELECT `id`, `label`, `recipient_name`, `phone`, `city`, `address`, `apartment`, `is_default`'
            . ' FROM `customer_addresses` WHERE `customer_id` = :me'
            . ' ORDER BY `is_default` DESC, `id` ASC'
        );
        $stmt->execute([':me' => $me['id']]);
        $out = [];
        foreach ($stmt->fetchAll() as $r) {
            $out[] = ['id' => (int) $r['id'], 'label' => (string) $r['label'],
                'recipient_name' => (string) $r['recipient_name'], 'phone' => (string) $r['phone'],
                'city' => (string) $r['city'], 'address' => (string) $r['address'],
                'apartment' => (string) $r['apartment'], 'is_default' => (int) $r['is_default'] === 1];
        }
        json_response(['success' => true, 'data' => $out]);
    }
    if (!is_post()) {
        json_response(['success' => false, 'error' => 'Method not allowed.'], 405);
    }
    if (!nova_verify_csrf($_POST['csrf_token'] ?? null)) {
        json_response(['success' => false, 'error' => 'Session expired. Please refresh and try again.'], 400);
    }
    $action = (string) ($_POST['action'] ?? '');

    if ($action === 'create' || $action === 'update') {
        [$values, $errs] = nova_addr_validate((array) $_POST);
        if ($errs) {
            json_response(['success' => false, 'error' => implode(' ', $errs), 'errors' => $errs], 400);
        }
        if ($action === 'create') {
            $cnt = $pdo->prepare('SELECT COUNT(*) FROM `customer_addresses` WHERE `customer_id` = :me');
            $cnt->execute([':me' => $me['id']]);
            if ((int) $cnt->fetchColumn() >= 10) {
                json_response(['success' => false, 'error' => 'You can save up to 10 addresses.'], 400);
            }
            $pdo->beginTransaction();
            if ($values['is_default'] === 1) {
                $clear = $pdo->prepare('UPDATE `customer_addresses` SET `is_default` = 0 WHERE `customer_id` = :me');
                $clear->execute([':me' => $me['id']]);
            }
            $ins = $pdo->prepare(
                'INSERT INTO `customer_addresses` (`customer_id`, `label`, `recipient_name`, `phone`, `city`, `address`, `apartment`, `is_default`)'
                . ' VALUES (:me, :label, :rn, :phone, :city, :addr, :apt, :def)'
            );
            $ins->execute([':me' => $me['id'], ':label' => $values['label'], ':rn' => $values['recipient_name'],
                ':phone' => $values['phone'], ':city' => $values['city'], ':addr' => $values['address'],
                ':apt' => $values['apartment'], ':def' => $values['is_default']]);
            $newId = (int) $pdo->lastInsertId();
            // First address of an account always becomes the default.
            $first = $pdo->prepare('SELECT COUNT(*) FROM `customer_addresses` WHERE `customer_id` = :me AND `id` <> :id');
            $first->execute([':me' => $me['id'], ':id' => $newId]);
            if ((int) $first->fetchColumn() === 0) {
                $mark = $pdo->prepare('UPDATE `customer_addresses` SET `is_default` = 1 WHERE `id` = :id AND `customer_id` = :me');
                $mark->execute([':id' => $newId, ':me' => $me['id']]);
            }
            $pdo->commit();
            json_response(['success' => true, 'data' => ['id' => $newId]]);
        }
        // update: ownership enforced in WHERE.
        $id = v_int_range($_POST['id'] ?? null, 1, 1000000);
        if ($id === null) {
            json_response(['success' => false, 'error' => 'Address not found.'], 404);
        }
        $pdo->beginTransaction();
        if ($values['is_default'] === 1) {
            $clear = $pdo->prepare('UPDATE `customer_addresses` SET `is_default` = 0 WHERE `customer_id` = :me');
            $clear->execute([':me' => $me['id']]);
        }
        $upd = $pdo->prepare(
            'UPDATE `customer_addresses` SET `label` = :label, `recipient_name` = :rn, `phone` = :phone,'
            . ' `city` = :city, `address` = :addr, `apartment` = :apt, `is_default` = :def'
            . ' WHERE `id` = :id AND `customer_id` = :me'
        );
        $upd->execute([':label' => $values['label'], ':rn' => $values['recipient_name'],
            ':phone' => $values['phone'], ':city' => $values['city'], ':addr' => $values['address'],
            ':apt' => $values['apartment'], ':def' => $values['is_default'], ':id' => $id, ':me' => $me['id']]);
        if ($upd->rowCount() === 0) {
            $pdo->rollBack();
            json_response(['success' => false, 'error' => 'Address not found.'], 404);
        }
        $pdo->commit();
        json_response(['success' => true, 'data' => ['id' => $id]]);
    }

    if ($action === 'delete') {
        $id = v_int_range($_POST['id'] ?? null, 1, 1000000);
        if ($id === null) {
            json_response(['success' => false, 'error' => 'Address not found.'], 404);
        }
        $pdo->beginTransaction();
        $was = $pdo->prepare('SELECT `is_default` FROM `customer_addresses` WHERE `id` = :id AND `customer_id` = :me');
        $was->execute([':id' => $id, ':me' => $me['id']]);
        $row = $was->fetch();
        if (!$row) {
            $pdo->rollBack();
            json_response(['success' => false, 'error' => 'Address not found.'], 404);
        }
        $del = $pdo->prepare('DELETE FROM `customer_addresses` WHERE `id` = :id AND `customer_id` = :me');
        $del->execute([':id' => $id, ':me' => $me['id']]);
        if ((int) $row['is_default'] === 1) {
            // Promote the oldest remaining address so a default always exists.
            $next = $pdo->prepare('SELECT MIN(`id`) AS nid FROM `customer_addresses` WHERE `customer_id` = :me');
            $next->execute([':me' => $me['id']]);
            $nid = $next->fetch()['nid'];
            if ($nid !== null) {
                $mark = $pdo->prepare('UPDATE `customer_addresses` SET `is_default` = 1 WHERE `id` = :id AND `customer_id` = :me');
                $mark->execute([':id' => (int) $nid, ':me' => $me['id']]);
            }
        }
        $pdo->commit();
        json_response(['success' => true, 'data' => []]);
    }

    if ($action === 'default') {
        $id = v_int_range($_POST['id'] ?? null, 1, 1000000);
        if ($id === null) {
            json_response(['success' => false, 'error' => 'Address not found.'], 404);
        }
        $pdo->beginTransaction();
        $upd = $pdo->prepare('UPDATE `customer_addresses` SET `is_default` = 1 WHERE `id` = :id AND `customer_id` = :me');
        $upd->execute([':id' => $id, ':me' => $me['id']]);
        if ($upd->rowCount() === 0) {
            $pdo->rollBack();
            json_response(['success' => false, 'error' => 'Address not found.'], 404);
        }
        $clear = $pdo->prepare('UPDATE `customer_addresses` SET `is_default` = 0 WHERE `customer_id` = :me AND `id` <> :id');
        $clear->execute([':me' => $me['id'], ':id' => $id]);
        $pdo->commit();
        json_response(['success' => true, 'data' => ['id' => $id]]);
    }

    json_response(['success' => false, 'error' => 'Unknown action.'], 400);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('[NOVA api/customer-addresses] ' . $e->getMessage());
    json_response(['success' => false, 'error' => 'Unable to save your addresses right now.'], 500);
}
