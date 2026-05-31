-- Add expiry_date and batch_number columns to products table
-- These were defined in business-types-schema.sql but never applied as a migration

ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS batch_number TEXT;

-- Index for expiry tracking (pharmacy use case)
CREATE INDEX IF NOT EXISTS idx_products_expiry_date ON products(expiry_date);
