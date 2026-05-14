-- Fix rental_orders: make old-schema columns nullable (replaced by new column names)
ALTER TABLE rental_orders ALTER COLUMN reference DROP NOT NULL;
ALTER TABLE rental_orders ALTER COLUMN reference SET DEFAULT NULL;
ALTER TABLE rental_orders ALTER COLUMN daily_price DROP NOT NULL;
ALTER TABLE rental_orders ALTER COLUMN daily_price SET DEFAULT 0;
ALTER TABLE rental_orders ALTER COLUMN total DROP NOT NULL;
ALTER TABLE rental_orders ALTER COLUMN total SET DEFAULT 0;
UPDATE rental_orders SET order_number = reference WHERE order_number IS NULL;
UPDATE rental_orders SET daily_price = rental_price WHERE daily_price IS NULL AND rental_price IS NOT NULL;
UPDATE rental_orders SET total = total_price WHERE total IS NULL AND total_price IS NOT NULL;
