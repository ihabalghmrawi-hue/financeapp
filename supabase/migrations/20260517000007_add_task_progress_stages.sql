-- Enhance construction module: task statuses, expense categories, project stages

-- 1. Expand con_tasks status to include 'pending' and 'cancelled'
ALTER TABLE con_tasks DROP CONSTRAINT IF EXISTS con_tasks_status_check;
ALTER TABLE con_tasks
  ADD CONSTRAINT con_tasks_status_check
  CHECK (status IN ('pending','todo','in_progress','review','done','blocked','cancelled'));

-- 2. Expand con_expenses category to include construction-trade categories
ALTER TABLE con_expenses DROP CONSTRAINT IF EXISTS con_expenses_category_check;
ALTER TABLE con_expenses
  ADD CONSTRAINT con_expenses_category_check
  CHECK (category IN (
    'materials','labor','equipment','transport','subcontract','other',
    'excavation','foundation','structure','plumbing','electrical',
    'plastering','tiling','carpentry','painting','finishing','roofing',
    'glass','aluminum','flooring','demolition'
  ));

-- 3. Add stage field to con_projects for tracking construction phase
ALTER TABLE con_projects
  ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'foundation'
  CHECK (stage IN (
    'foundation','structure','rough_plumbing','rough_electrical',
    'plastering','tiling','carpentry','painting','finishing','handover'
  ));

-- 4. Add refunded_amount to con_projects for tracking client refunds
ALTER TABLE con_projects
  ADD COLUMN IF NOT EXISTS refunded_amount numeric(14,2) DEFAULT 0;

NOTIFY pgrst, 'reload schema';
