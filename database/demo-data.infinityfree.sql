-- ===========================================================================
-- NOVA Home - PUBLIC DEMO ACCOUNTS (phpMyAdmin import for hosted databases)
-- File: database/demo-data.infinityfree.sql
--
-- Purpose: create/refresh the DEDICATED public demonstration identities and
-- their synthetic sample data on an already-initialized database:
--   * demo customer  demo.customer@novahome.eg  (Sarah El-Masry)
--   * 2 saved addresses, 5 sample orders / 9 line items (all statuses)
--   * demo administrator  demo.admin@novahome.eg  (NOVA Demo Admin)
--
-- Safe to import REPEATEDLY:
--   * INSERT-only with NOT EXISTS guards — never mutates or deletes existing
--     rows (your own customer/admin accounts, orders, and catalog are
--     untouched; the catalog must already exist via database/seed.sql).
--   * Sample orders are only created while the demo customer has no orders
--     outside this demo set, so an existing installation (or the locally
--     CLI-seeded demo with its own sample orders) is left untouched.
--   * Identities resolve by EMAIL; product rows resolve by SLUG. No numeric
--     ids are assumed.
--
-- Compatibility: MySQL 5.7+ / MariaDB 10.x (phpMyAdmin friendly).
-- No CREATE DATABASE, no USE statement, no CLI/SSH required.
--
-- Passwords: password_hash values only (bcrypt). The plaintexts are random and
-- undisclosed — the public demo signs visitors in one-click through
-- api/public-demo-*-login.php, which requires 'public_demo_access' => true.
--
-- Wishlist: the established `nova_wish` localStorage behaviour is provided by
-- the login response payload (product slugs), not by a database table.
-- ===========================================================================

START TRANSACTION;

-- ---------------------------------------------------------------------------
-- 1) Demo customer (unique email key; insert-only)
-- ---------------------------------------------------------------------------
INSERT INTO `customers` (`name`, `email`, `password_hash`, `phone`, `active`)
SELECT 'Sarah El-Masry', 'demo.customer@novahome.eg',
       '$2y$10$RqtnRNg2lLgOYpAmLm1wDuZ/fDNwdkfsEvIIW4cYcWyvTxthMQY8m',
       '+20 112 345 6789', 1
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM `customers` WHERE `email` = 'demo.customer@novahome.eg'
);

-- ---------------------------------------------------------------------------
-- 2) Two synthetic saved addresses (insert-only, per label)
-- ---------------------------------------------------------------------------
INSERT INTO `customer_addresses`
  (`customer_id`, `label`, `recipient_name`, `phone`, `city`, `address`, `apartment`, `is_default`)
SELECT c.`id`, 'Home', 'Sarah El-Masry', '+20 112 345 6789', 'Cairo',
       '14 Hassan Sabry Street, Zamalek', 'Apt 7B, 3rd Floor', 1
FROM `customers` c
WHERE c.`email` = 'demo.customer@novahome.eg'
  AND NOT EXISTS (
    SELECT 1 FROM `customer_addresses` a
    WHERE a.`customer_id` = c.`id` AND a.`label` = 'Home'
  );

INSERT INTO `customer_addresses`
  (`customer_id`, `label`, `recipient_name`, `phone`, `city`, `address`, `apartment`, `is_default`)
SELECT c.`id`, 'Office', 'Sarah El-Masry', '+20 100 987 6543', 'Cairo',
       '28 Mohamed Farid Street, Downtown', 'Suite 402', 0
FROM `customers` c
WHERE c.`email` = 'demo.customer@novahome.eg'
  AND NOT EXISTS (
    SELECT 1 FROM `customer_addresses` a
    WHERE a.`customer_id` = c.`id` AND a.`label` = 'Office'
  );

