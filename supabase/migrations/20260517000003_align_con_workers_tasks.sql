-- Align con_workers and con_tasks with construction-schema.sql

ALTER TABLE con_workers
  ADD COLUMN IF NOT EXISTS rating numeric(2,1) DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'con_workers_rating_check'
  ) THEN
    ALTER TABLE con_workers
      ADD CONSTRAINT con_workers_rating_check CHECK (rating BETWEEN 0 AND 5);
  END IF;
END $$;

ALTER TABLE con_tasks
  ADD COLUMN IF NOT EXISTS progress int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS start_date date;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'con_tasks_progress_check'
  ) THEN
    ALTER TABLE con_tasks
      ADD CONSTRAINT con_tasks_progress_check CHECK (progress BETWEEN 0 AND 100);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
