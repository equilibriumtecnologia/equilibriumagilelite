
-- Fix 1: Restrict user_roles SELECT to self + admins/masters
DROP POLICY IF EXISTS "User roles são visíveis para todos autenticados" ON public.user_roles;

CREATE POLICY "Users can view own role, admins/masters can view all"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'master'::app_role)
  );

-- Fix 2: Add defense-in-depth INSERT policy on profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can only create their own profile'
  ) THEN
    CREATE POLICY "Users can only create their own profile"
      ON public.profiles FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;
