
-- 1. Create master_workspace_access table
CREATE TABLE public.master_workspace_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (workspace_id)
);

-- Enable RLS
ALTER TABLE public.master_workspace_access ENABLE ROW LEVEL SECURITY;

-- Only master can view
CREATE POLICY "Master can view access list"
ON public.master_workspace_access
FOR SELECT
USING (has_role(auth.uid(), 'master'::app_role));

-- Only master can insert
CREATE POLICY "Master can insert access"
ON public.master_workspace_access
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'master'::app_role));

-- Only master can update
CREATE POLICY "Master can update access"
ON public.master_workspace_access
FOR UPDATE
USING (has_role(auth.uid(), 'master'::app_role));

-- Only master can delete
CREATE POLICY "Master can delete access"
ON public.master_workspace_access
FOR DELETE
USING (has_role(auth.uid(), 'master'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_master_workspace_access_updated_at
BEFORE UPDATE ON public.master_workspace_access
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Populate table with all existing workspaces (disabled by default)
INSERT INTO public.master_workspace_access (workspace_id, is_enabled)
SELECT id, false FROM public.workspaces
ON CONFLICT (workspace_id) DO NOTHING;

-- 3. Auto-insert row when new workspace is created (disabled by default)
CREATE OR REPLACE FUNCTION public.auto_create_master_workspace_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.master_workspace_access (workspace_id, is_enabled)
  VALUES (NEW.id, false)
  ON CONFLICT (workspace_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_master_workspace_access
AFTER INSERT ON public.workspaces
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_master_workspace_access();

-- 4. Enable master's OWN workspace(s) by default
UPDATE public.master_workspace_access
SET is_enabled = true
WHERE workspace_id IN (
  SELECT wm.workspace_id 
  FROM public.workspace_members wm
  JOIN public.user_roles ur ON ur.user_id = wm.user_id
  WHERE ur.role = 'master' AND wm.role = 'owner'
);

-- 5. Create helper function: master_can_access_workspace
-- Returns true if: user is NOT master, OR master has checkbox enabled, OR master is an actual workspace member
CREATE OR REPLACE FUNCTION public.master_can_access_workspace(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    -- Not master? Don't restrict (this function is for master-specific checks)
    NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'master')
    OR
    -- Master with checkbox enabled
    EXISTS (SELECT 1 FROM public.master_workspace_access WHERE workspace_id = _workspace_id AND is_enabled = true)
    OR
    -- Master who is an actual workspace member (invited/joined)
    EXISTS (SELECT 1 FROM public.workspace_members WHERE user_id = _user_id AND workspace_id = _workspace_id)
$$;

-- 6. Helper for project-level master access (resolves workspace through project)
CREATE OR REPLACE FUNCTION public.master_can_access_project(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'master')
    OR
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = _project_id
      AND public.master_can_access_workspace(_user_id, p.workspace_id)
    )
$$;

-- 7. Update transfer_workspace_ownership to validate plan limits for recipient
CREATE OR REPLACE FUNCTION public.transfer_workspace_ownership(_workspace_id uuid, _new_owner_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _current_owner_id UUID;
  _is_default BOOLEAN;
  _is_new_owner_master BOOLEAN;
  _max_created integer;
  _current_created integer;
BEGIN
  -- Block transfer of default workspace
  SELECT is_default INTO _is_default FROM public.workspaces WHERE id = _workspace_id;
  IF _is_default THEN
    RAISE EXCEPTION 'Workspace padrão não pode ser transferido';
  END IF;

  -- Only current owner can transfer
  SELECT user_id INTO _current_owner_id
  FROM public.workspace_members
  WHERE workspace_id = _workspace_id AND role = 'owner';

  IF _current_owner_id IS NULL OR _current_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Apenas o owner atual pode transferir o workspace';
  END IF;

  -- New owner must be a workspace member
  IF NOT EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = _workspace_id AND user_id = _new_owner_id) THEN
    RAISE EXCEPTION 'O novo owner deve ser membro do workspace';
  END IF;

  -- Check if new owner is master (no limits)
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _new_owner_id AND role = 'master') INTO _is_new_owner_master;

  -- If not master, check created_workspaces limit for recipient
  IF NOT _is_new_owner_master THEN
    SELECT COALESCE(sp.max_created_workspaces, 0) INTO _max_created
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = _new_owner_id AND us.status = 'active';

    IF _max_created IS NULL THEN _max_created := 0; END IF;

    -- Count workspaces where new owner is already owner (excluding default)
    SELECT count(*) INTO _current_created
    FROM public.workspace_members wm
    JOIN public.workspaces w ON w.id = wm.workspace_id
    WHERE wm.user_id = _new_owner_id AND wm.role = 'owner' AND w.is_default = false;

    IF _current_created >= _max_created THEN
      RAISE EXCEPTION 'O destinatário atingiu o limite de workspaces criados do seu plano. Ele precisa fazer upgrade para receber este workspace.';
    END IF;
  END IF;

  -- Demote current owner to admin
  UPDATE public.workspace_members SET role = 'admin' WHERE workspace_id = _workspace_id AND user_id = _current_owner_id;
  -- Promote new owner
  UPDATE public.workspace_members SET role = 'owner' WHERE workspace_id = _workspace_id AND user_id = _new_owner_id;

  RETURN TRUE;
END;
$$;