-- ---------------------------------------------------------------------------
-- 3) Five sample orders (delivered / shipped / confirmed / pending / cancelled)
--    Deterministic refs match the app format ^NH-\d{8}-[A-F0-9]{6}$ (unique key).
--    Created ONLY while the demo customer has zero orders (no duplicates).
--    Totals are recomputed from catalog prices + settings fees at import time,
--    matching the server-side rule: free delivery at/above the threshold.
-- ---------------------------------------------------------------------------

INSERT INTO `orders`
  (`order_ref`, `customer_id`, `customer_name`, `phone`, `email`, `city`, `address`,
   `notes`, `payment_method`, `subtotal`, `delivery_fee`, `total`, `status`, `created_at`)
SELECT 'NH-20260915-DEA101', c.`id`, c.`name`, c.`phone`, c.`email`, 'Cairo',
       '14 Hassan Sabry Street, Zamalek', 'NOVA_DEMO_ORDER', 'cod',
       t.`sub`, IF(t.`sub` >= t.`thr`, 0, t.`fee`), t.`sub` + IF(t.`sub` >= t.`thr`, 0, t.`fee`),
       'delivered', '2026-09-15 14:30:00'
FROM `customers` c
JOIN (
    SELECT
      (SELECT `price` FROM `products` WHERE `slug` = 'cairo-boucle-chair') * 1
    + (SELECT `price` FROM `products` WHERE `slug` = 'halo-mirror') * 1 AS `sub`,
      COALESCE((SELECT CAST(`value` AS UNSIGNED) FROM `settings` WHERE `key` = 'free_delivery_threshold'), 1500) AS `thr`,
      COALESCE((SELECT CAST(`value` AS UNSIGNED) FROM `settings` WHERE `key` = 'delivery_fee'), 60) AS `fee`
    FROM DUAL
) t
WHERE c.`email` = 'demo.customer@novahome.eg'
  AND NOT EXISTS (SELECT 1 FROM `orders` o WHERE o.`order_ref` = 'NH-20260915-DEA101')
  AND (SELECT COUNT(*) FROM `orders` o WHERE o.`customer_id` = c.`id`
       AND o.`order_ref` NOT IN ('NH-20260915-DEA101','NH-20261002-DEA102','NH-20261010-DEA103','NH-20261014-DEA104','NH-20261008-DEA105')) = 0;

INSERT INTO `orders`
  (`order_ref`, `customer_id`, `customer_name`, `phone`, `email`, `city`, `address`,
   `notes`, `payment_method`, `subtotal`, `delivery_fee`, `total`, `status`, `created_at`)
SELECT 'NH-20261002-DEA102', c.`id`, c.`name`, c.`phone`, c.`email`, 'Cairo',
       '14 Hassan Sabry Street, Zamalek', 'NOVA_DEMO_ORDER', 'cod',
       t.`sub`, IF(t.`sub` >= t.`thr`, 0, t.`fee`), t.`sub` + IF(t.`sub` >= t.`thr`, 0, t.`fee`),
       'shipped', '2026-10-02 10:15:00'
FROM `customers` c
JOIN (
    SELECT
      (SELECT `price` FROM `products` WHERE `slug` = 'aswan-side-table') * 1
    + (SELECT `price` FROM `products` WHERE `slug` = 'dune-table-lamp') * 1 AS `sub`,
      COALESCE((SELECT CAST(`value` AS UNSIGNED) FROM `settings` WHERE `key` = 'free_delivery_threshold'), 1500) AS `thr`,
      COALESCE((SELECT CAST(`value` AS UNSIGNED) FROM `settings` WHERE `key` = 'delivery_fee'), 60) AS `fee`
    FROM DUAL
) t
WHERE c.`email` = 'demo.customer@novahome.eg'
  AND NOT EXISTS (SELECT 1 FROM `orders` o WHERE o.`order_ref` = 'NH-20261002-DEA102')
  AND (SELECT COUNT(*) FROM `orders` o WHERE o.`customer_id` = c.`id`
       AND o.`order_ref` NOT IN ('NH-20260915-DEA101','NH-20261002-DEA102','NH-20261010-DEA103','NH-20261014-DEA104','NH-20261008-DEA105')) = 0;

