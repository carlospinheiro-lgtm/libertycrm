
-- 1. Explicit deny policies on project_activity_log for immutability
CREATE POLICY "Activity logs are immutable"
  ON public.project_activity_log FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "Activity logs cannot be deleted"
  ON public.project_activity_log FOR DELETE
  TO authenticated
  USING (false);

-- 2. Add NULL validation to SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id IS NULL OR _role IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    )
  END
$$;

CREATE OR REPLACE FUNCTION public.has_role_in_agency(_user_id uuid, _role app_role, _agency_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id IS NULL OR _role IS NULL OR _agency_id IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role AND agency_id = _agency_id
    )
  END
$$;

CREATE OR REPLACE FUNCTION public.is_global_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'diretor_geral'
    )
  END
$$;

CREATE OR REPLACE FUNCTION public.has_agency_access(_user_id uuid, _agency_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id IS NULL OR _agency_id IS NULL THEN false
    ELSE (
      public.is_global_admin(_user_id)
      OR EXISTS (
        SELECT 1 FROM public.user_agencies
        WHERE user_id = _user_id AND agency_id = _agency_id AND is_active = true
      )
      OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND agency_id = _agency_id
      )
    )
  END
$$;

CREATE OR REPLACE FUNCTION public.get_user_agency_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT agency_id FROM public.user_agencies
  WHERE user_id = _user_id AND is_active = true
  AND _user_id IS NOT NULL
$$;

CREATE OR REPLACE FUNCTION public.is_project_member(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id IS NULL OR _project_id IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.project_members
      WHERE user_id = _user_id AND project_id = _project_id AND is_active = true
    )
  END
$$;

CREATE OR REPLACE FUNCTION public.get_project_role(_user_id uuid, _project_id uuid)
RETURNS project_member_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id IS NULL OR _project_id IS NULL THEN NULL
    ELSE (
      SELECT role FROM public.project_members
      WHERE user_id = _user_id AND project_id = _project_id AND is_active = true
      LIMIT 1
    )
  END
$$;

CREATE OR REPLACE FUNCTION public.has_project_role(_user_id uuid, _project_id uuid, _role project_member_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id IS NULL OR _project_id IS NULL OR _role IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.project_members
      WHERE user_id = _user_id AND project_id = _project_id AND role = _role AND is_active = true
    )
  END
$$;

CREATE OR REPLACE FUNCTION public.is_project_pm_or_finance(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id IS NULL OR _project_id IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.project_members
      WHERE user_id = _user_id AND project_id = _project_id
        AND role IN ('pm', 'finance') AND is_active = true
    )
  END
$$;
