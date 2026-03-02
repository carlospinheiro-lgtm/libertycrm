
-- 1. Add seller-specific fields to leads table
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS property_type text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS estimated_value numeric,
  ADD COLUMN IF NOT EXISTS seller_motivation text,
  ADD COLUMN IF NOT EXISTS seller_deadline text,
  ADD COLUMN IF NOT EXISTS seller_exclusivity text,
  ADD COLUMN IF NOT EXISTS commission_percentage numeric,
  ADD COLUMN IF NOT EXISTS contract_duration text;

-- 2. Create seller_interactions table
CREATE TABLE public.seller_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES public.agencies(id),
  type text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id)
);

ALTER TABLE public.seller_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view seller interactions from their agency"
  ON public.seller_interactions FOR SELECT
  USING (has_agency_access(auth.uid(), agency_id));

CREATE POLICY "Users can create seller interactions in their agency"
  ON public.seller_interactions FOR INSERT
  WITH CHECK (has_agency_access(auth.uid(), agency_id));

CREATE POLICY "Seller interactions are immutable"
  ON public.seller_interactions FOR UPDATE
  USING (false);

CREATE POLICY "Seller interactions cannot be deleted"
  ON public.seller_interactions FOR DELETE
  USING (false);

-- 3. Migrate existing seller column_ids to new pipeline
UPDATE public.leads SET column_id = 'novo' WHERE lead_type = 'seller' AND column_id = 'new';
UPDATE public.leads SET column_id = 'contacto-feito' WHERE lead_type = 'seller' AND column_id = 'first-contact';
UPDATE public.leads SET column_id = 'avaliacao' WHERE lead_type = 'seller' AND column_id IN ('meeting', 'evaluation');
UPDATE public.leads SET column_id = 'apresentacao' WHERE lead_type = 'seller' AND column_id = 'proposal-sent';
UPDATE public.leads SET column_id = 'negociacao' WHERE lead_type = 'seller' AND column_id = 'decision';
UPDATE public.leads SET column_id = 'angariacao' WHERE lead_type = 'seller' AND column_id = 'signed';
UPDATE public.leads SET column_id = 'perdido-followup' WHERE lead_type = 'seller' AND column_id = 'lost';
-- Catch any unmapped column_ids
UPDATE public.leads SET column_id = 'novo' WHERE lead_type = 'seller' AND column_id NOT IN ('novo', 'contacto-feito', 'avaliacao', 'apresentacao', 'negociacao', 'angariacao', 'angariacao-reservada', 'perdido-followup');
