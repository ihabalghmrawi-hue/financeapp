-- Create super_admins table if not exists (required by impersonation RLS)
CREATE TABLE IF NOT EXISTS super_admins (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admins_select_self" ON super_admins
  FOR SELECT USING (auth.jwt() ->> 'email' = email);

CREATE TABLE IF NOT EXISTS impersonation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'tenant_owner',
  reason TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_admin
  ON impersonation_sessions(admin_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_active
  ON impersonation_sessions(admin_id)
  WHERE ended_at IS NULL;

ALTER TABLE impersonation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_select_impersonation"
  ON impersonation_sessions FOR SELECT
  USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM super_admins
    )
  );

CREATE POLICY "super_admin_insert_impersonation"
  ON impersonation_sessions FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM super_admins
    )
  );

CREATE POLICY "super_admin_update_impersonation"
  ON impersonation_sessions FOR UPDATE
  USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM super_admins
    )
  );
