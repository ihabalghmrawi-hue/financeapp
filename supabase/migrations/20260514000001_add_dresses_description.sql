-- Add missing columns to dresses table for compatibility with new API
-- The dresses table was originally created with schema-v2.sql (legacy)
-- which has "notes" and "daily_price" instead of "description" and "rental_price"

ALTER TABLE dresses ADD COLUMN IF NOT EXISTS description  TEXT;
ALTER TABLE dresses ADD COLUMN IF NOT EXISTS rental_price NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE dresses ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ DEFAULT NOW();

-- Copy data from legacy columns to new columns if they exist
UPDATE dresses SET description   = notes        WHERE description IS NULL AND notes IS NOT NULL;
UPDATE dresses SET rental_price  = daily_price  WHERE rental_price = 0 AND daily_price > 0;
