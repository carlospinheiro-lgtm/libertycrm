
-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  lead_type TEXT NOT NULL CHECK (lead_type IN ('buyer', 'seller', 'both')),
  source TEXT,
  source_category TEXT,
  entry_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  column_id TEXT NOT NULL,
  temperature TEXT NOT NULL DEFAULT 'warm' CHECK (temperature IN ('cold', 'warm', 'hot', 'undefined')),
  notes TEXT,
  next_activity_date DATE,
  next_activity_description TEXT,
  cv_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_leads_agency_id ON public.leads(agency_id);
CREATE INDEX idx_leads_user_id ON public.leads(user_id);
CREATE INDEX idx_leads_column_id ON public.leads(column_id);
CREATE INDEX idx_leads_lead_type ON public.leads(lead_type);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view leads from their agency"
  ON public.leads FOR SELECT
  USING (has_agency_access(auth.uid(), agency_id));

CREATE POLICY "Users can create leads in their agency"
  ON public.leads FOR INSERT
  WITH CHECK (has_agency_access(auth.uid(), agency_id));

CREATE POLICY "Users can update leads in their agency"
  ON public.leads FOR UPDATE
  USING (has_agency_access(auth.uid(), agency_id));

CREATE POLICY "Admins can delete leads"
  ON public.leads FOR DELETE
  USING (user_id = auth.uid() OR is_global_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
