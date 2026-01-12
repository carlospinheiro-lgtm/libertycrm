-- Add new columns to teams table
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS team_type TEXT DEFAULT 'comercial';

-- Create team_memberships table
CREATE TABLE public.team_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_leader BOOLEAN DEFAULT FALSE,
  relation_type TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'active',
  is_synced BOOLEAN DEFAULT FALSE,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Enable RLS
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at
CREATE TRIGGER update_team_memberships_updated_at
  BEFORE UPDATE ON public.team_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policy: Diretores e admins podem gerir team_memberships
CREATE POLICY "Admins podem gerir team_memberships" ON public.team_memberships
FOR ALL USING (
  public.is_global_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_memberships.team_id
    AND (
      public.has_role_in_agency(auth.uid(), 'diretor_agencia'::app_role, t.agency_id) OR
      public.has_role_in_agency(auth.uid(), 'diretor_comercial'::app_role, t.agency_id)
    )
  )
);

-- RLS Policy: Membros da agência podem ver
CREATE POLICY "Membros podem ver team_memberships" ON public.team_memberships
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_memberships.team_id
    AND public.has_agency_access(auth.uid(), t.agency_id)
  )
);