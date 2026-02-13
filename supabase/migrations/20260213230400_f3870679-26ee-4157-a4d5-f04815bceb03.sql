
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS import_batch_id uuid,
  ADD COLUMN IF NOT EXISTS imported_at timestamptz,
  ADD COLUMN IF NOT EXISTS import_source text,
  ADD COLUMN IF NOT EXISTS import_file_name text,
  ADD COLUMN IF NOT EXISTS imported_by_user_id uuid;
