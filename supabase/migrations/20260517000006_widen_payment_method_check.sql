-- Widen payment_method CHECK constraints to match values used by the UI.
-- UI sends: cash, bank_transfer, check, online
-- Old schema allowed: cash, transfer, check, credit

ALTER TABLE con_payments DROP CONSTRAINT IF EXISTS con_payments_payment_method_check;
ALTER TABLE con_payments
  ADD CONSTRAINT con_payments_payment_method_check
  CHECK (payment_method IN ('cash','transfer','bank_transfer','check','credit','online'));

ALTER TABLE con_expenses DROP CONSTRAINT IF EXISTS con_expenses_payment_method_check;
ALTER TABLE con_expenses
  ADD CONSTRAINT con_expenses_payment_method_check
  CHECK (payment_method IN ('cash','transfer','bank_transfer','check','credit','online'));

-- Also widen the legacy method column constraint on con_payments if any
DO $$
DECLARE c text;
BEGIN
  SELECT conname INTO c FROM pg_constraint
   WHERE conrelid = 'con_payments'::regclass
     AND pg_get_constraintdef(oid) ILIKE '%method%IN%'
     AND conname <> 'con_payments_payment_method_check'
   LIMIT 1;
  IF c IS NOT NULL THEN
    EXECUTE format('ALTER TABLE con_payments DROP CONSTRAINT %I', c);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
