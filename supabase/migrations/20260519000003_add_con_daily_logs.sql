-- Daily progress reports with photos

CREATE TABLE IF NOT EXISTS con_daily_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id    UUID NOT NULL REFERENCES con_projects(id) ON DELETE CASCADE,
  log_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  weather       TEXT,
  workers_count INT NOT NULL DEFAULT 0,
  hours_worked  NUMERIC(4,1) NOT NULL DEFAULT 8,
  notes         TEXT,
  photo_urls    JSONB NOT NULL DEFAULT '[]',
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_con_daily_logs_company ON con_daily_logs(company_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_con_daily_logs_project ON con_daily_logs(project_id);

NOTIFY pgrst, 'reload schema';
