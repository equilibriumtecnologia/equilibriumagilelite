
-- Update accept_invitation to also add user to workspace_members
CREATE OR REPLACE FUNCTION public.accept_invitation(_token uuid, _user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_invitation RECORD;
  v_workspace_role workspace_role;
BEGIN
  -- Buscar convite
  SELECT * INTO v_invitation
  FROM public.invitations
  WHERE token = _token
    AND status = 'pending'
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Convite inválido ou expirado');
  END IF;

  -- Verificar se email corresponde
  IF v_invitation.email != (SELECT email FROM auth.users WHERE id = _user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este convite não é para o seu email');
  END IF;

  -- Mapear role do convite para workspace_role
  v_workspace_role := CASE v_invitation.role
    WHEN 'admin' THEN 'admin'::workspace_role
    ELSE 'member'::workspace_role
  END;

  -- Adicionar usuário ao workspace
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_invitation.workspace_id, _user_id, v_workspace_role)
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  -- Adicionar ao projeto se especificado
  IF v_invitation.project_id IS NOT NULL THEN
    INSERT INTO public.project_members (project_id, user_id, role)
    VALUES (v_invitation.project_id, _user_id, v_invitation.role)
    ON CONFLICT (project_id, user_id) DO NOTHING;
  END IF;

  -- Marcar convite como aceito
  UPDATE public.invitations
  SET status = 'accepted', accepted_at = NOW()
  WHERE id = v_invitation.id;

  RETURN jsonb_build_object('success', true, 'project_id', v_invitation.project_id);
END;
$function$;

-- Allow deleting invitations (only non-accepted ones)
CREATE POLICY "Workspace members can delete non-accepted invitations"
  ON public.invitations
  FOR DELETE
  USING (
    status != 'accepted'
    AND public.is_workspace_member(auth.uid(), workspace_id)
  );
