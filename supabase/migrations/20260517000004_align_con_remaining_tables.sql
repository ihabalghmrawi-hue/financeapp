-- Align con_payments, con_expenses, con_materials with construction-schema.sql
-- Existing tables use legacy column names. Add the expected columns and
-- backfill from legacy ones where applicable.

-- ── con_payments ─────────────────────────────────────────────────────
ALTER TABLE con_payments
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS payment_date   date NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS notes          text;

-- Backfill from legacy columns if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='con_payments' AND column_name='method') THEN
    EXECUTE 'UPDATE con_payments SET payment_method = method WHERE payment_method IS NULL OR payment_method = ''cash''';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='con_payments' AND column_name='date') THEN
    EXECUTE 'UPDATE con_payments SET payment_date = date WHERE payment_date = CURRENT_DATE';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'con_payments_payment_method_check') THEN
    ALTER TABLE con_payments
      ADD CONSTRAINT con_payments_payment_method_check
      CHECK (payment_method IN ('cash','transfer','check','credit'));
  END IF;
END $$;

-- ── con_expenses ─────────────────────────────────────────────────────
ALTER TABLE con_expenses
  ADD COLUMN IF NOT EXISTS supplier       text,
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS expense_date   date NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS notes          text;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='con_expenses' AND column_name='date') THEN
    EXECUTE 'UPDATE con_expenses SET expense_date = date WHERE expense_date = CURRENT_DATE';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'con_expenses_payment_method_check') THEN
    ALTER TABLE con_expenses
      ADD CONSTRAINT con_expenses_payment_method_check
      CHECK (payment_method IN ('cash','transfer','check','credit'));
  END IF;
END $$;

-- ── con_materials ────────────────────────────────────────────────────
ALTER TABLE con_materials
  ADD COLUMN IF NOT EXISTS unit_price    numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchase_date date DEFAULT CURRENT_DATE;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='con_materials' AND column_name='unit_cost') THEN
    EXECUTE 'UPDATE con_materials SET unit_price = unit_cost WHERE unit_price = 0';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='con_materials' AND column_name='date') THEN
    EXECUTE 'UPDATE con_materials SET purchase_date = date WHERE purchase_date = CURRENT_DATE';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
