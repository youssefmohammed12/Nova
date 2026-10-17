-- ===========================================================================
-- NOVA Home - migration 001 (Phase 9): customer accounts.
-- Upgrades the EXISTING nova_home database safely (no drops, no data loss).
-- Fresh installs: database/schema.sql already contains these tables.
-- Procedure: mysqldump backup -> mysql -u root nova_home < this file -> verify.
-- Adds: customers, customer_addresses, orders.customer_id (nullable FK).
-- Historical guest orders keep customer_id = NULL (never back-filled).
-- ===========================================================================
USE `nova_home`;

CREATE TABLE IF NOT EXISTS `customers` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(160) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(30) NOT NULL DEFAULT '',
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_customers_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `customer_addresses` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `customer_id` INT UNSIGNED NOT NULL,
  `label` VARCHAR(60) NOT NULL DEFAULT '',
  `recipient_name` VARCHAR(120) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `city` VARCHAR(80) NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `apartment` VARCHAR(120) NOT NULL DEFAULT '',
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_addresses_customer` (`customer_id`),
  CONSTRAINT `fk_addresses_customer`
    FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional customer link on orders: guests stay NULL; FK SET NULL keeps
-- orders if an account is ever deleted (snapshots remain authoritative).
-- Guarded so re-running the migration is safe on MySQL/MariaDB.
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'nova_home' AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'customer_id');
SET @sql := IF(@col = 0,
  'ALTER TABLE `orders` ADD COLUMN `customer_id` INT UNSIGNED NULL DEFAULT NULL AFTER `order_ref`, ADD KEY `idx_orders_customer` (`customer_id`), ADD CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON UPDATE CASCADE ON DELETE SET NULL',
  'SELECT ''orders.customer_id already exists'' AS note');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
