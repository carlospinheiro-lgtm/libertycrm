
-- Phase 1: Add new columns to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS budget_min numeric DEFAULT NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS budget_max numeric DEFAULT NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS nif text DEFAULT NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'pt';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS rgpd_consent boolean NOT NULL DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS rgpd_consent_date timestamptz DEFAULT NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS column_entered_at timestamptz NOT NULL DEFAULT now();

-- Phase 1: Create lead_activities table
CREATE TABLE public.lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES public.agencies(id),
  user_id uuid NOT NULL,
  activity_type text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lead activities from their agency"
  ON public.lead_activities FOR SELECT
  USING (has_agency_access(auth.uid(), agency_id));

CREATE POLICY "Users can create lead activities in their agency"
  ON public.lead_activities FOR INSERT
  WITH CHECK (has_agency_access(auth.uid(), agency_id));

CREATE POLICY "Lead activities are immutable"
  ON public.lead_activities FOR UPDATE
  USING (false);

CREATE POLICY "Lead activities cannot be deleted"
  ON public.lead_activities FOR DELETE
  USING (false);

CREATE INDEX idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX idx_lead_activities_agency_id ON public.lead_activities(agency_id);

-- Phase 1: Create lead_tasks table
CREATE TABLE public.lead_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES public.agencies(id),
  assigned_to uuid REFERENCES public.profiles(id),
  title text NOT NULL,
  description text,
  due_date date,
  status text NOT NULL DEFAULT 'pending',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.lead_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lead tasks from their agency"
  ON public.lead_tasks FOR SELECT
  USING (has_agency_access(auth.uid(), agency_id));

CREATE POLICY "Users can create lead tasks in their agency"
  ON public.lead_tasks FOR INSERT
  WITH CHECK (has_agency_access(auth.uid(), agency_id));

CREATE POLICY "Users can update lead tasks in their agency"
  ON public.lead_tasks FOR UPDATE
  USING (has_agency_access(auth.uid(), agency_id));

CREATE POLICY "Users can delete lead tasks in their agency"
  ON public.lead_tasks FOR DELETE
  USING (has_agency_access(auth.uid(), agency_id));

CREATE INDEX idx_lead_tasks_lead_id ON public.lead_tasks(lead_id);
CREATE INDEX idx_lead_tasks_agency_id ON public.lead_tasks(agency_id);

-- Storage bucket for lead documents
INSERT INTO storage.buckets (id, name, public) VALUES ('lead-documents', 'lead-documents', false);

CREATE POLICY "Users can view lead documents from their agency"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'lead-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can upload lead documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'lead-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their lead documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'lead-documents' AND auth.role() = 'authenticated');
