
-- Fix check_project_limit: also check if workspace OWNER is master
CREATE OR REPLACE FUNCTION public.check_project_limit(_user_id uuid, _workspace_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _max_projects integer;
  _current_projects integer;
  _ws_owner_id uuid;
  _is_master boolean;
  _is_owner_master boolean;
BEGIN
  -- If calling user is master, bypass
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'master') INTO _is_master;
  IF _is_master THEN RETURN true; END IF;

  -- Find workspace owner
  SELECT user_id INTO _ws_owner_id
  FROM public.workspace_members
  WHERE workspace_id = _workspace_id AND role = 'owner'
  LIMIT 1;

  IF _ws_owner_id IS NULL THEN RETURN false; END IF;

  -- If workspace owner is master, bypass limits
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _ws_owner_id AND role = 'master') INTO _is_owner_master;
  IF _is_owner_master THEN RETURN true; END IF;

  SELECT COALESCE(sp.max_projects_per_workspace, 1) INTO _max_projects
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = _ws_owner_id AND us.status = 'active';

  IF _max_projects IS NULL THEN _max_projects := 1; END IF;

  SELECT count(*) INTO _current_projects
  FROM public.projects
  WHERE workspace_id = _workspace_id;

  RETURN _current_projects < _max_projects;
END;
$function$;

-- Fix check_invite_limit: also check if workspace OWNER is master
CREATE OR REPLACE FUNCTION public.check_invite_limit(_user_id uuid, _workspace_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _max_invites integer;
  _current_invites integer;
  _ws_owner_id uuid;
  _is_master boolean;
  _is_owner_master boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'master') INTO _is_master;
  IF _is_master THEN RETURN true; END IF;

  SELECT user_id INTO _ws_owner_id
  FROM public.workspace_members
  WHERE workspace_id = _workspace_id AND role = 'owner'
  LIMIT 1;

  IF _ws_owner_id IS NULL THEN RETURN false; END IF;

  -- If workspace owner is master, bypass limits
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _ws_owner_id AND role = 'master') INTO _is_owner_master;
  IF _is_owner_master THEN RETURN true; END IF;

  SELECT COALESCE(sp.max_invites_per_workspace, 0) INTO _max_invites
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = _ws_owner_id AND us.status = 'active';

  IF _max_invites IS NULL THEN _max_invites := 0; END IF;

  SELECT count(*) INTO _current_invites
  FROM public.workspace_members
  WHERE workspace_id = _workspace_id AND role != 'owner';

  RETURN _current_invites < _max_invites;
END;
$function$;
