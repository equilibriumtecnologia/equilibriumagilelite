
-- =============================================
-- 1. Add new columns to subscription_plans
-- =============================================
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS max_created_workspaces integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_guest_workspaces integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_projects_per_workspace integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_invites_per_workspace integer NOT NULL DEFAULT 0;

-- =============================================
-- 2. Update existing plans with correct limits
-- =============================================

-- Free: 1 default WS, 0 created, 1 guest, 1 project/WS, 0 invites
UPDATE public.subscription_plans SET
  max_workspaces = 2,  -- 1 default + 1 guest
  max_created_workspaces = 0,
  max_guest_workspaces = 1,
  max_projects_per_workspace = 1,
  max_invites_per_workspace = 0,
  max_users_per_workspace = 1,
  features = '{"support":"community"}'::jsonb,
  updated_at = now()
WHERE slug = 'free';

-- Starter: 1 default + 1 created + 1 guest = 3, 2 projects/WS, 1 invite/WS
UPDATE public.subscription_plans SET
  name = 'Starter',
  max_workspaces = 3,
  max_created_workspaces = 1,
  max_guest_workspaces = 1,
  max_projects_per_workspace = 2,
  max_invites_per_workspace = 1,
  max_users_per_workspace = 2, -- owner + 1 invited
  features = '{"support":"email"}'::jsonb,
  updated_at = now()
WHERE slug = 'starter';

-- Professional (rename Pro): 1 default + 2 created + 2 guest = 5, 5 projects/WS, 5 invites/WS
UPDATE public.subscription_plans SET
  name = 'Professional',
  slug = 'professional',
  max_workspaces = 5,
  max_created_workspaces = 2,
  max_guest_workspaces = 2,
  max_projects_per_workspace = 5,
  max_invites_per_workspace = 5,
  max_users_per_workspace = 6, -- owner + 5 invited
  features = '{"support":"priority","advanced_reports":true}'::jsonb,
  updated_at = now()
WHERE slug = 'pro';

-- Enterprise: custom limits
UPDATE public.subscription_plans SET
  name = 'Enterprise',
  max_workspaces = 999,
  max_created_workspaces = 999,
  max_guest_workspaces = 999,
  max_projects_per_workspace = 999,
  max_invites_per_workspace = 999,
  max_users_per_workspace = 999,
  features = '{"support":"dedicated","advanced_reports":true,"custom_permissions":true,"sso":true}'::jsonb,
  price_monthly_cents = 0,
  price_yearly_cents = 0,
  updated_at = now()
WHERE slug = 'enterprise';

-- =============================================
-- 3. Update check_workspace_limit to distinguish created vs guest
-- =============================================
CREATE OR REPLACE FUNCTION public.check_workspace_limit(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _plan record;
  _created_count integer;
  _guest_count integer;
  _is_master boolean;
BEGIN
  -- Master has no limits
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'master') INTO _is_master;
  IF _is_master THEN RETURN true; END IF;

  -- Get user plan
  SELECT sp.max_created_workspaces, sp.max_guest_workspaces
  INTO _plan
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = _user_id AND us.status = 'active';

  IF _plan IS NULL THEN
    _plan.max_created_workspaces := 0;
    _plan.max_guest_workspaces := 1;
  END IF;

  -- Count workspaces where user is owner (created, excluding default)
  SELECT count(*) INTO _created_count
  FROM public.workspace_members wm
  JOIN public.workspaces w ON w.id = wm.workspace_id
  WHERE wm.user_id = _user_id AND wm.role = 'owner' AND w.is_default = false;

  -- Count workspaces where user is guest (not owner)
  SELECT count(*) INTO _guest_count
  FROM public.workspace_members wm
  WHERE wm.user_id = _user_id AND wm.role != 'owner';

  -- This function returns true if user CAN still create/join
  -- Caller should specify context; for now return general availability
  RETURN (_created_count < _plan.max_created_workspaces) OR (_guest_count < _plan.max_guest_workspaces);
END;
$$;

-- =============================================
-- 4. Specific check for CREATING a workspace
-- =============================================
CREATE OR REPLACE FUNCTION public.check_can_create_workspace(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _max_created integer;
  _current_created integer;
  _is_master boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'master') INTO _is_master;
  IF _is_master THEN RETURN true; END IF;

  SELECT COALESCE(sp.max_created_workspaces, 0) INTO _max_created
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = _user_id AND us.status = 'active';

  IF _max_created IS NULL THEN _max_created := 0; END IF;

  SELECT count(*) INTO _current_created
  FROM public.workspace_members wm
  JOIN public.workspaces w ON w.id = wm.workspace_id
  WHERE wm.user_id = _user_id AND wm.role = 'owner' AND w.is_default = false;

  RETURN _current_created < _max_created;
END;
$$;

