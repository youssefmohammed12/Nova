<?php
/**
 * NOVA Home — PDO connection factory (Backend Phase 1).
 *
 * Single reusable PDO entry-point. Rules enforced here:
 *  - PDO only (no mysqli anywhere in the project)
 *  - prepared statements are the ONLY query style (callers must comply)
 *  - ERRMODE_EXCEPTION, FETCH_ASSOC default, emulated prepares OFF
 *  - utf8mb4 charset on the DSN
 *
 * @return PDO Shared connection instance (one per request).
 * @throws PDOException When the connection fails (message is generic until logged).
 */

declare(strict_types=1);

function nova_db(array $config): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $db      = $config['db'];
    $charset = $db['charset'] ?? 'utf8mb4';
    $dsn     = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        $db['host'],
        (int) $db['port'],
        $db['name'],
        $charset
    );

    $pdo = new PDO($dsn, $db['user'], $db['pass'], [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false, // real server-side prepares
    ]);

    return $pdo;
}
