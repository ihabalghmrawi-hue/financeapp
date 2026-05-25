-- ═══════════════════════════════════════════════════════════════
--  Migration: Add business_type isolation for products, categories, inventory
--  ═══════════════════════════════════════════════════════════════
--  Adds business_type column to products, product_categories, inventory
--  Assigns existing records based on company_settings.business_type
--  Enforces NOT NULL + CHECK constraint after data migration
--  ═══════════════════════════════════════════════════════════════

-- ── 1. Add business_type to products ──────────────────────────────────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS business_type TEXT;

-- ── 2. Add business_type to product_categories ────────────────────────────────
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS business_type TEXT;

-- ── 3. Add business_type to inventory (optional — enables fast scoped queries) ─
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS business_type TEXT;

-- ── 4. Add business_type to customers (optional — scoped customer lists) ──────
ALTER TABLE customers ADD COLUMN IF NOT EXISTS business_type TEXT;

-- ── 5. Add business_type to sales (optional — scoped sales reports) ───────────
ALTER TABLE sales ADD COLUMN IF NOT EXISTS business_type TEXT;

-- ═══════════════════════════════════════════════════════════════════════════════
--  Data migration: assign business_type to existing records
-- ═══════════════════════════════════════════════════════════════════════════════

-- Helper: create a temporary function to get a company's business_type
-- Used for bulk-updating existing records
CREATE OR REPLACE FUNCTION _get_company_business_type(p_company_id UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(business_type, 'retail')
  FROM company_settings
  WHERE company_id = p_company_id
$$;

-- Assign business_type to products that don't have one yet
UPDATE products p
SET business_type = _get_company_business_type(p.company_id)
WHERE p.business_type IS NULL;

-- Assign business_type to product_categories that don't have one yet
UPDATE product_categories pc
SET business_type = _get_company_business_type(pc.company_id)
WHERE pc.business_type IS NULL;

-- Assign business_type to inventory records via their product's business_type
UPDATE inventory i
SET business_type = p.business_type
FROM products p
WHERE i.product_id = p.id
  AND i.business_type IS NULL;

-- Assign business_type to customers based on their company
UPDATE customers c
SET business_type = _get_company_business_type(c.company_id)
WHERE c.business_type IS NULL;

-- Assign business_type to sales based on their company
UPDATE sales s
SET business_type = _get_company_business_type(s.company_id)
WHERE s.business_type IS NULL;

DROP FUNCTION IF EXISTS _get_company_business_type;

-- ═══════════════════════════════════════════════════════════════════════════════
--  Add NOT NULL constraints and CHECK constraints
-- ═══════════════════════════════════════════════════════════════════════════════

-- Validate business_type values against the known set
-- These must match the BusinessType union in src/lib/features.ts
ALTER TABLE products          ADD CONSTRAINT chk_products_business_type
  CHECK (business_type IN (
    'pharmacy', 'retail', 'wholesale', 'clothing',
    'stationery', 'tools', 'dress_rental', 'construction',
    'atelier', 'suits', 'other'
  ));

ALTER TABLE product_categories ADD CONSTRAINT chk_product_categories_business_type
  CHECK (business_type IN (
    'pharmacy', 'retail', 'wholesale', 'clothing',
    'stationery', 'tools', 'dress_rental', 'construction',
    'atelier', 'suits', 'other'
  ));

ALTER TABLE inventory ADD CONSTRAINT chk_inventory_business_type
  CHECK (business_type IN (
    'pharmacy', 'retail', 'wholesale', 'clothing',
    'stationery', 'tools', 'dress_rental', 'construction',
    'atelier', 'suits', 'other'
  ));

ALTER TABLE customers ADD CONSTRAINT chk_customers_business_type
  CHECK (business_type IN (
    'pharmacy', 'retail', 'wholesale', 'clothing',
    'stationery', 'tools', 'dress_rental', 'construction',
    'atelier', 'suits', 'other'
  ));

ALTER TABLE sales ADD CONSTRAINT chk_sales_business_type
  CHECK (business_type IN (
    'pharmacy', 'retail', 'wholesale', 'clothing',
    'stationery', 'tools', 'dress_rental', 'construction',
    'atelier', 'suits', 'other'
  ));

-- Now safe to set NOT NULL (data has been backfilled, triggers auto-assign on INSERT)
ALTER TABLE products          ALTER COLUMN business_type SET NOT NULL;
ALTER TABLE product_categories ALTER COLUMN business_type SET NOT NULL;
ALTER TABLE inventory         ALTER COLUMN business_type SET NOT NULL;
ALTER TABLE customers         ALTER COLUMN business_type SET NOT NULL;
ALTER TABLE sales             ALTER COLUMN business_type SET NOT NULL;

-- ── 6. Indexes for performance ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_business_type
  ON products(business_type);

CREATE INDEX IF NOT EXISTS idx_products_company_business_type
  ON products(company_id, business_type);

CREATE INDEX IF NOT EXISTS idx_product_categories_business_type
  ON product_categories(business_type);

CREATE INDEX IF NOT EXISTS idx_product_categories_company_business_type
  ON product_categories(company_id, business_type);

CREATE INDEX IF NOT EXISTS idx_inventory_business_type
  ON inventory(business_type);

CREATE INDEX IF NOT EXISTS idx_inventory_product_business_type
  ON inventory(product_id, business_type);

CREATE INDEX IF NOT EXISTS idx_customers_business_type
  ON customers(company_id, business_type);

CREATE INDEX IF NOT EXISTS idx_sales_business_type
  ON sales(company_id, business_type);

-- ═══════════════════════════════════════════════════════════════════════════════
--  Trigger: auto-assign business_type on INSERT for products & categories
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION auto_assign_business_type()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.business_type IS NULL THEN
    SELECT COALESCE(cs.business_type, 'retail')
    INTO NEW.business_type
    FROM company_settings cs
    WHERE cs.company_id = NEW.company_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_auto_business_type ON products;
CREATE TRIGGER trg_products_auto_business_type
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_business_type();

DROP TRIGGER IF EXISTS trg_product_categories_auto_business_type ON product_categories;
CREATE TRIGGER trg_product_categories_auto_business_type
  BEFORE INSERT ON product_categories
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_business_type();

-- Also auto-assign for inventory (read from product)
CREATE OR REPLACE FUNCTION auto_assign_inventory_business_type()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.business_type IS NULL THEN
    SELECT COALESCE(p.business_type, 'retail')
    INTO NEW.business_type
    FROM products p
    WHERE p.id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inventory_auto_business_type ON inventory;
CREATE TRIGGER trg_inventory_auto_business_type
  BEFORE INSERT ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_inventory_business_type();

-- Auto-assign for customers (from company_settings)
DROP TRIGGER IF EXISTS trg_customers_auto_business_type ON customers;
CREATE TRIGGER trg_customers_auto_business_type
  BEFORE INSERT ON customers
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_business_type();

-- Auto-assign for sales (from company_settings)
DROP TRIGGER IF EXISTS trg_sales_auto_business_type ON sales;
CREATE TRIGGER trg_sales_auto_business_type
  BEFORE INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_business_type();

-- ═══════════════════════════════════════════════════════════════════════════════
--  RLS: update existing policies or add business_type scoping
--  Note: existing RLS already scopes by company_id
--  Business_type isolation is enforced at the application layer
--  via query filters (WHERE business_type = ?)
-- ═══════════════════════════════════════════════════════════════════════════════
