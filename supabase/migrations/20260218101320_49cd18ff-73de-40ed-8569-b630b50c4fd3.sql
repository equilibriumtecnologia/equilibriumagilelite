
-- 1. Add 'viewer' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'viewer';

-- 2. Add is_default column to workspaces
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;

-- 3. Create user_permissions table for granular permission matrix
CREATE TABLE public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  -- Workspace permissions (Tier 2 - Admin+)
  can_manage_workspace_settings boolean NOT NULL DEFAULT false,
  can_manage_members boolean NOT NULL DEFAULT false,
  can_invite_members boolean NOT NULL DEFAULT false,
  -- Project permissions (Tier 2-3)
  can_create_project boolean NOT NULL DEFAULT false,
  can_edit_project boolean NOT NULL DEFAULT false,
  can_delete_project boolean NOT NULL DEFAULT false,
  can_manage_project_members boolean NOT NULL DEFAULT false,
  -- Task permissions (Tier 3 - Member+)
  can_create_task boolean NOT NULL DEFAULT false,
  can_edit_own_task boolean NOT NULL DEFAULT false,
  can_edit_any_task boolean NOT NULL DEFAULT false,
  can_delete_own_task boolean NOT NULL DEFAULT false,
  can_delete_any_task boolean NOT NULL DEFAULT false,
  can_assign_task boolean NOT NULL DEFAULT false,
  -- Sprint permissions (Tier 2 - Admin+)
  can_create_sprint boolean NOT NULL DEFAULT false,
  can_edit_sprint boolean NOT NULL DEFAULT false,
  can_delete_sprint boolean NOT NULL DEFAULT false,
  -- Other permissions
  can_manage_categories boolean NOT NULL DEFAULT false,
  can_view_reports boolean NOT NULL DEFAULT false,
  can_manage_board_settings boolean NOT NULL DEFAULT false,
  can_manage_backlog boolean NOT NULL DEFAULT false,
  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, workspace_id),
  CONSTRAINT user_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_permissions
CREATE POLICY "Users can view permissions in workspace"
ON public.user_permissions FOR SELECT
USING (
  user_id = auth.uid()
  OR has_role(auth.uid(), 'master'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_workspace_role(auth.uid(), workspace_id, 'owner'::workspace_role)
  OR has_workspace_role(auth.uid(), workspace_id, 'admin'::workspace_role)
);

CREATE POLICY "Master and owners can insert permissions"
ON public.user_permissions FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role)
  OR has_workspace_role(auth.uid(), workspace_id, 'owner'::workspace_role)
);

CREATE POLICY "Master and owners can update permissions"
ON public.user_permissions FOR UPDATE
USING (
  has_role(auth.uid(), 'master'::app_role)
  OR has_workspace_role(auth.uid(), workspace_id, 'owner'::workspace_role)
);

CREATE POLICY "Master and owners can delete permissions"
ON public.user_permissions FOR DELETE
USING (
  has_role(auth.uid(), 'master'::app_role)
  OR has_workspace_role(auth.uid(), workspace_id, 'owner'::workspace_role)
);

