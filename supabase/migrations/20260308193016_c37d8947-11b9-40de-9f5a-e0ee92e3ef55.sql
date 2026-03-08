ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS candidate_profession text,
  ADD COLUMN IF NOT EXISTS candidate_zone text,
  ADD COLUMN IF NOT EXISTS candidate_motivation text,
  ADD COLUMN IF NOT EXISTS candidate_notes text;