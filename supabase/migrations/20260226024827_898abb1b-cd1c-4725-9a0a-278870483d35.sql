
-- Create a SECURITY DEFINER function to handle workspace creation atomically
CREATE OR REPLACE FUNCTION public.create_workspace(
  _name text,
  _description text DEFAULT NULL,
  _slug text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid;
  _workspace_id uuid;
  _is_master boolean;
  _can_create boolean;
BEGIN
  -- Get authenticated user
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Check if master
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'master') INTO _is_master;

  -- Check workspace creation limit (skip for master)
  IF NOT _is_master THEN
    SELECT public.check_can_create_workspace(_user_id) INTO _can_create;
    IF NOT _can_create THEN
      RAISE EXCEPTION 'Limite de workspaces atingido no seu plano';
    END IF;
  END IF;

  -- Generate slug if not provided
  IF _slug IS NULL OR _slug = '' THEN
    _slug := 'ws-' || substr(md5(random()::text), 1, 10);
  END IF;

  -- Create workspace
  INSERT INTO public.workspaces (name, description, slug, is_default)
  VALUES (trim(_name), trim(_description), _slug, false)
  RETURNING id INTO _workspace_id;

  -- Add creator as owner
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (_workspace_id, _user_id, 'owner');

  -- Set default permissions (trigger should handle this, but ensure it)
  PERFORM public.set_default_permissions(_user_id, _workspace_id, 'owner');

  RETURN _workspace_id;
END;
$$;
