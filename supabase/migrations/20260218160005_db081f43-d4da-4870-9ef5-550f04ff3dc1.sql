
CREATE OR REPLACE FUNCTION public.accept_invitation(_token uuid, _user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_invitation RECORD;
  v_workspace_role workspace_role;
  v_project_role project_role;
BEGIN
  SELECT * INTO v_invitation
  FROM public.invitations
  WHERE token = _token
    AND status = 'pending'
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Convite inválido ou expirado');
  END IF;

  IF v_invitation.email != (SELECT email FROM auth.users WHERE id = _user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este convite não é para o seu email');
  END IF;

  v_workspace_role := CASE v_invitation.role
    WHEN 'admin' THEN 'admin'::workspace_role
    ELSE 'member'::workspace_role
  END;

  -- Map invitation role text to valid project_role enum
  v_project_role := CASE v_invitation.role
    WHEN 'admin' THEN 'admin'::project_role
    WHEN 'owner' THEN 'owner'::project_role
    WHEN 'viewer' THEN 'viewer'::project_role
    ELSE 'member'::project_role
  END;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_invitation.workspace_id, _user_id, v_workspace_role)
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  IF v_invitation.project_id IS NOT NULL THEN
    INSERT INTO public.project_members (project_id, user_id, role)
    VALUES (v_invitation.project_id, _user_id, v_project_role)
    ON CONFLICT (project_id, user_id) DO NOTHING;
  END IF;

  UPDATE public.invitations
  SET status = 'accepted', accepted_at = NOW()
  WHERE id = v_invitation.id;

  RETURN jsonb_build_object('success', true, 'project_id', v_invitation.project_id);
END;
$$;
