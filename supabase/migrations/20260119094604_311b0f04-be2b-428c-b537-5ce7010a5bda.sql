-- Create a secure function to get user email for notifications
-- Only returns email if the caller shares a project with the user
CREATE OR REPLACE FUNCTION public.get_user_email_for_notification(_user_id uuid, _caller_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_email text;
BEGIN
  -- Check if caller shares a project with the target user
  IF NOT public.shares_project_with(_caller_id, _user_id) THEN
    RETURN NULL;
  END IF;

  -- Get email from auth.users
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = _user_id;

  RETURN v_email;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_email_for_notification TO authenticated;

COMMENT ON FUNCTION public.get_user_email_for_notification IS 'Securely retrieve user email for task notifications. Only returns email if caller shares a project with the user.';