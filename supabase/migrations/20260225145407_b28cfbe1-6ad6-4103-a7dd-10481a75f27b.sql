
-- Fix accept_invitation to call set_default_permissions
CREATE OR REPLACE FUNCTION public.accept_invitation(_token uuid, _user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_invitation RECORD;
  v_workspace_role workspace_role;
  v_project_role project_role;
  v_can_join boolean;
  v_already_member boolean;
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

  -- Check if user already belongs to this workspace
  SELECT EXISTS(SELECT 1 FROM public.workspace_members WHERE workspace_id = v_invitation.workspace_id AND user_id = _user_id) INTO v_already_member;

  IF NOT v_already_member THEN
    -- Check guest workspace limit
    SELECT public.check_can_join_workspace(_user_id) INTO v_can_join;
    IF NOT v_can_join THEN
      RETURN jsonb_build_object('success', false, 'error', 'Você atingiu o limite de workspaces do seu plano. Faça upgrade para aceitar mais convites.');
    END IF;
  END IF;

  v_workspace_role := CASE v_invitation.role
    WHEN 'admin' THEN 'admin'::workspace_role
    ELSE 'member'::workspace_role
  END;

  v_project_role := CASE v_invitation.role
    WHEN 'admin' THEN 'admin'::project_role
    WHEN 'owner' THEN 'owner'::project_role
    WHEN 'viewer' THEN 'viewer'::project_role
    ELSE 'member'::project_role
  END;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_invitation.workspace_id, _user_id, v_workspace_role)
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  -- Sync granular permissions for the workspace
  PERFORM public.set_default_permissions(_user_id, v_invitation.workspace_id, v_workspace_role::text);

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
$function$;

-- Create a helper function to sync permissions when workspace role changes
CREATE OR REPLACE FUNCTION public.sync_workspace_permissions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- On INSERT or UPDATE of workspace_members, sync permissions
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role) THEN
    PERFORM public.set_default_permissions(NEW.user_id, NEW.workspace_id, NEW.role::text);
  END IF;
  
  -- On DELETE, remove permissions for that workspace
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.user_permissions WHERE user_id = OLD.user_id AND workspace_id = OLD.workspace_id;
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to auto-sync permissions on workspace_members changes
DROP TRIGGER IF EXISTS sync_permissions_on_member_change ON public.workspace_members;
CREATE TRIGGER sync_permissions_on_member_change
  AFTER INSERT OR UPDATE OF role OR DELETE ON public.workspace_members
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_workspace_permissions();

-- Fix existing data: sync permissions for all current workspace members
-- Master in Equilibrium workspace
SELECT public.set_default_permissions(
  'faf7fceb-db9d-4052-84c1-d2858c7e1ba8'::uuid,
  '5e903100-767e-405b-90ea-780b3d81ec19'::uuid,
  'master'
);

-- Murilo (admin) in Equilibrium workspace
SELECT public.set_default_permissions(
  'b7230843-9a93-43ee-8e82-46a2f5a99149'::uuid,
  '5e903100-767e-405b-90ea-780b3d81ec19'::uuid,
  'admin'
);

-- Matheus Alves (member) in Equilibrium workspace
SELECT public.set_default_permissions(
  '7bf12ca8-2932-4ae5-8c93-888a4b00e585'::uuid,
  '5e903100-767e-405b-90ea-780b3d81ec19'::uuid,
  'member'
);

-- Fix owners of their default workspaces (they were set with 'user' role defaults)
-- Brendha
SELECT public.set_default_permissions(
  'ef894839-1e34-4886-a9ee-179d379d830d'::uuid,
  '0c477ae5-3a4f-4a9c-a2ff-3e84700d9e65'::uuid,
  'owner'
);

-- Hugo
SELECT public.set_default_permissions(
  'f4a69fab-10ff-4a88-89a3-11f65569046e'::uuid,
  'd4ef87a9-7bd6-4d2e-9d31-c5228df77c28'::uuid,
  'owner'
);

-- Estúdio Villa Grife
SELECT public.set_default_permissions(
  'a3098e56-25b8-4ecd-9670-43414e023095'::uuid,
  'f0c1a1f7-dada-4493-be89-d78b502239db'::uuid,
  'owner'
);

-- Matheus Alves own workspace
SELECT public.set_default_permissions(
  '7bf12ca8-2932-4ae5-8c93-888a4b00e585'::uuid,
  '4aa93ed4-dba1-4db0-9de4-243894d88c79'::uuid,
  'owner'
);

-- Murilo own workspace
SELECT public.set_default_permissions(
  'b7230843-9a93-43ee-8e82-46a2f5a99149'::uuid,
  '24873ede-c713-4b16-aa78-4c28bc39b47a'::uuid,
  'owner'
);

-- Fix handle_new_user to set 'owner' permissions (not 'user') for the default workspace
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _workspace_id uuid;
  _free_plan_id uuid;
  _user_name text;
BEGIN
  _user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário');

  -- Create profile
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, _user_name, NEW.raw_user_meta_data->>'avatar_url');

  -- Assign default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  -- Create default workspace
  INSERT INTO public.workspaces (name, slug, description, is_default)
  VALUES (
    _user_name || ' Workspace',
    'ws-' || substr(NEW.id::text, 1, 8),
    'Workspace padrão',
    true
  )
  RETURNING id INTO _workspace_id;

  -- Add user as workspace owner
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (_workspace_id, NEW.id, 'owner');

  -- Note: set_default_permissions is now handled by sync_workspace_permissions trigger

  -- Assign free plan
  SELECT id INTO _free_plan_id FROM public.subscription_plans WHERE slug = 'free' LIMIT 1;
  IF _free_plan_id IS NOT NULL THEN
    INSERT INTO public.user_subscriptions (user_id, plan_id, status)
    VALUES (NEW.id, _free_plan_id, 'active');
  END IF;

  RETURN NEW;
END;
$function$;
