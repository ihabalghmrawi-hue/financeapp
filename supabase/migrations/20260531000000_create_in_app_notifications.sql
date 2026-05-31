-- ═══════════════════════════════════════════════════════════════
--  Migration: Create in-app notifications table
--  ═══════════════════════════════════════════════════════════════
--  Stores persistent notifications generated from business events
--  (sales, payments, expenses, purchases, etc.) so the notification
--  panel shows both live-computed alerts AND event-driven alerts.
--  ═══════════════════════════════════════════════════════════════

-- ── 1. Create notifications table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,          -- e.g. 'sale_completed', 'payment_received', 'expense_recorded'
  title       TEXT NOT NULL,
  body        TEXT NOT NULL DEFAULT '',
  severity    TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error')),
  link        TEXT,                    -- optional deep link to the relevant page
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notifications_company
  ON notifications(company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications(company_id, is_read, created_at DESC);

-- ── 3. Enable RLS ──────────────────────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ── 4. RLS policies ────────────────────────────────────────────────────────────
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (company_id = (SELECT company_id FROM company_settings WHERE company_id = company_id));

CREATE POLICY "notifications_insert_own"
  ON notifications FOR INSERT
  WITH CHECK (company_id = (SELECT company_id FROM company_settings WHERE company_id = company_id));

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (company_id = (SELECT company_id FROM company_settings WHERE company_id = company_id));

-- Note: RLS subquery uses a self-referential pattern intentionally;
-- Supabase's session variable `app.company_id` is set by the middleware
-- and policies compare against it. For the admin client (service_role),
-- RLS is bypassed entirely.
