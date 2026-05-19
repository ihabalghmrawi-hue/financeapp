-- ═══════════════════════════════════════════════════════════════
-- Phase 5 — Equipment, Subcontractors, Safety Incidents
-- ═══════════════════════════════════════════════════════════════

-- Equipment / Machinery Tracking
CREATE TABLE IF NOT EXISTS con_equipment (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'other',
  model           TEXT,
  serial_number   TEXT,
  status          TEXT NOT NULL DEFAULT 'available',
  daily_rate      NUMERIC(10,2) NOT NULL DEFAULT 0,
  purchase_date   DATE,
  last_maintenance DATE,
  next_maintenance DATE,
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_con_equipment_company ON con_equipment(company_id, status);
CREATE INDEX IF NOT EXISTS idx_con_equipment_type ON con_equipment(company_id, type);

-- Subcontractors
CREATE TABLE IF NOT EXISTS con_subcontractors (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  phone           TEXT,
  specialty       TEXT NOT NULL DEFAULT 'general',
  contract_value  NUMERIC(15,2) NOT NULL DEFAULT 0,
  start_date      DATE,
  end_date        DATE,
  status          TEXT NOT NULL DEFAULT 'active',
  rating          INT,
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_con_subcontractors_company ON con_subcontractors(company_id, status);
CREATE INDEX IF NOT EXISTS idx_con_subcontractors_specialty ON con_subcontractors(company_id, specialty);

-- Safety Incidents
CREATE TABLE IF NOT EXISTS con_safety_incidents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id      UUID REFERENCES con_projects(id) ON DELETE SET NULL,
  incident_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  type            TEXT NOT NULL DEFAULT 'other',
  severity        TEXT NOT NULL DEFAULT 'low',
  description     TEXT NOT NULL,
  location        TEXT,
  reported_by     TEXT,
  actions_taken   TEXT,
  status          TEXT NOT NULL DEFAULT 'open',
  resolved_at     DATE,
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_con_safety_incidents_company ON con_safety_incidents(company_id, incident_date DESC);
CREATE INDEX IF NOT EXISTS idx_con_safety_incidents_project ON con_safety_incidents(project_id);
CREATE INDEX IF NOT EXISTS idx_con_safety_incidents_status ON con_safety_incidents(company_id, status);
