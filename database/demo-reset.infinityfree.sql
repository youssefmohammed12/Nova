-- ===========================================================================
-- NOVA Home - PUBLIC DEMO DATABASE RESET (phpMyAdmin import for hosted DBs)
-- File: database/demo-reset.infinityfree.sql
--
-- WARNING — DESTRUCTIVE, FOR THE DEMONSTRATION DATABASE ONLY.
-- This file removes records and changes made since the demo baseline:
--   * ALL order items and ALL orders (including any historical orders)
--   * products outside the baseline 14 catalog slugs
--   * categories outside the baseline 5 slugs
--   * every saved address of the demo customer
-- and restores the demo customer/admin identity rows to their baseline values.
-- It does NOT recreate catalog data itself — run the documented 3-step
-- sequence (this file → database/seed.sql → database/demo-data.infinityfree.sql)
-- through phpMyAdmin to reach the full baseline again.
--
-- NEVER run this against a database holding real customer data.
-- No HTTP endpoint calls this file; restoration is a manual phpMyAdmin action.
-- ===========================================================================

START TRANSACTION;

-- ---------------------------------------------------------------------------
-- 1) Orders (ALL) — order_items cascade with them; removed explicitly first
--    for clarity. Restored demo orders come from demo-data.infinityfree.sql.
-- ---------------------------------------------------------------------------
DELETE FROM `order_items`;
DELETE FROM `orders`;

-- ---------------------------------------------------------------------------
-- 2) Products outside the baseline catalog (visitor-created demo products).
--    Must run BEFORE categories (products.category_id is RESTRICT).
-- ---------------------------------------------------------------------------
DELETE FROM `products` WHERE `slug` NOT IN (
  'sahara-vase','luna-floor-lamp','olive-serving-board','nile-basket-set',
  'halo-mirror','dune-table-lamp','terra-mug-set','aswan-side-table',
  'cairo-boucle-chair','stack-shelf','pillar-candles','oasis-pendant',
  'copper-rack','minimal-clock'
);

-- ---------------------------------------------------------------------------
-- 3) Categories outside the baseline five (visitor-created demo categories).
--    Fails loudly (FK RESTRICT) if a baseline product still references a
--    non-baseline category — reassign those products in the admin UI first.
-- ---------------------------------------------------------------------------
DELETE FROM `categories` WHERE `slug` NOT IN (
  'decor','lighting','kitchen','storage','furniture'
);

-- ---------------------------------------------------------------------------
-- 4) Demo customer: remove ALL saved addresses (visitor-added or edited).
--    demo-data.infinityfree.sql recreates the two baseline addresses.
-- ---------------------------------------------------------------------------
DELETE FROM `customer_addresses` WHERE `customer_id` = (
  SELECT `id` FROM (SELECT `id` FROM `customers` WHERE `email` = 'demo.customer@novahome.eg') d
);

-- ---------------------------------------------------------------------------
-- 5) Restore the demo identity rows to baseline values (demo rows ONLY —
--    other customers/administrators, including the owner's accounts, are
--    never touched by this file).
-- ---------------------------------------------------------------------------
UPDATE `customers`
   SET `name` = 'Sarah El-Masry', `phone` = '+20 112 345 6789', `active` = 1
 WHERE `email` = 'demo.customer@novahome.eg';

UPDATE `admin_users`
   SET `name` = 'NOVA Demo Admin', `active` = 1
 WHERE `email` = 'demo.admin@novahome.eg';

COMMIT;

-- Catalog, product images/specifications, and the six store settings are NOT
-- restored here — database/seed.sql does that idempotently in step 2 of the
-- documented reset sequence. Demo accounts/orders/addresses are restored by
-- database/demo-data.infinityfree.sql in step 3.
