-- Fix: Restrict profile visibility to project members only
-- This prevents data harvesting by limiting who can see user profiles

-- First, create a security definer function to check if users share a project
-- This avoids potential RLS recursion issues
CREATE OR REPLACE FUNCTION public.shares_project_with(_user_id uuid, _other_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members pm1
    JOIN public.project_members pm2 ON pm1.project_id = pm2.project_id
    WHERE pm1.user_id = _user_id
      AND pm2.user_id = _other_user_id
  )
$$;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles são visíveis para todos usuários autenticados" ON public.profiles;

-- Create a more restrictive policy that only allows viewing profiles of:
-- 1. Own profile
-- 2. Users in shared projects
-- 3. Admins and masters can see all profiles
CREATE POLICY "Users can view profiles of project members"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR shares_project_with(auth.uid(), id)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'master'::app_role)
  );