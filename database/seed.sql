-- ===========================================================================
-- NOVA Home - seed data (Backend Phase 1)
-- Migrated 1:1 from js/products.js (verified: 14 products, 5 categories).
-- Idempotent: categories/products/settings use INSERT ... ON DUPLICATE KEY
-- UPDATE; product_images/product_specifications are fully derived snapshots
-- rebuilt with DELETE + INSERT (safe: no orders reference them in Phase 1).
-- Run AFTER schema.sql:
--   C:/xampp/mysql/bin/mysql.exe -u root nova_home < database/seed.sql
-- Never touch the `healthbridge` database.
-- ===========================================================================
USE `nova_home`;
-- --------------------------------------------------------------- categories
INSERT INTO `categories` (`slug`, `name`, `image`, `sort_order`) VALUES
  ('decor',     'Decor',     'assets/images/cat-decor.svg',     1),
  ('lighting',  'Lighting',  'assets/images/cat-lighting.svg',  2),
  ('kitchen',   'Kitchen',   'assets/images/cat-kitchen.svg',   3),
  ('storage',   'Storage',   'assets/images/cat-storage.svg',   4),
  ('furniture', 'Furniture', 'assets/images/cat-furniture.svg', 5)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `image` = VALUES(`image`), `sort_order` = VALUES(`sort_order`);
-- ---------------------------------------------------------------- products
INSERT INTO `products` (`slug`, `category_id`, `name`, `price`, `old_price`, `rating`, `reviews_count`, `is_new`, `is_best`, `description`, `active`) VALUES
  ('sahara-vase', (SELECT `id` FROM `categories` WHERE `slug` = 'decor'), 'Sahara Ceramic Vase', 890, 1100, 4.7, 38, 0, 1, 'A hand-finished ceramic vase with a soft matte glaze in warm clay. Sits well on a console, dining table or shelf, with or without flowers.', 1),
  ('luna-floor-lamp', (SELECT `id` FROM `categories` WHERE `slug` = 'lighting'), 'Luna Arc Floor Lamp', 2450, NULL, 4.6, 21, 1, 1, 'A slim steel floor lamp with a linen-textured shade that gives a warm, even glow. Suits reading corners and living rooms.', 1),
  ('olive-serving-board', (SELECT `id` FROM `categories` WHERE `slug` = 'kitchen'), 'Olive Wood Serving Board', 480, NULL, 4.8, 54, 0, 1, 'A solid olive wood board with natural grain variation, finished with food-safe oil. Good for bread, cheese and serving.', 1),
  ('nile-basket-set', (SELECT `id` FROM `categories` WHERE `slug` = 'storage'), 'Nile Woven Basket Set', 720, 890, 4.5, 29, 0, 0, 'Set of two woven baskets for blankets, toys or laundry. Sturdy handles and a tidy, natural look.', 1),
  ('halo-mirror', (SELECT `id` FROM `categories` WHERE `slug` = 'decor'), 'Halo Round Wall Mirror', 1650, NULL, 4.6, 17, 1, 0, 'A round mirror with a slim black metal frame. Works in an entryway, bedroom or above a dresser.', 1),
  ('dune-table-lamp', (SELECT `id` FROM `categories` WHERE `slug` = 'lighting'), 'Dune Bedside Table Lamp', 990, NULL, 4.4, 24, 0, 1, 'A compact table lamp with a ceramic base and a fabric shade for soft bedside lighting.', 1),
  ('terra-mug-set', (SELECT `id` FROM `categories` WHERE `slug` = 'kitchen'), 'Terra Stoneware Mug Set', 540, NULL, 4.7, 46, 0, 1, 'Four stoneware mugs with a speckled finish. Microwave and dishwasher safe.', 1),
  ('aswan-side-table', (SELECT `id` FROM `categories` WHERE `slug` = 'furniture'), 'Aswan Oak Side Table', 2900, NULL, 4.6, 12, 0, 0, 'A round side table in oak veneer with a solid wood base. Sized for beside a sofa or bed.', 1),
  ('cairo-boucle-chair', (SELECT `id` FROM `categories` WHERE `slug` = 'furniture'), 'Cairo Boucle Accent Chair', 6800, 7900, 4.8, 33, 0, 1, 'A rounded accent chair upholstered in soft boucle fabric on a sturdy wooden frame.', 1),
  ('stack-shelf', (SELECT `id` FROM `categories` WHERE `slug` = 'storage'), 'Stack Modular Shelf', 3200, NULL, 4.5, 19, 1, 0, 'A four-tier open shelf in warm wood tones for books, plants and everyday items.', 1),
  ('pillar-candles', (SELECT `id` FROM `categories` WHERE `slug` = 'decor'), 'Pillar Soy Candle Trio', 420, NULL, 4.3, 41, 0, 0, 'Three unscented soy wax pillar candles in neutral tones. Burn time around 30 hours each.', 1),
  ('oasis-pendant', (SELECT `id` FROM `categories` WHERE `slug` = 'lighting'), 'Oasis Pendant Light', 1850, 2200, 4.5, 15, 0, 0, 'A dome pendant in matte terracotta with a black cord. Good over a dining table or kitchen counter.', 1),
  ('copper-rack', (SELECT `id` FROM `categories` WHERE `slug` = 'kitchen'), 'Copper Utensil Rack', 610, NULL, 4.4, 22, 0, 0, 'A wall-mounted rack with five hooks for ladles, whisks and spatulas. Keeps the counter clear.', 1),
  ('minimal-clock', (SELECT `id` FROM `categories` WHERE `slug` = 'decor'), 'Minimal Wall Clock', 560, NULL, 4.2, 27, 0, 0, 'A quiet-movement wall clock with a clean face and no numbers. Runs on one AA battery.', 1)