INSERT INTO `orders`
  (`order_ref`, `customer_id`, `customer_name`, `phone`, `email`, `city`, `address`,
   `notes`, `payment_method`, `subtotal`, `delivery_fee`, `total`, `status`, `created_at`)
SELECT 'NH-20261010-DEA103', c.`id`, c.`name`, c.`phone`, c.`email`, 'Cairo',
       '28 Mohamed Farid Street, Downtown', 'NOVA_DEMO_ORDER', 'cod',
       t.`sub`, IF(t.`sub` >= t.`thr`, 0, t.`fee`), t.`sub` + IF(t.`sub` >= t.`thr`, 0, t.`fee`),
       'confirmed', '2026-10-10 16:45:00'
FROM `customers` c
JOIN (
    SELECT
      (SELECT `price` FROM `products` WHERE `slug` = 'sahara-vase') * 2
    + (SELECT `price` FROM `products` WHERE `slug` = 'minimal-clock') * 1 AS `sub`,
      COALESCE((SELECT CAST(`value` AS UNSIGNED) FROM `settings` WHERE `key` = 'free_delivery_threshold'), 1500) AS `thr`,
      COALESCE((SELECT CAST(`value` AS UNSIGNED) FROM `settings` WHERE `key` = 'delivery_fee'), 60) AS `fee`
    FROM DUAL
) t
WHERE c.`email` = 'demo.customer@novahome.eg'
  AND NOT EXISTS (SELECT 1 FROM `orders` o WHERE o.`order_ref` = 'NH-20261010-DEA103')
  AND (SELECT COUNT(*) FROM `orders` o WHERE o.`customer_id` = c.`id`
       AND o.`order_ref` NOT IN ('NH-20260915-DEA101','NH-20261002-DEA102','NH-20261010-DEA103','NH-20261014-DEA104','NH-20261008-DEA105')) = 0;

INSERT INTO `orders`
  (`order_ref`, `customer_id`, `customer_name`, `phone`, `email`, `city`, `address`,
   `notes`, `payment_method`, `subtotal`, `delivery_fee`, `total`, `status`, `created_at`)
SELECT 'NH-20261014-DEA104', c.`id`, c.`name`, c.`phone`, c.`email`, 'Cairo',
       '14 Hassan Sabry Street, Zamalek', 'NOVA_DEMO_ORDER', 'cod',
       t.`sub`, IF(t.`sub` >= t.`thr`, 0, t.`fee`), t.`sub` + IF(t.`sub` >= t.`thr`, 0, t.`fee`),
       'pending', '2026-10-14 09:20:00'
FROM `customers` c
JOIN (
    SELECT
      (SELECT `price` FROM `products` WHERE `slug` = 'olive-serving-board') * 1
    + (SELECT `price` FROM `products` WHERE `slug` = 'terra-mug-set') * 2 AS `sub`,
      COALESCE((SELECT CAST(`value` AS UNSIGNED) FROM `settings` WHERE `key` = 'free_delivery_threshold'), 1500) AS `thr`,
      COALESCE((SELECT CAST(`value` AS UNSIGNED) FROM `settings` WHERE `key` = 'delivery_fee'), 60) AS `fee`
    FROM DUAL
) t
WHERE c.`email` = 'demo.customer@novahome.eg'
  AND NOT EXISTS (SELECT 1 FROM `orders` o WHERE o.`order_ref` = 'NH-20261014-DEA104')
  AND (SELECT COUNT(*) FROM `orders` o WHERE o.`customer_id` = c.`id`
       AND o.`order_ref` NOT IN ('NH-20260915-DEA101','NH-20261002-DEA102','NH-20261010-DEA103','NH-20261014-DEA104','NH-20261008-DEA105')) = 0;

INSERT INTO `orders`
  (`order_ref`, `customer_id`, `customer_name`, `phone`, `email`, `city`, `address`,
   `notes`, `payment_method`, `subtotal`, `delivery_fee`, `total`, `status`, `created_at`)
