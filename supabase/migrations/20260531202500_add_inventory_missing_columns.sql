-- Add columns that the application code expects but were missing from the schema.
-- The code inserts these columns but they didn't exist, causing silent failures
-- in inventory updates for purchases, sales, and returns.

ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS reserved_quantity NUMERIC(15,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS business_type TEXT;

ALTER TABLE inventory_movements
  ADD COLUMN IF NOT EXISTS quantity_before NUMERIC(15,3),
  ADD COLUMN IF NOT EXISTS quantity_after  NUMERIC(15,3),
  ADD COLUMN IF NOT EXISTS notes          TEXT,
  ADD COLUMN IF NOT EXISTS reference_id   UUID,
  ADD COLUMN IF NOT EXISTS reference_type TEXT;

NOTIFY pgrst, 'reload schema';
