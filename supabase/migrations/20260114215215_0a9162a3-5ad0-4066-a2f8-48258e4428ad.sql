-- Update the original get_invitation_by_token function (uuid version) to also mask emails
-- This ensures both function signatures mask email addresses

CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_invitation RECORD;
  v_masked_email TEXT;
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

  -- Mask the email: show first 2 chars, mask middle, show domain
  -- e.g., "john.doe@example.com" becomes "jo***@example.com"
  v_masked_email := CASE 
    WHEN position('@' IN v_invitation.email) > 2 THEN
      substring(v_invitation.email, 1, 2) || '***@' || split_part(v_invitation.email, '@', 2)
    ELSE
      substring(v_invitation.email, 1, 1) || '***@' || split_part(v_invitation.email, '@', 2)
  END;

  -- Retornar dados do convite with masked email for display, full email for validation
  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'id', v_invitation.id,
      'email', v_masked_email,
      'full_email', v_invitation.email,
      'project_id', v_invitation.project_id,
      'role', v_invitation.role,
      'status', v_invitation.status,
      'expires_at', v_invitation.expires_at,
      'invited_by_name', v_invitation.invited_by_name,
      'project_name', v_invitation.project_name
    )
  );
END;
$function$;

-- Drop the text version as it's redundant (the uuid version is what's being used)
DROP FUNCTION IF EXISTS public.get_invitation_by_token(text);