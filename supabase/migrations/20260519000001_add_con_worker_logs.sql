-- Worker attendance / timesheet system

CREATE TABLE IF NOT EXISTS con_worker_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id    UUID REFERENCES con_projects(id) ON DELETE SET NULL,
  worker_id     UUID NOT NULL REFERENCES con_workers(id) ON DELETE CASCADE,
  log_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  days_worked   NUMERIC(3,1) NOT NULL DEFAULT 1,
  amount_paid   NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_con_worker_logs_company ON con_worker_logs(company_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_con_worker_logs_worker  ON con_worker_logs(worker_id);
CREATE INDEX IF NOT EXISTS idx_con_worker_logs_project ON con_worker_logs(project_id);

NOTIFY pgrst, 'reload schema';
