
-- Proposals table
CREATE TABLE public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES public.agencies(id),
  proposal_number text UNIQUE NOT NULL,
  proposal_date date NOT NULL DEFAULT CURRENT_DATE,
  validity_date date,
  deal_type text NOT NULL DEFAULT 'venda',
  proposed_value numeric NOT NULL DEFAULT 0,
  payment_method text DEFAULT 'comptado',
  mortgage_amount numeric,
  bank text,
  approval_status text,
  down_payment numeric,
  down_payment_date date,
  deed_date date,
  client_name text,
  client_nif text,
  client_address text,
  client_email text,
  client_phone text,
  co_titular_name text,
  co_titular_nif text,
  property_address text,
  property_typology text,
  property_area numeric,
  property_reference text,
  condition_notes text,
  inspection_required boolean DEFAULT false,
  inspection_deadline date,
  special_conditions text,
  conditions_checklist jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  rejection_reason text,
  pdf_url text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view proposals from their agency"
  ON public.proposals FOR SELECT
  USING (has_agency_access(auth.uid(), agency_id));

CREATE POLICY "Users can create proposals in their agency"
  ON public.proposals FOR INSERT
  WITH CHECK (has_agency_access(auth.uid(), agency_id));

CREATE POLICY "Users can update proposals in their agency"
  ON public.proposals FOR UPDATE
  USING (has_agency_access(auth.uid(), agency_id));

CREATE POLICY "Users can delete proposals in their agency"
  ON public.proposals FOR DELETE
  USING (has_agency_access(auth.uid(), agency_id));

-- Trigger for updated_at
CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast lookups
CREATE INDEX idx_proposals_lead_id ON public.proposals(lead_id);
CREATE INDEX idx_proposals_agency_id ON public.proposals(agency_id);
CREATE INDEX idx_proposals_status ON public.proposals(status);

-- Sequence for proposal numbers
CREATE SEQUENCE IF NOT EXISTS proposal_number_seq START 1;
