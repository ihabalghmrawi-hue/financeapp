-- Align con_projects with construction-schema.sql definition
-- Existing table is missing several columns referenced by the API.

ALTER TABLE con_projects
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'apartment',
  ADD COLUMN IF NOT EXISTS engineer_name text,
  ADD COLUMN IF NOT EXISTS expected_cost numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS actual_cost numeric(14,2) DEFAULT 0;

-- Add CHECK constraint for type if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'con_projects_type_check'
  ) THEN
    ALTER TABLE con_projects
      ADD CONSTRAINT con_projects_type_check
      CHECK (type IN ('apartment','shop','villa','office','other'));
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
