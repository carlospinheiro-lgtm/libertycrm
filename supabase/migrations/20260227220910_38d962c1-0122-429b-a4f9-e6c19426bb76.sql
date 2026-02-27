
-- 1. Add buyer-specific columns to leads table
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS zones text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS typology text,
  ADD COLUMN IF NOT EXISTS last_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_action_text text,
  ADD COLUMN IF NOT EXISTS next_action_at timestamptz,
  ADD COLUMN IF NOT EXISTS buyer_motive text,
  ADD COLUMN IF NOT EXISTS buyer_timeline text,
  ADD COLUMN IF NOT EXISTS buyer_financing text;

-- 2. Create buyer_interactions table
CREATE TABLE public.buyer_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES public.agencies(id),
  type text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.buyer_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view buyer interactions from their agency"
  ON public.buyer_interactions FOR SELECT
  USING (has_agency_access(auth.uid(), agency_id));

CREATE POLICY "Users can create buyer interactions in their agency"
  ON public.buyer_interactions FOR INSERT
  WITH CHECK (has_agency_access(auth.uid(), agency_id));

CREATE POLICY "Buyer interactions are immutable"
  ON public.buyer_interactions FOR UPDATE
  USING (false);

CREATE POLICY "Buyer interactions cannot be deleted"
  ON public.buyer_interactions FOR DELETE
  USING (false);

-- Index for fast lookups
CREATE INDEX idx_buyer_interactions_lead_id ON public.buyer_interactions(lead_id);
CREATE INDEX idx_leads_last_contact_at ON public.leads(last_contact_at) WHERE lead_type = 'buyer';

-- 3. Migrate existing buyer column_ids to new pipeline
UPDATE public.leads SET column_id = 'novo' WHERE lead_type = 'buyer' AND column_id IN ('new', '');
UPDATE public.leads SET column_id = 'contacto-feito' WHERE lead_type = 'buyer' AND column_id = 'first-contact';
UPDATE public.leads SET column_id = 'qualificacao' WHERE lead_type = 'buyer' AND column_id = 'qualifying';
UPDATE public.leads SET column_id = 'visitas' WHERE lead_type = 'buyer' AND column_id = 'visits';
UPDATE public.leads SET column_id = 'proposta-negociacao' WHERE lead_type = 'buyer' AND column_id IN ('proposal', 'negotiation');
UPDATE public.leads SET column_id = 'reserva-cpcv' WHERE lead_type = 'buyer' AND column_id = 'won';
UPDATE public.leads SET column_id = 'perdido-followup' WHERE lead_type = 'buyer' AND column_id IN ('followup-0-3', 'followup-3-6', 'followup-6+', 'no-interest', 'disqualified');

-- Set last_contact_at to column_entered_at for existing buyers
UPDATE public.leads SET last_contact_at = column_entered_at WHERE lead_type = 'buyer' AND last_contact_at IS NULL;