ON DUPLICATE KEY UPDATE `category_id` = VALUES(`category_id`), `name` = VALUES(`name`), `price` = VALUES(`price`), `old_price` = VALUES(`old_price`), `rating` = VALUES(`rating`), `reviews_count` = VALUES(`reviews_count`), `is_new` = VALUES(`is_new`), `is_best` = VALUES(`is_best`), `description` = VALUES(`description`), `active` = VALUES(`active`);
-- ----------------------------------------------------------- product images
-- Real product photography in modern WebP format.
-- Backend code must read these rows, never guess filenames from the slug.
DELETE FROM `product_images`;
INSERT INTO `product_images` (`product_id`, `image_path`, `sort_order`, `alt_text`) VALUES
  ((SELECT `id` FROM `products` WHERE `slug` = 'sahara-vase'), 'assets/images/products/sahara-vase/main.webp', 0, 'Handcrafted ceramic vases with soft matte glaze in warm clay'),
  ((SELECT `id` FROM `products` WHERE `slug` = 'luna-floor-lamp'), 'assets/images/products/luna-floor-lamp/main.webp', 0, 'Slim steel arc floor lamp with linen-textured shade in living room'),
  ((SELECT `id` FROM `products` WHERE `slug` = 'olive-serving-board'), 'assets/images/products/olive-serving-board/main.webp', 0, 'Solid olive wood serving board with natural grain variation'),
  ((SELECT `id` FROM `products` WHERE `slug` = 'nile-basket-set'), 'assets/images/products/nile-basket-set/main.webp', 0, 'Set of two natural woven storage baskets with sturdy handles'),
  ((SELECT `id` FROM `products` WHERE `slug` = 'halo-mirror'), 'assets/images/products/halo-mirror/main.webp', 0, 'Round wall mirror with slim black metal frame in minimalist interior'),
  ((SELECT `id` FROM `products` WHERE `slug` = 'dune-table-lamp'), 'assets/images/products/dune-table-lamp/main.webp', 0, 'Compact bedside table lamp with ceramic base and warm fabric shade'),
  ((SELECT `id` FROM `products` WHERE `slug` = 'terra-mug-set'), 'assets/images/products/terra-mug-set/main.webp', 0, 'Four stoneware ceramic mugs with a speckled handcrafted finish'),
  ((SELECT `id` FROM `products` WHERE `slug` = 'aswan-side-table'), 'assets/images/products/aswan-side-table/main.webp', 0, 'Round oak veneer side table with solid wood base'),
  ((SELECT `id` FROM `products` WHERE `slug` = 'cairo-boucle-chair'), 'assets/images/products/cairo-boucle-chair/main.webp', 0, 'Rounded accent chair upholstered in soft boucle fabric'),
  ((SELECT `id` FROM `products` WHERE `slug` = 'stack-shelf'), 'assets/images/products/stack-shelf/main.webp', 0, 'Four-tier open modular shelf in warm wood tones'),
  ((SELECT `id` FROM `products` WHERE `slug` = 'pillar-candles'), 'assets/images/products/pillar-candles/main.webp', 0, 'Three unscented soy wax pillar candles in neutral tones'),
  ((SELECT `id` FROM `products` WHERE `slug` = 'oasis-pendant'), 'assets/images/products/oasis-pendant/main.webp', 0, 'Dome pendant light in matte terracotta with warm ambient glow'),
  ((SELECT `id` FROM `products` WHERE `slug` = 'copper-rack'), 'assets/images/products/copper-rack/main.webp', 0, 'Wall-mounted copper utensil rack with hooks for kitchen accessories'),
  ((SELECT `id` FROM `products` WHERE `slug` = 'minimal-clock'), 'assets/images/products/minimal-clock/main.webp', 0, 'Minimalist wall clock with clean numberless face');
