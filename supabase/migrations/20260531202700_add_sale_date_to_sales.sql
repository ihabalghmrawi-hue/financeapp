-- Ensure sale_date column exists on sales table
-- The POS API route inserts sales without sale_date, causing all dashboard
-- queries (which filter by sale_date >= today/monthStart) to return empty.
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS sale_date DATE NOT NULL DEFAULT CURRENT_DATE;

-- Add index on sale_date for dashboard KPI queries
CREATE INDEX IF NOT EXISTS idx_sales_sale_date
  ON sales(company_id, business_type, sale_date, status);

NOTIFY pgrst, 'reload schema';
