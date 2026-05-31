ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS payment_terms INTEGER DEFAULT 30;
NOTIFY pgrst, 'reload schema';