CREATE TRIGGER update_user_permissions_updated_at
BEFORE UPDATE ON public.user_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4. RPC to safely update user roles with business rules enforcement
CREATE OR REPLACE FUNCTION public.update_user_role(_target_user_id uuid, _new_role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _caller_role app_role;
  _target_current_role app_role;
BEGIN
  -- Get caller role
  SELECT role INTO _caller_role FROM public.user_roles WHERE user_id = auth.uid();
  
  -- Cannot change own role
  IF auth.uid() = _target_user_id THEN
    RAISE EXCEPTION 'Não é possível alterar seu próprio role';
  END IF;
  
  -- Get target current role
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
    RETURN true;
  END IF;
  
  -- Admin rules: only toggle between user (member) and viewer
  IF _caller_role = 'admin' THEN
    IF _target_current_role NOT IN ('user', 'viewer') THEN
      RAISE EXCEPTION 'Admins só podem alterar roles de membros e convidados';
    END IF;
    IF _new_role NOT IN ('user', 'viewer') THEN
      RAISE EXCEPTION 'Admins só podem definir como membro ou convidado';
    END IF;
    UPDATE public.user_roles SET role = _new_role WHERE user_id = _target_user_id;
    RETURN true;
  END IF;
  
  RAISE EXCEPTION 'Sem permissão para alterar roles';
END;
$$;

-- 5. Function to set default permissions based on role
CREATE OR REPLACE FUNCTION public.set_default_permissions(
  _user_id uuid,
  _workspace_id uuid,
  _role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.user_permissions (
    user_id, workspace_id,
    can_manage_workspace_settings, can_manage_members, can_invite_members,
    can_create_project, can_edit_project, can_delete_project, can_manage_project_members,
    can_create_task, can_edit_own_task, can_edit_any_task,
    can_delete_own_task, can_delete_any_task, can_assign_task,
    can_create_sprint, can_edit_sprint, can_delete_sprint,
    can_manage_categories, can_view_reports, can_manage_board_settings, can_manage_backlog
  )
  VALUES (
    _user_id, _workspace_id,
    _role IN ('master', 'owner', 'admin'),  -- can_manage_workspace_settings
    _role IN ('master', 'owner', 'admin'),  -- can_manage_members
    _role IN ('master', 'owner', 'admin'),  -- can_invite_members
    _role IN ('master', 'owner', 'admin', 'user', 'member'),  -- can_create_project
    _role IN ('master', 'owner', 'admin', 'user', 'member'),  -- can_edit_project
    _role IN ('master', 'owner', 'admin'),  -- can_delete_project
    _role IN ('master', 'owner', 'admin'),  -- can_manage_project_members
    _role IN ('master', 'owner', 'admin', 'user', 'member'),  -- can_create_task
    _role IN ('master', 'owner', 'admin', 'user', 'member'),  -- can_edit_own_task
    _role IN ('master', 'owner', 'admin'),  -- can_edit_any_task
    _role IN ('master', 'owner', 'admin', 'user', 'member'),  -- can_delete_own_task
    _role IN ('master', 'owner', 'admin'),  -- can_delete_any_task
    _role IN ('master', 'owner', 'admin'),  -- can_assign_task (admin+ by default, but configurable for members in enterprise)
    _role IN ('master', 'owner', 'admin'),  -- can_create_sprint
    _role IN ('master', 'owner', 'admin'),  -- can_edit_sprint
    _role IN ('master', 'owner', 'admin'),  -- can_delete_sprint
    _role IN ('master', 'owner', 'admin'),  -- can_manage_categories
    _role IN ('master', 'owner', 'admin', 'user', 'member'),  -- can_view_reports
    _role IN ('master', 'owner', 'admin'),  -- can_manage_board_settings
    _role IN ('master', 'owner', 'admin', 'user', 'member')   -- can_manage_backlog
  )
  ON CONFLICT (user_id, workspace_id) DO UPDATE SET
    can_manage_workspace_settings = EXCLUDED.can_manage_workspace_settings,
    can_manage_members = EXCLUDED.can_manage_members,
    can_invite_members = EXCLUDED.can_invite_members,
    can_create_project = EXCLUDED.can_create_project,
    can_edit_project = EXCLUDED.can_edit_project,
    can_delete_project = EXCLUDED.can_delete_project,
    can_manage_project_members = EXCLUDED.can_manage_project_members,
    can_create_task = EXCLUDED.can_create_task,
    can_edit_own_task = EXCLUDED.can_edit_own_task,
    can_edit_any_task = EXCLUDED.can_edit_any_task,
    can_delete_own_task = EXCLUDED.can_delete_own_task,
    can_delete_any_task = EXCLUDED.can_delete_any_task,
    can_assign_task = EXCLUDED.can_assign_task,
    can_create_sprint = EXCLUDED.can_create_sprint,
    can_edit_sprint = EXCLUDED.can_edit_sprint,
    can_delete_sprint = EXCLUDED.can_delete_sprint,
    can_manage_categories = EXCLUDED.can_manage_categories,
    can_view_reports = EXCLUDED.can_view_reports,
    can_manage_board_settings = EXCLUDED.can_manage_board_settings,
    can_manage_backlog = EXCLUDED.can_manage_backlog,
    updated_at = now();
END;
$$;

-- 6. Update transfer_workspace_ownership to block default workspaces
CREATE OR REPLACE FUNCTION public.transfer_workspace_ownership(_workspace_id uuid, _new_owner_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _current_owner_id UUID;
  _is_default BOOLEAN;
BEGIN
  -- Block transfer of default workspace
  SELECT is_default INTO _is_default FROM public.workspaces WHERE id = _workspace_id;
  IF _is_default THEN
    RAISE EXCEPTION 'Workspace padrão não pode ser transferido';
  END IF;

  SELECT user_id INTO _current_owner_id
  FROM public.workspace_members
  WHERE workspace_id = _workspace_id AND role = 'owner';

  IF _current_owner_id IS NULL OR _current_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Apenas o owner atual pode transferir o workspace';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = _workspace_id AND user_id = _new_owner_id) THEN
    RAISE EXCEPTION 'O novo owner deve ser membro do workspace';
  END IF;

  -- Demote current owner to admin
  UPDATE public.workspace_members SET role = 'admin' WHERE workspace_id = _workspace_id AND user_id = _current_owner_id;
  -- Promote new owner
  UPDATE public.workspace_members SET role = 'owner' WHERE workspace_id = _workspace_id AND user_id = _new_owner_id;

  RETURN TRUE;
END;
$$;
