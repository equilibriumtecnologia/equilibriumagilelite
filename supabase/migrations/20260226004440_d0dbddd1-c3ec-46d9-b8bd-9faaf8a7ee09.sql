
-- Fix: AS PERMISSIVE must come before FOR
DROP POLICY IF EXISTS "Usuários autenticados podem criar workspaces" ON public.workspaces;

CREATE POLICY "Usuários autenticados podem criar workspaces"
ON public.workspaces
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (true);
