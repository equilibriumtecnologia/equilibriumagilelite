-- Ajustar política de INSERT para permitir que donos de projetos convidem usuários
DROP POLICY IF EXISTS "Admins e masters podem criar convites" ON public.invitations;

CREATE POLICY "Admins, masters e donos de projeto podem criar convites"
ON public.invitations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = invited_by 
  AND (
    -- Admins e masters podem criar qualquer convite
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'master'::app_role)
    -- Donos de projeto podem criar convites para seus projetos
    OR (
      project_id IS NULL -- Convite sem projeto específico (acesso geral)
      OR auth.uid() IN (
        SELECT created_by 
        FROM public.projects 
        WHERE id = invitations.project_id
      )
    )
  )
);