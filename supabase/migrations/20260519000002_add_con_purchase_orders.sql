-- Purchase order workflow for materials

CREATE TABLE IF NOT EXISTS con_purchase_orders (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id    UUID REFERENCES con_projects(id) ON DELETE SET NULL,
  supplier      TEXT NOT NULL,
  order_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','sent','partially_received','received','cancelled')),
  total         NUMERIC(15,2) NOT NULL DEFAULT 0,
  notes         TEXT,
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS con_purchase_order_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES con_purchase_orders(id) ON DELETE CASCADE,
  material_name   TEXT NOT NULL,
  quantity        NUMERIC(15,3) NOT NULL,
  unit            TEXT NOT NULL DEFAULT 'unit',
  unit_price      NUMERIC(15,2) NOT NULL,
  total           NUMERIC(15,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_con_purchase_orders_company ON con_purchase_orders(company_id, order_date DESC);
CREATE INDEX IF NOT EXISTS idx_con_purchase_order_items_order ON con_purchase_order_items(order_id);

NOTIFY pgrst, 'reload schema';
