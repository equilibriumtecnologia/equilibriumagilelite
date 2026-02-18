
-- =============================================
-- STAGE 2: Subscriptions, Default Workspace, Limits, Auto-permissions
-- =============================================

-- 1. Subscription Plans table
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  max_workspaces integer NOT NULL DEFAULT 1,
  max_users_per_workspace integer NOT NULL DEFAULT 1,
  price_monthly_cents integer NOT NULL DEFAULT 0,
  price_yearly_cents integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  features jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
ON public.subscription_plans FOR SELECT
USING (is_active = true);

-- 2. User Subscriptions table
CREATE TABLE public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
ON public.user_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role manages subscriptions"
ON public.user_subscriptions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Seed 4 plans
INSERT INTO public.subscription_plans (name, slug, max_workspaces, max_users_per_workspace, price_monthly_cents, price_yearly_cents, features)
VALUES
  ('Free', 'free', 1, 1, 0, 0, '{"support": "community"}'),
  ('Starter', 'starter', 3, 3, 2900, 31320, '{"support": "email"}'),
  ('Pro', 'pro', 10, 10, 7900, 85320, '{"support": "priority", "advanced_reports": true}'),
  ('Enterprise', 'enterprise', 999, 999, 19900, 214920, '{"support": "dedicated", "advanced_reports": true, "custom_permissions": true, "sso": true}');

-- 4. Update handle_new_user to create default workspace + free subscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Set default permissions for the workspace
  PERFORM public.set_default_permissions(NEW.id, _workspace_id, 'user');

  -- Assign free plan
  SELECT id INTO _free_plan_id FROM public.subscription_plans WHERE slug = 'free' LIMIT 1;
  IF _free_plan_id IS NOT NULL THEN
    INSERT INTO public.user_subscriptions (user_id, plan_id, status)
    VALUES (NEW.id, _free_plan_id, 'active');
  END IF;

  RETURN NEW;
END;
$$;

-- 5. Limit verification functions

-- Check workspace count limit
CREATE OR REPLACE FUNCTION public.check_workspace_limit(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _max_ws integer;
  _current_ws integer;
BEGIN
  SELECT sp.max_workspaces INTO _max_ws
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = _user_id AND us.status = 'active';

  IF _max_ws IS NULL THEN _max_ws := 1; END IF;

  SELECT count(*) INTO _current_ws
  FROM public.workspace_members
  WHERE user_id = _user_id;

  RETURN _current_ws < _max_ws;
END;
$$;

-- Check users per workspace limit
CREATE OR REPLACE FUNCTION public.check_workspace_user_limit(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _max_users integer;
  _current_users integer;
  _ws_owner_id uuid;
BEGIN
  -- Find workspace owner to check their subscription
  SELECT user_id INTO _ws_owner_id
  FROM public.workspace_members
  WHERE workspace_id = _workspace_id AND role = 'owner'
  LIMIT 1;

  IF _ws_owner_id IS NULL THEN RETURN false; END IF;

  SELECT sp.max_users_per_workspace INTO _max_users
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = _ws_owner_id AND us.status = 'active';

  IF _max_users IS NULL THEN _max_users := 1; END IF;

  SELECT count(*) INTO _current_users
  FROM public.workspace_members
  WHERE workspace_id = _workspace_id;

  RETURN _current_users < _max_users;
END;
$$;

-- Get user plan info
CREATE OR REPLACE FUNCTION public.get_user_plan(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'plan_name', sp.name,
    'plan_slug', sp.slug,
    'max_workspaces', sp.max_workspaces,
    'max_users_per_workspace', sp.max_users_per_workspace,
    'features', sp.features,
    'status', us.status,
    'current_period_end', us.current_period_end
  ) INTO _result
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = _user_id AND us.status = 'active';

  IF _result IS NULL THEN
    _result := jsonb_build_object(
      'plan_name', 'Free',
      'plan_slug', 'free',
      'max_workspaces', 1,
      'max_users_per_workspace', 1,
      'features', '{}',
      'status', 'active',
      'current_period_end', null
    );
  END IF;

  RETURN _result;
END;
$$;

-- 6. Update update_user_role to auto-assign default permissions
CREATE OR REPLACE FUNCTION public.update_user_role(_target_user_id uuid, _new_role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller_role app_role;
  _target_current_role app_role;
  _ws record;
BEGIN
  SELECT role INTO _caller_role FROM public.user_roles WHERE user_id = auth.uid();

  IF auth.uid() = _target_user_id THEN
    RAISE EXCEPTION 'Não é possível alterar seu próprio role';
  END IF;

  SELECT role INTO _target_current_role FROM public.user_roles WHERE user_id = _target_user_id;
  IF _target_current_role IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Master rules
  IF _caller_role = 'master' THEN
    IF _target_current_role = 'master' THEN
      RAISE EXCEPTION 'Não é possível alterar o role de outro master';
    END IF;
    IF _new_role = 'master' THEN
      RAISE EXCEPTION 'Use a transferência de propriedade para promover a master';
    END IF;
    UPDATE public.user_roles SET role = _new_role WHERE user_id = _target_user_id;

    -- Auto-assign default permissions for all workspaces the user belongs to
    FOR _ws IN SELECT workspace_id FROM public.workspace_members WHERE user_id = _target_user_id
    LOOP
      PERFORM public.set_default_permissions(_target_user_id, _ws.workspace_id, _new_role::text);
    END LOOP;

    RETURN true;
  END IF;

  -- Admin rules
  IF _caller_role = 'admin' THEN
    IF _target_current_role NOT IN ('user', 'viewer') THEN
      RAISE EXCEPTION 'Admins só podem alterar roles de membros e convidados';
    END IF;
    IF _new_role NOT IN ('user', 'viewer') THEN
      RAISE EXCEPTION 'Admins só podem definir como membro ou convidado';
    END IF;
    UPDATE public.user_roles SET role = _new_role WHERE user_id = _target_user_id;

    FOR _ws IN SELECT workspace_id FROM public.workspace_members WHERE user_id = _target_user_id
    LOOP
      PERFORM public.set_default_permissions(_target_user_id, _ws.workspace_id, _new_role::text);
    END LOOP;

    RETURN true;
  END IF;

  RAISE EXCEPTION 'Sem permissão para alterar roles';
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