-- =============================================
-- 5. Check for JOINING as guest
-- =============================================
CREATE OR REPLACE FUNCTION public.check_can_join_workspace(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _max_guest integer;
  _current_guest integer;
  _is_master boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'master') INTO _is_master;
  IF _is_master THEN RETURN true; END IF;

  SELECT COALESCE(sp.max_guest_workspaces, 0) INTO _max_guest
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = _user_id AND us.status = 'active';

  IF _max_guest IS NULL THEN _max_guest := 1; END IF;

  SELECT count(*) INTO _current_guest
  FROM public.workspace_members wm
  WHERE wm.user_id = _user_id AND wm.role != 'owner';

  RETURN _current_guest < _max_guest;
END;
$$;

-- =============================================
-- 6. Check project limit per workspace
-- =============================================
CREATE OR REPLACE FUNCTION public.check_project_limit(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _max_projects integer;
  _current_projects integer;
  _ws_owner_id uuid;
  _is_master boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'master') INTO _is_master;
  IF _is_master THEN RETURN true; END IF;

  -- Limits are based on workspace OWNER's plan
  SELECT user_id INTO _ws_owner_id
  FROM public.workspace_members
  WHERE workspace_id = _workspace_id AND role = 'owner'
  LIMIT 1;

  IF _ws_owner_id IS NULL THEN RETURN false; END IF;

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
$$;

-- =============================================
-- 7. Check invite limit per workspace
-- =============================================
CREATE OR REPLACE FUNCTION public.check_invite_limit(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _max_invites integer;
  _current_invites integer;
  _ws_owner_id uuid;
  _is_master boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'master') INTO _is_master;
  IF _is_master THEN RETURN true; END IF;

  -- Limits based on workspace OWNER's plan
  SELECT user_id INTO _ws_owner_id
  FROM public.workspace_members
  WHERE workspace_id = _workspace_id AND role = 'owner'
  LIMIT 1;

  IF _ws_owner_id IS NULL THEN RETURN false; END IF;

  SELECT COALESCE(sp.max_invites_per_workspace, 0) INTO _max_invites
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = _ws_owner_id AND us.status = 'active';

  IF _max_invites IS NULL THEN _max_invites := 0; END IF;

  -- Count active members (excluding owner) + pending invitations
  SELECT count(*) INTO _current_invites
  FROM public.workspace_members
  WHERE workspace_id = _workspace_id AND role != 'owner';

  RETURN _current_invites < _max_invites;
END;
$$;

-- =============================================
-- 8. Update get_user_plan to include new fields
-- =============================================
CREATE OR REPLACE FUNCTION public.get_user_plan(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _result jsonb;
  _is_master boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'master') INTO _is_master;

  IF _is_master THEN
    RETURN jsonb_build_object(
      'plan_name', 'Master',
      'plan_slug', 'master',
      'max_workspaces', 999,
      'max_created_workspaces', 999,
      'max_guest_workspaces', 999,
      'max_projects_per_workspace', 999,
      'max_invites_per_workspace', 999,
      'max_users_per_workspace', 999,
      'features', '{"support":"dedicated","advanced_reports":true,"custom_permissions":true,"sso":true}'::jsonb,
      'status', 'active',
      'current_period_end', null,
      'is_master', true
    );
  END IF;

  SELECT jsonb_build_object(
    'plan_name', sp.name,
    'plan_slug', sp.slug,
    'max_workspaces', sp.max_workspaces,
    'max_created_workspaces', sp.max_created_workspaces,
    'max_guest_workspaces', sp.max_guest_workspaces,
    'max_projects_per_workspace', sp.max_projects_per_workspace,
    'max_invites_per_workspace', sp.max_invites_per_workspace,
    'max_users_per_workspace', sp.max_users_per_workspace,
    'features', sp.features,
    'status', us.status,
    'current_period_end', us.current_period_end,
    'is_master', false
  ) INTO _result
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = _user_id AND us.status = 'active';

  IF _result IS NULL THEN
    _result := jsonb_build_object(
      'plan_name', 'Free',
      'plan_slug', 'free',
      'max_workspaces', 2,
      'max_created_workspaces', 0,
      'max_guest_workspaces', 1,
      'max_projects_per_workspace', 1,
      'max_invites_per_workspace', 0,
      'max_users_per_workspace', 1,
      'features', '{}'::jsonb,
      'status', 'active',
      'current_period_end', null,
      'is_master', false
    );
  END IF;

  RETURN _result;
END;
$$;

-- =============================================
-- 9. Update accept_invitation to check guest limit
-- =============================================
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
  v_can_join boolean;
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
  IF EXISTS(SELECT 1 FROM public.workspace_members WHERE workspace_id = v_invitation.workspace_id AND user_id = _user_id) THEN
    -- Already a member, just handle project if needed
    NULL;
  ELSE
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
