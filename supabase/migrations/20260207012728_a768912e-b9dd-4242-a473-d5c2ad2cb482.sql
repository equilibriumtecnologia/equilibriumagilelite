
-- Drop redundant policy (the existing "Criador do convite pode deletar" already handles this)
DROP POLICY IF EXISTS "Workspace members can delete non-accepted invitations" ON public.invitations;

-- Update the existing delete policy to also prevent deleting accepted invitations
DROP POLICY IF EXISTS "Criador do convite pode deletar" ON public.invitations;
CREATE POLICY "Criador do convite pode deletar"
  ON public.invitations
  FOR DELETE
  USING (
    status != 'accepted'
    AND (
      invited_by = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'master'::app_role)
      OR has_workspace_role(auth.uid(), workspace_id, 'owner'::workspace_role)
      OR has_workspace_role(auth.uid(), workspace_id, 'admin'::workspace_role)
    )
  );
