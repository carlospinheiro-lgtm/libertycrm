CREATE TABLE public.consultants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id),
  nif TEXT,
  name TEXT NOT NULL,
  entry_date DATE,
  tier TEXT,
  commission_system TEXT,
  has_company BOOLEAN DEFAULT FALSE,
  commission_pct NUMERIC,
  team TEXT,
  team_leader TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  accumulated_12m NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.consultants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view consultants from their agency"
  ON public.consultants FOR SELECT TO authenticated
  USING (has_agency_access(auth.uid(), agency_id));

CREATE POLICY "Users can create consultants in their agency"
  ON public.consultants FOR INSERT TO authenticated
  WITH CHECK (has_agency_access(auth.uid(), agency_id));

CREATE POLICY "Users can update consultants in their agency"
  ON public.consultants FOR UPDATE TO authenticated
  USING (has_agency_access(auth.uid(), agency_id));

CREATE POLICY "Users can delete consultants in their agency"
  ON public.consultants FOR DELETE TO authenticated
  USING (has_agency_access(auth.uid(), agency_id));

CREATE OR REPLACE FUNCTION public.validate_consultant_fields()
  RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $fn$
BEGIN
  IF NEW.tier IS NOT NULL AND NEW.tier NOT IN ('A', 'B', 'C') THEN
    RAISE EXCEPTION 'Invalid tier. Must be A, B, or C';
  END IF;
  IF NEW.commission_system IS NOT NULL AND NEW.commission_system NOT IN ('Alternativo', 'Fixo') THEN
    RAISE EXCEPTION 'Invalid commission_system. Must be Alternativo or Fixo';
  END IF;
  RETURN NEW;
END;
$fn$;

CREATE TRIGGER trg_validate_consultant
  BEFORE INSERT OR UPDATE ON public.consultants
  FOR EACH ROW EXECUTE FUNCTION public.validate_consultant_fields();

CREATE TRIGGER trg_consultants_updated_at
  BEFORE UPDATE ON public.consultants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();