-- A) Corrigir a função has_agency_access para incluir verificação via user_roles
CREATE OR REPLACE FUNCTION public.has_agency_access(_user_id uuid, _agency_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    public.is_global_admin(_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.user_agencies
      WHERE user_id = _user_id
        AND agency_id = _agency_id
        AND is_active = true
    )
    OR EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND agency_id = _agency_id
    )
$$;

-- B) Corrigir as políticas da tabela projects (ordem dos parâmetros)
DROP POLICY IF EXISTS "Users can view projects in their agency" ON public.projects;
CREATE POLICY "Users can view projects in their agency"
ON public.projects
FOR SELECT
TO authenticated
USING ( public.has_agency_access(auth.uid(), agency_id) );

DROP POLICY IF EXISTS "Users can create projects in their agency" ON public.projects;
CREATE POLICY "Users can create projects in their agency"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK ( public.has_agency_access(auth.uid(), agency_id) );

-- C) Corrigir a política de leitura da tabela project_members
DROP POLICY IF EXISTS "Project members can view members" ON public.project_members;
CREATE POLICY "Project members can view members"
ON public.project_members
FOR SELECT
TO authenticated
USING (
  public.is_project_member(auth.uid(), project_id)
  OR EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_id
      AND public.has_agency_access(auth.uid(), p.agency_id)
  )
);