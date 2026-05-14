-- Fix rental_orders: make reference nullable (replaced by order_number)
ALTER TABLE rental_orders ALTER COLUMN reference DROP NOT NULL;
ALTER TABLE rental_orders ALTER COLUMN reference SET DEFAULT NULL;
UPDATE rental_orders SET order_number = reference WHERE order_number IS NULL;
