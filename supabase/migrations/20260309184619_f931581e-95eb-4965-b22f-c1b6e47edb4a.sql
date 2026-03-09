
-- Add fields to deals
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS referral_pct numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_name text,
  ADD COLUMN IF NOT EXISTS referral_amount numeric,
  ADD COLUMN IF NOT EXISTS agency_net numeric;

-- Add fields to consultants
ALTER TABLE public.consultants
  ADD COLUMN IF NOT EXISTS accumulated_12m_confirmed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_team_member boolean DEFAULT false;

-- Update validate_consultant_fields to accept new commission_system values
CREATE OR REPLACE FUNCTION public.validate_consultant_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.tier IS NOT NULL AND NEW.tier NOT IN ('A', 'B', 'C') THEN
    RAISE EXCEPTION 'Invalid tier. Must be A, B, or C';
  END IF;
  IF NEW.commission_system IS NOT NULL AND NEW.commission_system NOT IN ('RAPP', 'PURO', 'Alternativo', 'Fixo') THEN
    RAISE EXCEPTION 'Invalid commission_system. Must be RAPP or PURO';
  END IF;
  RETURN NEW;
END;
$function$;
