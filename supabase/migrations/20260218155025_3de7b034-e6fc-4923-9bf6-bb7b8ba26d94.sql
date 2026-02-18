
-- RPC to get pending invitations for the currently authenticated user (by email)
CREATE OR REPLACE FUNCTION public.get_my_pending_invitations()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_email text;
  v_result jsonb;
BEGIN
  -- Get the authenticated user's email
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  
  IF v_email IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', i.id,
    'token', i.token,
    'role', i.role,
    'status', i.status,
    'expires_at', i.expires_at,
    'created_at', i.created_at,
    'invited_by_name', COALESCE(p.full_name, 'Usuário'),
    'project_name', proj.name,
    'project_id', i.project_id,
    'workspace_name', w.name,
    'workspace_id', i.workspace_id
  )), '[]'::jsonb) INTO v_result
  FROM public.invitations i
  LEFT JOIN public.profiles p ON i.invited_by = p.id
  LEFT JOIN public.projects proj ON i.project_id = proj.id
  LEFT JOIN public.workspaces w ON i.workspace_id = w.id
  WHERE i.email = v_email
    AND i.status = 'pending'
    AND i.expires_at > NOW();

  RETURN v_result;
END;
$$;