SELECT 'NH-20261008-DEA105', c.`id`, c.`name`, c.`phone`, c.`email`, 'Cairo',
       '14 Hassan Sabry Street, Zamalek', 'NOVA_DEMO_ORDER', 'cod',
       t.`sub`, IF(t.`sub` >= t.`thr`, 0, t.`fee`), t.`sub` + IF(t.`sub` >= t.`thr`, 0, t.`fee`),
       'cancelled', '2026-10-08 11:00:00'
FROM `customers` c
JOIN (
    SELECT
      (SELECT `price` FROM `products` WHERE `slug` = 'pillar-candles') * 3 AS `sub`,
      COALESCE((SELECT CAST(`value` AS UNSIGNED) FROM `settings` WHERE `key` = 'free_delivery_threshold'), 1500) AS `thr`,
      COALESCE((SELECT CAST(`value` AS UNSIGNED) FROM `settings` WHERE `key` = 'delivery_fee'), 60) AS `fee`
    FROM DUAL
) t
WHERE c.`email` = 'demo.customer@novahome.eg'
  AND NOT EXISTS (SELECT 1 FROM `orders` o WHERE o.`order_ref` = 'NH-20261008-DEA105')
  AND (SELECT COUNT(*) FROM `orders` o WHERE o.`customer_id` = c.`id`
       AND o.`order_ref` NOT IN ('NH-20260915-DEA101','NH-20261002-DEA102','NH-20261010-DEA103','NH-20261014-DEA104','NH-20261008-DEA105')) = 0;

-- ---------------------------------------------------------------------------
-- 4) Nine order-item line snapshots (real catalog products, resolved by slug).
--    quantity CHECK constraint: 1..10
-- ---------------------------------------------------------------------------

INSERT INTO `order_items` (`order_id`, `product_id`, `product_name`, `unit_price`, `quantity`, `line_total`)
SELECT o.`id`, p.`id`, p.`name`, p.`price`, 1, p.`price` * 1
FROM `orders` o JOIN `products` p ON p.`slug` = 'cairo-boucle-chair'
WHERE o.`order_ref` = 'NH-20260915-DEA101'
  AND NOT EXISTS (SELECT 1 FROM `order_items` i WHERE i.`order_id` = o.`id`);

INSERT INTO `order_items` (`order_id`, `product_id`, `product_name`, `unit_price`, `quantity`, `line_total`)
SELECT o.`id`, p.`id`, p.`name`, p.`price`, 1, p.`price` * 1
FROM `orders` o JOIN `products` p ON p.`slug` = 'halo-mirror'
WHERE o.`order_ref` = 'NH-20260915-DEA101'
  AND NOT EXISTS (SELECT 1 FROM `order_items` i WHERE i.`order_id` = o.`id` AND i.`product_id` = p.`id`);

INSERT INTO `order_items` (`order_id`, `product_id`, `product_name`, `unit_price`, `quantity`, `line_total`)
SELECT o.`id`, p.`id`, p.`name`, p.`price`, 1, p.`price` * 1
FROM `orders` o JOIN `products` p ON p.`slug` = 'aswan-side-table'
WHERE o.`order_ref` = 'NH-20261002-DEA102'
  AND NOT EXISTS (SELECT 1 FROM `order_items` i WHERE i.`order_id` = o.`id`);

INSERT INTO `order_items` (`order_id`, `product_id`, `product_name`, `unit_price`, `quantity`, `line_total`)
SELECT o.`id`, p.`id`, p.`name`, p.`price`, 1, p.`price` * 1
FROM `orders` o JOIN `products` p ON p.`slug` = 'dune-table-lamp'
WHERE o.`order_ref` = 'NH-20261002-DEA102'
  AND NOT EXISTS (SELECT 1 FROM `order_items` i WHERE i.`order_id` = o.`id` AND i.`product_id` = p.`id`);

