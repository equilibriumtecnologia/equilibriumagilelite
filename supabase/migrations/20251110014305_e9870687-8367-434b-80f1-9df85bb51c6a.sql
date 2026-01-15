-- Função para buscar convite por token (acessível publicamente)
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  -- Buscar convite válido
  SELECT 
    i.id,
    i.email,
    i.project_id,
    i.role,
    i.status,
    i.expires_at,
    p.full_name as invited_by_name,
    proj.name as project_name
  INTO v_invitation
  FROM public.invitations i
  LEFT JOIN public.profiles p ON i.invited_by = p.id
  LEFT JOIN public.projects proj ON i.project_id = proj.id
  WHERE i.token = _token
    AND i.status = 'pending'
    AND i.expires_at > NOW();

  -- Se não encontrou, retornar erro
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Convite não encontrado, expirado ou já utilizado'
    );
  END IF;

  -- Retornar dados do convite
  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'id', v_invitation.id,
      'email', v_invitation.email,
      'project_id', v_invitation.project_id,
      'role', v_invitation.role,
      'status', v_invitation.status,
      'expires_at', v_invitation.expires_at,
      'invited_by_name', v_invitation.invited_by_name,
      'project_name', v_invitation.project_name
    )
  );
END;
$$;