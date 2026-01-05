-- Drop existing policy and recreate with bootstrap capability
DROP POLICY IF EXISTS "Apenas admins globais podem criar agências" ON agencies;

CREATE POLICY "Admins globais ou bootstrap podem criar agências"
  ON agencies FOR INSERT
  WITH CHECK (
    is_global_admin(auth.uid()) 
    OR NOT EXISTS (SELECT 1 FROM agencies LIMIT 1)
  );

-- Create trigger to auto-assign diretor_geral to first user in first agency
CREATE OR REPLACE FUNCTION public.auto_assign_first_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If this is the first agency, assign diretor_geral role to the creator
  IF NOT EXISTS (SELECT 1 FROM agencies WHERE id != NEW.id LIMIT 1) THEN
    INSERT INTO user_roles (user_id, role, agency_id)
    VALUES (auth.uid(), 'diretor_geral', NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_first_agency_created
  AFTER INSERT ON agencies
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_first_admin();