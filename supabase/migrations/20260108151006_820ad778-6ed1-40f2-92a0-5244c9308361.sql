-- Permitir que admins globais criem perfis durante importação
DROP POLICY IF EXISTS "Perfis criados automaticamente via trigger" ON public.profiles;

CREATE POLICY "Perfis criados por trigger ou admins"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id OR is_global_admin(auth.uid())
);