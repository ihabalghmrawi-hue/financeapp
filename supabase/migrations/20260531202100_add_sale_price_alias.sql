-- Add sale_price column (code uses sale_price, schema had sell_price)
-- Also add cost_price if missing (should exist but just in case)

ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price NUMERIC(15,2) NOT NULL DEFAULT 0;
