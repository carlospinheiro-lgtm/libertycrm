-- Create agency_settings table for storing agency-level configurations
CREATE TABLE public.agency_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agency_id, setting_key)
);

-- Enable RLS on agency_settings
ALTER TABLE public.agency_settings ENABLE ROW LEVEL SECURITY;

-- SELECT policy: members of the agency can view settings
CREATE POLICY "Agency members can view their agency settings"
ON public.agency_settings FOR SELECT
USING (
  public.has_agency_access(auth.uid(), agency_id)
);

-- INSERT policy: only directors can create settings
CREATE POLICY "Directors can create agency settings"
ON public.agency_settings FOR INSERT
WITH CHECK (
  public.is_global_admin(auth.uid()) OR
  public.has_role_in_agency(auth.uid(), 'diretor_agencia', agency_id) OR
  public.has_role_in_agency(auth.uid(), 'diretor_comercial', agency_id)
);

-- UPDATE policy: only directors can update settings
CREATE POLICY "Directors can update agency settings"
ON public.agency_settings FOR UPDATE
USING (
  public.is_global_admin(auth.uid()) OR
  public.has_role_in_agency(auth.uid(), 'diretor_agencia', agency_id) OR
  public.has_role_in_agency(auth.uid(), 'diretor_comercial', agency_id)
);

-- DELETE policy: only directors can delete settings
CREATE POLICY "Directors can delete agency settings"
ON public.agency_settings FOR DELETE
USING (
  public.is_global_admin(auth.uid()) OR
  public.has_role_in_agency(auth.uid(), 'diretor_agencia', agency_id)
);

-- Add DELETE policy for agencies table (only diretor_geral can delete)
CREATE POLICY "Only diretor_geral can delete agencies"
ON public.agencies FOR DELETE
USING (public.is_global_admin(auth.uid()));

-- Create trigger for updated_at on agency_settings
CREATE TRIGGER update_agency_settings_updated_at
BEFORE UPDATE ON public.agency_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();