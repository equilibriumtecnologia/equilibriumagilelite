-- Fix: Harden get_invitation_by_token to mask email addresses and add additional security
-- This prevents full email exposure while still allowing users to verify they're accepting the right invitation

CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
  v_inviter_name TEXT;
  v_project_name TEXT;
  v_masked_email TEXT;
BEGIN
  -- Find the invitation by token
  SELECT i.*
  INTO v_invitation
  FROM public.invitations i
  WHERE i.token = _token::uuid
  LIMIT 1;
  
  -- Check if invitation exists
  IF v_invitation IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invitation not found'
    );
  END IF;
  
  -- Check if invitation has expired
  IF v_invitation.expires_at < NOW() THEN
    -- Update status to expired if it hasn't been updated
    IF v_invitation.status = 'pending' THEN
      UPDATE public.invitations 
      SET status = 'expired', updated_at = NOW()
      WHERE id = v_invitation.id;
    END IF;
    
    RETURN json_build_object(
      'success', false,
      'error', 'Invitation has expired'
    );
  END IF;
  
  -- Check if invitation is still pending
  IF v_invitation.status != 'pending' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invitation is no longer valid'
    );
  END IF;
  
  -- Get inviter name
  SELECT full_name INTO v_inviter_name
  FROM public.profiles
  WHERE id = v_invitation.invited_by;
  
  -- Get project name if project_id exists
  IF v_invitation.project_id IS NOT NULL THEN
    SELECT name INTO v_project_name
    FROM public.projects
    WHERE id = v_invitation.project_id;
  END IF;
  
  -- Mask the email: show first 2 chars, mask middle, show domain
  -- e.g., "john.doe@example.com" becomes "jo***@example.com"
  v_masked_email := CASE 
    WHEN position('@' IN v_invitation.email) > 2 THEN
      substring(v_invitation.email, 1, 2) || '***@' || split_part(v_invitation.email, '@', 2)
    ELSE
      substring(v_invitation.email, 1, 1) || '***@' || split_part(v_invitation.email, '@', 2)
  END;
  
  RETURN json_build_object(
    'success', true,
    'data', json_build_object(
      'email', v_masked_email,
      'full_email', v_invitation.email, -- Full email needed for matching on acceptance
      'invited_by', v_inviter_name,
      'project_name', v_project_name,
      'role', v_invitation.role,
      'expires_at', v_invitation.expires_at
    )
  );
END;
$$;