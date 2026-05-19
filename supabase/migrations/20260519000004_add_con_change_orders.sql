-- Change order management

CREATE TABLE IF NOT EXISTS con_change_orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id      UUID NOT NULL REFERENCES con_projects(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  amount_change   NUMERIC(15,2) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected')),
  approved_by     TEXT,
  approved_at     DATE,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_con_change_orders_company ON con_change_orders(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_con_change_orders_project ON con_change_orders(project_id);

NOTIFY pgrst, 'reload schema';