INSERT INTO `order_items` (`order_id`, `product_id`, `product_name`, `unit_price`, `quantity`, `line_total`)
SELECT o.`id`, p.`id`, p.`name`, p.`price`, 2, p.`price` * 2
FROM `orders` o JOIN `products` p ON p.`slug` = 'sahara-vase'
WHERE o.`order_ref` = 'NH-20261010-DEA103'
  AND NOT EXISTS (SELECT 1 FROM `order_items` i WHERE i.`order_id` = o.`id`);

INSERT INTO `order_items` (`order_id`, `product_id`, `product_name`, `unit_price`, `quantity`, `line_total`)
SELECT o.`id`, p.`id`, p.`name`, p.`price`, 1, p.`price` * 1
FROM `orders` o JOIN `products` p ON p.`slug` = 'minimal-clock'
WHERE o.`order_ref` = 'NH-20261010-DEA103'
  AND NOT EXISTS (SELECT 1 FROM `order_items` i WHERE i.`order_id` = o.`id` AND i.`product_id` = p.`id`);

INSERT INTO `order_items` (`order_id`, `product_id`, `product_name`, `unit_price`, `quantity`, `line_total`)
SELECT o.`id`, p.`id`, p.`name`, p.`price`, 1, p.`price` * 1
FROM `orders` o JOIN `products` p ON p.`slug` = 'olive-serving-board'
WHERE o.`order_ref` = 'NH-20261014-DEA104'
  AND NOT EXISTS (SELECT 1 FROM `order_items` i WHERE i.`order_id` = o.`id`);

INSERT INTO `order_items` (`order_id`, `product_id`, `product_name`, `unit_price`, `quantity`, `line_total`)
SELECT o.`id`, p.`id`, p.`name`, p.`price`, 2, p.`price` * 2
FROM `orders` o JOIN `products` p ON p.`slug` = 'terra-mug-set'
WHERE o.`order_ref` = 'NH-20261014-DEA104'
  AND NOT EXISTS (SELECT 1 FROM `order_items` i WHERE i.`order_id` = o.`id` AND i.`product_id` = p.`id`);

INSERT INTO `order_items` (`order_id`, `product_id`, `product_name`, `unit_price`, `quantity`, `line_total`)
SELECT o.`id`, p.`id`, p.`name`, p.`price`, 3, p.`price` * 3
FROM `orders` o JOIN `products` p ON p.`slug` = 'pillar-candles'
WHERE o.`order_ref` = 'NH-20261008-DEA105'
  AND NOT EXISTS (SELECT 1 FROM `order_items` i WHERE i.`order_id` = o.`id`);

-- ---------------------------------------------------------------------------
-- 5) Dedicated demo administrator (unique email key; insert-only).
--    Full, normal administrator — NOT the site owner's personal account and
--    never "the first admin in the table". The public endpoint
--    api/public-demo-admin-login.php signs in THIS row only.
-- ---------------------------------------------------------------------------
INSERT INTO `admin_users` (`name`, `email`, `password_hash`, `active`)
SELECT 'NOVA Demo Admin', 'demo.admin@novahome.eg',
       '$2y$10$W3f2RlL4xgv7Q3levFtOceBhaKjzVNaJYLdV7XMzQrmg6swKVUOR6', 1
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM `admin_users` WHERE `email` = 'demo.admin@novahome.eg'
);

COMMIT;

-- Verification (optional — run manually in phpMyAdmin):
--   SELECT email, active FROM customers  WHERE email LIKE 'demo.%@novahome.eg';
--   SELECT email, active FROM admin_users WHERE email LIKE 'demo.%@novahome.eg';
--   SELECT order_ref, status, subtotal, delivery_fee, total FROM orders
--    WHERE notes = 'NOVA_DEMO_ORDER' ORDER BY created_at;         -- expect 5
--   SELECT COUNT(*) FROM order_items i JOIN orders o ON o.id = i.order_id
--    WHERE o.notes = 'NOVA_DEMO_ORDER';                           -- expect 9
