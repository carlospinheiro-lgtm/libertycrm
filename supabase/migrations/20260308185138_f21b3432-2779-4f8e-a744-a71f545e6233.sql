
-- 1. Create organizations table
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  primary_color text DEFAULT '#1d4ed8',
  plan text DEFAULT 'starter',
  is_active boolean DEFAULT true,
  max_agencies integer DEFAULT 5,
  max_users integer DEFAULT 20,
  billing_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Validation trigger for plan (instead of CHECK constraint)
CREATE OR REPLACE FUNCTION public.validate_organization_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.plan NOT IN ('starter', 'pro', 'enterprise') THEN
    RAISE EXCEPTION 'Invalid plan: %. Must be starter, pro, or enterprise', NEW.plan;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_organization_plan
  BEFORE INSERT OR UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.validate_organization_plan();

-- 3. Add organization_id to agencies (nullable to not break existing)
ALTER TABLE public.agencies ADD COLUMN organization_id uuid REFERENCES public.organizations(id);

-- 4. Add is_super_admin to profiles
ALTER TABLE public.profiles ADD COLUMN is_super_admin boolean DEFAULT false;

-- 5. Security definer function to check super admin (avoids RLS recursion on profiles)
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id IS NULL THEN false
    ELSE COALESCE(
      (SELECT is_super_admin FROM public.profiles WHERE id = _user_id),
      false
    )
  END
$$;

-- 6. RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select" ON public.organizations FOR SELECT USING (
  public.is_super_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.user_agencies ua
    JOIN public.agencies a ON a.id = ua.agency_id
    WHERE a.organization_id = organizations.id
    AND ua.user_id = auth.uid()
    AND ua.is_active = true
  )
);

CREATE POLICY "org_insert" ON public.organizations FOR INSERT
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "org_update" ON public.organizations FOR UPDATE
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "org_delete" ON public.organizations FOR DELETE
USING (public.is_super_admin(auth.uid()));

-- 7. Updated_at trigger for organizations
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
