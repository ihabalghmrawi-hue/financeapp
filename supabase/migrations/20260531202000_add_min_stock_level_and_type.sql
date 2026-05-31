-- Add min_stock_level and type columns to products table

ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock_level NUMERIC(15,2) NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'product';
