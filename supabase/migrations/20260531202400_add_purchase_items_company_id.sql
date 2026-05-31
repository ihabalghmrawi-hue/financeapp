ALTER TABLE purchase_items ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
NOTIFY pgrst, 'reload schema';
