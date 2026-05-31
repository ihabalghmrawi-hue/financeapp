-- Comprehensive fix: add all columns that application code expects
-- but were missing from the original schema definitions.
-- Each ALTER uses IF NOT EXISTS so this is safe to re-run.

-- ═══════════════════════════════════════════════════════════════
-- 1. sales — POS route inserts change_amount, discount_percent,
--    due_amount, payment_status
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS change_amount    NUMERIC(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2)   NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS due_amount       NUMERIC(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status   TEXT          NOT NULL DEFAULT 'paid';

-- ═══════════════════════════════════════════════════════════════
-- 2. sale_items — POS / sales.service inserts discount_amount,
--    tax_rate, line_number, and uses discount_pct as discount_percent
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE sale_items
  ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2)  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_rate        NUMERIC(5,2)  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS line_number     INT;

-- ═══════════════════════════════════════════════════════════════
-- 3. customer_transactions — code uses method, sale_id, notes
--    (schema has note, source_id; both coexist)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE customer_transactions
  ADD COLUMN IF NOT EXISTS method  TEXT,
  ADD COLUMN IF NOT EXISTS sale_id UUID,
  ADD COLUMN IF NOT EXISTS notes   TEXT;

-- ═══════════════════════════════════════════════════════════════
-- 4. shifts — shifts route inserts cashier_name, opening_cash,
--    closing_cash, expected_cash, difference, sales_count, notes
--    (schema has opening_balance, closing_balance)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE shifts
  ADD COLUMN IF NOT EXISTS cashier_name   TEXT,
  ADD COLUMN IF NOT EXISTS opening_cash   NUMERIC(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS closing_cash   NUMERIC(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expected_cash  NUMERIC(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS difference     NUMERIC(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sales_count    INT           NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes          TEXT;

-- ═══════════════════════════════════════════════════════════════
-- 5. returns — returns route inserts return_number, warehouse_id,
--    subtotal, refund_amount, status, notes
--    (schema has reference; add return_number as alias)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE returns
  ADD COLUMN IF NOT EXISTS return_number TEXT,
  ADD COLUMN IF NOT EXISTS warehouse_id  UUID REFERENCES warehouses(id),
  ADD COLUMN IF NOT EXISTS subtotal      NUMERIC(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status        TEXT          NOT NULL DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS notes         TEXT;

-- ═══════════════════════════════════════════════════════════════
-- 6. return_items — returns route inserts sale_item_id, reason
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE return_items
  ADD COLUMN IF NOT EXISTS sale_item_id UUID,
  ADD COLUMN IF NOT EXISTS reason       TEXT;

-- ═══════════════════════════════════════════════════════════════
-- 7. journal_entries — journal.ts / engine.ts insert source_document,
--    auto_generated, fiscal_year_id, reversal_entry_id, approved_by
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS source_document   TEXT,
  ADD COLUMN IF NOT EXISTS auto_generated    BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fiscal_year_id    UUID,
  ADD COLUMN IF NOT EXISTS reversal_entry_id UUID REFERENCES journal_entries(id),
  ADD COLUMN IF NOT EXISTS reversal_of       UUID REFERENCES journal_entries(id),
  ADD COLUMN IF NOT EXISTS approved_by       UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS entry_number      TEXT,
  ADD COLUMN IF NOT EXISTS total_debit       NUMERIC(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_credit      NUMERIC(15,2) NOT NULL DEFAULT 0;

-- ═══════════════════════════════════════════════════════════════
-- 8. transactions — wallet.repository / accounting inserts
--    wallet_id, reference_type, reference_id
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS wallet_id       UUID REFERENCES wallets(id),
  ADD COLUMN IF NOT EXISTS reference_type  TEXT,
  ADD COLUMN IF NOT EXISTS reference_id    TEXT;

-- ═══════════════════════════════════════════════════════════════
-- 9. accounts — soft-delete pattern (is_deleted)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;

-- ═══════════════════════════════════════════════════════════════
-- 10. rental_returns — rental.service inserts order_id
--     (schema has rental_order_id; add alias)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE rental_returns
  ADD COLUMN IF NOT EXISTS order_id UUID;

-- ═══════════════════════════════════════════════════════════════
-- 11. con_expenses — code inserts expense_date
--     (schema has date; add alias)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE con_expenses
  ADD COLUMN IF NOT EXISTS expense_date DATE;

-- ═══════════════════════════════════════════════════════════════
-- 12. dresses — code may reference status='retired'
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE dresses
  DROP CONSTRAINT IF EXISTS dresses_status_check;
ALTER TABLE dresses
  ADD CONSTRAINT dresses_status_check
    CHECK (status IN ('available', 'rented', 'maintenance', 'retired'));

NOTIFY pgrst, 'reload schema';
