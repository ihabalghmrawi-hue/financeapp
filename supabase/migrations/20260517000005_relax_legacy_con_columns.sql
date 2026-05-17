-- Relax NOT NULL on legacy columns that the new API doesn't populate.
-- Also keep legacy columns in sync with new columns via triggers so older
-- code paths keep working.

-- ── con_expenses ─────────────────────────────────────────────────────
ALTER TABLE con_expenses ALTER COLUMN date         DROP NOT NULL;
ALTER TABLE con_expenses ALTER COLUMN project_id   DROP NOT NULL;
ALTER TABLE con_expenses ALTER COLUMN date         SET DEFAULT CURRENT_DATE;

CREATE OR REPLACE FUNCTION con_expenses_sync_legacy()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.date IS NULL THEN NEW.date := NEW.expense_date; END IF;
  IF NEW.expense_date IS NULL THEN NEW.expense_date := NEW.date; END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_con_expenses_sync ON con_expenses;
CREATE TRIGGER trg_con_expenses_sync
  BEFORE INSERT OR UPDATE ON con_expenses
  FOR EACH ROW EXECUTE FUNCTION con_expenses_sync_legacy();

-- ── con_payments ─────────────────────────────────────────────────────
ALTER TABLE con_payments ALTER COLUMN date       DROP NOT NULL;
ALTER TABLE con_payments ALTER COLUMN method     DROP NOT NULL;
ALTER TABLE con_payments ALTER COLUMN project_id DROP NOT NULL;
ALTER TABLE con_payments ALTER COLUMN date       SET DEFAULT CURRENT_DATE;

CREATE OR REPLACE FUNCTION con_payments_sync_legacy()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.date IS NULL THEN NEW.date := NEW.payment_date; END IF;
  IF NEW.payment_date IS NULL THEN NEW.payment_date := NEW.date; END IF;
  IF NEW.method IS NULL THEN NEW.method := NEW.payment_method; END IF;
  IF NEW.payment_method IS NULL THEN NEW.payment_method := NEW.method; END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_con_payments_sync ON con_payments;
CREATE TRIGGER trg_con_payments_sync
  BEFORE INSERT OR UPDATE ON con_payments
  FOR EACH ROW EXECUTE FUNCTION con_payments_sync_legacy();

-- ── con_materials ────────────────────────────────────────────────────
ALTER TABLE con_materials ALTER COLUMN unit_cost  DROP NOT NULL;
ALTER TABLE con_materials ALTER COLUMN date       DROP NOT NULL;
ALTER TABLE con_materials ALTER COLUMN project_id DROP NOT NULL;
ALTER TABLE con_materials ALTER COLUMN date       SET DEFAULT CURRENT_DATE;

CREATE OR REPLACE FUNCTION con_materials_sync_legacy()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.unit_cost IS NULL THEN NEW.unit_cost := NEW.unit_price; END IF;
  IF NEW.unit_price IS NULL OR NEW.unit_price = 0 THEN NEW.unit_price := NEW.unit_cost; END IF;
  IF NEW.date IS NULL THEN NEW.date := NEW.purchase_date; END IF;
  IF NEW.purchase_date IS NULL THEN NEW.purchase_date := NEW.date; END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_con_materials_sync ON con_materials;
CREATE TRIGGER trg_con_materials_sync
  BEFORE INSERT OR UPDATE ON con_materials
  FOR EACH ROW EXECUTE FUNCTION con_materials_sync_legacy();

NOTIFY pgrst, 'reload schema';
