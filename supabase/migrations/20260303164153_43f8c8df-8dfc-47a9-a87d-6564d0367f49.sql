
-- 1. Add experience_level to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS experience_level text;

-- 2. Create recruitment_interactions table
CREATE TABLE public.recruitment_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES public.agencies(id),
  type text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id)
);

-- 3. Enable RLS
ALTER TABLE public.recruitment_interactions ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies
CREATE POLICY "Users can view recruitment interactions from their agency"
  ON public.recruitment_interactions FOR SELECT
  USING (has_agency_access(auth.uid(), agency_id));

CREATE POLICY "Users can create recruitment interactions in their agency"
  ON public.recruitment_interactions FOR INSERT
  WITH CHECK (has_agency_access(auth.uid(), agency_id));

CREATE POLICY "Recruitment interactions are immutable"
  ON public.recruitment_interactions FOR UPDATE
  USING (false);

CREATE POLICY "Recruitment interactions cannot be deleted"
  ON public.recruitment_interactions FOR DELETE
  USING (false);

-- 5. Migrate column_ids for recruitment leads
UPDATE public.leads SET column_id = CASE column_id
  WHEN 'new' THEN 'novo-lead'
  WHEN 'first-contact' THEN 'contactado'
  WHEN 'interview-scheduled' THEN 'entrevista-agendada'
  WHEN 'interview-done' THEN 'entrevistado'
  WHEN 'decision' THEN 'em-decisao'
  WHEN 'training' THEN 'integrado'
  WHEN 'active' THEN 'integrado'
  WHEN 'rejected' THEN 'nao-avancou'
  ELSE 'novo-lead'
END
WHERE lead_type = 'recruitment'
  AND column_id NOT IN ('novo-lead', 'contactado', 'entrevista-agendada', 'entrevistado', 'em-decisao', 'integrado', 'nao-avancou');
