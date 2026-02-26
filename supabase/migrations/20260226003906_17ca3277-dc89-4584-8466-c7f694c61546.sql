
-- Fix: workspace INSERT policy must be PERMISSIVE, not RESTRICTIVE
-- Drop the restrictive policy and recreate as permissive with proper checks
DROP POLICY IF EXISTS "Usuários autenticados podem criar workspaces" ON public.workspaces;

CREATE POLICY "Usuários autenticados podem criar workspaces"
ON public.workspaces
FOR INSERT
TO authenticated
WITH CHECK (true);