-- ----------------------------------------------------- product specifications
-- One row per [key, value] pair from each product's specs array in products.js.
DELETE FROM `product_specifications`;
INSERT INTO `product_specifications` (`product_id`, `spec_key`, `spec_value`, `sort_order`) VALUES
  ((SELECT `id` FROM `products` WHERE `slug` = 'sahara-vase'), 'Material', 'Glazed ceramic', 0),
  ((SELECT `id` FROM `products` WHERE `slug` = 'sahara-vase'), 'Height', '32 cm', 1),
  ((SELECT `id` FROM `products` WHERE `slug` = 'sahara-vase'), 'Colour', 'Clay', 2),
  ((SELECT `id` FROM `products` WHERE `slug` = 'luna-floor-lamp'), 'Material', 'Powder-coated steel, fabric shade', 0),
  ((SELECT `id` FROM `products` WHERE `slug` = 'luna-floor-lamp'), 'Height', '158 cm', 1),
  ((SELECT `id` FROM `products` WHERE `slug` = 'luna-floor-lamp'), 'Bulb', 'E27, up to 40W (not included)', 2),
  ((SELECT `id` FROM `products` WHERE `slug` = 'olive-serving-board'), 'Material', 'Olive wood', 0),
  ((SELECT `id` FROM `products` WHERE `slug` = 'olive-serving-board'), 'Size', '42 x 18 cm', 1),
  ((SELECT `id` FROM `products` WHERE `slug` = 'olive-serving-board'), 'Care', 'Hand wash only', 2),
  ((SELECT `id` FROM `products` WHERE `slug` = 'nile-basket-set'), 'Material', 'Water hyacinth fibre', 0),
  ((SELECT `id` FROM `products` WHERE `slug` = 'nile-basket-set'), 'Sizes', '30 cm and 38 cm', 1),
  ((SELECT `id` FROM `products` WHERE `slug` = 'nile-basket-set'), 'Pieces', '2', 2),
  ((SELECT `id` FROM `products` WHERE `slug` = 'halo-mirror'), 'Material', 'Metal frame, glass', 0),
  ((SELECT `id` FROM `products` WHERE `slug` = 'halo-mirror'), 'Diameter', '70 cm', 1),
  ((SELECT `id` FROM `products` WHERE `slug` = 'halo-mirror'), 'Mounting', 'Wall hooks included', 2),
  ((SELECT `id` FROM `products` WHERE `slug` = 'dune-table-lamp'), 'Material', 'Ceramic, fabric', 0),
  ((SELECT `id` FROM `products` WHERE `slug` = 'dune-table-lamp'), 'Height', '38 cm', 1),
  ((SELECT `id` FROM `products` WHERE `slug` = 'dune-table-lamp'), 'Bulb', 'E27, up to 25W (not included)', 2),
  ((SELECT `id` FROM `products` WHERE `slug` = 'terra-mug-set'), 'Material', 'Stoneware', 0),
  ((SELECT `id` FROM `products` WHERE `slug` = 'terra-mug-set'), 'Capacity', '320 ml each', 1),
  ((SELECT `id` FROM `products` WHERE `slug` = 'terra-mug-set'), 'Pieces', '4', 2),
  ((SELECT `id` FROM `products` WHERE `slug` = 'aswan-side-table'), 'Material', 'Oak veneer, solid wood legs', 0),
  ((SELECT `id` FROM `products` WHERE `slug` = 'aswan-side-table'), 'Size', '45 cm diameter, 52 cm high', 1),
  ((SELECT `id` FROM `products` WHERE `slug` = 'aswan-side-table'), 'Assembly', 'Legs screw in, no tools', 2),
  ((SELECT `id` FROM `products` WHERE `slug` = 'cairo-boucle-chair'), 'Material', 'Boucle fabric, beech frame', 0),
  ((SELECT `id` FROM `products` WHERE `slug` = 'cairo-boucle-chair'), 'Size', '72 x 74 x 78 cm', 1),
  ((SELECT `id` FROM `products` WHERE `slug` = 'cairo-boucle-chair'), 'Colour', 'Ivory', 2),
  ((SELECT `id` FROM `products` WHERE `slug` = 'stack-shelf'), 'Material', 'Engineered wood, steel', 0),
  ((SELECT `id` FROM `products` WHERE `slug` = 'stack-shelf'), 'Size', '80 x 30 x 150 cm', 1),
  ((SELECT `id` FROM `products` WHERE `slug` = 'stack-shelf'), 'Assembly', 'Required, tools included', 2),
  ((SELECT `id` FROM `products` WHERE `slug` = 'pillar-candles'), 'Material', 'Soy wax, cotton wick', 0),
  ((SELECT `id` FROM `products` WHERE `slug` = 'pillar-candles'), 'Sizes', '7, 10 and 12 cm', 1),
  ((SELECT `id` FROM `products` WHERE `slug` = 'pillar-candles'), 'Scent', 'Unscented', 2),
  ((SELECT `id` FROM `products` WHERE `slug` = 'oasis-pendant'), 'Material', 'Painted metal', 0),
  ((SELECT `id` FROM `products` WHERE `slug` = 'oasis-pendant'), 'Diameter', '35 cm', 1),
  ((SELECT `id` FROM `products` WHERE `slug` = 'oasis-pendant'), 'Cable', '120 cm, adjustable', 2),
  ((SELECT `id` FROM `products` WHERE `slug` = 'copper-rack'), 'Material', 'Coated steel', 0),
  ((SELECT `id` FROM `products` WHERE `slug` = 'copper-rack'), 'Length', '50 cm', 1),
  ((SELECT `id` FROM `products` WHERE `slug` = 'copper-rack'), 'Mounting', 'Screws included', 2),
  ((SELECT `id` FROM `products` WHERE `slug` = 'minimal-clock'), 'Material', 'Metal, glass', 0),
  ((SELECT `id` FROM `products` WHERE `slug` = 'minimal-clock'), 'Diameter', '30 cm', 1),
  ((SELECT `id` FROM `products` WHERE `slug` = 'minimal-clock'), 'Movement', 'Silent quartz', 2);
-- ------------------------------------------------------------------ settings
-- Seeded from the audited frontend (delivery rules) + footer contact details.
-- Once backend integration begins, this table is the source of truth.
INSERT INTO `settings` (`key`, `value`) VALUES
  ('business_name', 'NOVA Home'),
  ('phone', '+20 100 123 4567'),
  ('email', 'hello@novahome.eg'),
  ('address', 'Cairo, Egypt'),
  ('delivery_fee', '60'),
  ('free_delivery_threshold', '1500')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);
