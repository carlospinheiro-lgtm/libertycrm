
-- Create objectives table
CREATE TABLE public.objectives (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id uuid NOT NULL REFERENCES public.agencies(id),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  flow text NOT NULL,
  objective_category text NOT NULL,
  activity_type text,
  result_type text,
  current_value numeric NOT NULL DEFAULT 0,
  target_value numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'number',
  unit_symbol text NOT NULL DEFAULT '',
  start_date date NOT NULL,
  end_date date NOT NULL,
  target_type text NOT NULL DEFAULT 'agent',
  target_id uuid,
  target_name text,
  source_filter jsonb DEFAULT '"all"'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_objectives_agency_id ON public.objectives(agency_id);
CREATE INDEX idx_objectives_user_id ON public.objectives(user_id);
CREATE INDEX idx_objectives_flow ON public.objectives(flow);
CREATE INDEX idx_objectives_dates ON public.objectives(start_date, end_date);

ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view objectives from their agency"
  ON public.objectives FOR SELECT
  USING (has_agency_access(auth.uid(), agency_id));

CREATE POLICY "Users can create objectives in their agency"
  ON public.objectives FOR INSERT
  WITH CHECK (has_agency_access(auth.uid(), agency_id));

CREATE POLICY "Users can update objectives in their agency"
  ON public.objectives FOR UPDATE
  USING (has_agency_access(auth.uid(), agency_id));

CREATE POLICY "Admins can delete objectives"
  ON public.objectives FOR DELETE
  USING (user_id = auth.uid() OR is_global_admin(auth.uid()));

CREATE TRIGGER update_objectives_updated_at
  BEFORE UPDATE ON public.objectives
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
