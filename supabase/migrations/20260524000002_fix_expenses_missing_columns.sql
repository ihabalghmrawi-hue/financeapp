-- Add missing columns to expenses table for expense_date, wallet_id, notes
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS expense_date DATE;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS wallet_id UUID;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE expenses ALTER COLUMN reference DROP NOT NULL;
ALTER TABLE expenses ALTER COLUMN reference SET DEFAULT NULL;
UPDATE expenses SET expense_date = date WHERE expense_date IS NULL;
