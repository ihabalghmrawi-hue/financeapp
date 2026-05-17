-- Add missing contract_value column to con_projects
-- Schema file defines it but existing table was created before it was added.

ALTER TABLE con_projects
  ADD COLUMN IF NOT EXISTS contract_value numeric(14,2) DEFAULT 0;

-- Reload PostgREST schema cache so Supabase API picks up the new column
NOTIFY pgrst, 'reload schema';
