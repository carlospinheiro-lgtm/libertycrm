
-- Add 'recruitment' to the lead_type check constraint
ALTER TABLE public.leads DROP CONSTRAINT leads_lead_type_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_lead_type_check CHECK (lead_type = ANY (ARRAY['buyer'::text, 'seller'::text, 'both'::text, 'recruitment'::text]));
