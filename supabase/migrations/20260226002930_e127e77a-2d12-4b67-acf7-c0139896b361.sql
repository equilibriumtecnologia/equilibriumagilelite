
-- =============================================
-- UPDATE RLS POLICIES TO USE WORKSPACE-SCOPED MASTER ACCESS
-- =============================================

-- 1. WORKSPACES table - SELECT
DROP POLICY IF EXISTS "Membros podem ver seus workspaces" ON public.workspaces;
CREATE POLICY "Membros podem ver seus workspaces"
ON public.workspaces FOR SELECT
USING (
  is_workspace_member(auth.uid(), id)
  OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_workspace(auth.uid(), id))
);

-- WORKSPACES - UPDATE
DROP POLICY IF EXISTS "Owner e admin podem atualizar workspace" ON public.workspaces;
CREATE POLICY "Owner e admin podem atualizar workspace"
ON public.workspaces FOR UPDATE
USING (
  has_workspace_role(auth.uid(), id, 'owner'::workspace_role)
  OR has_workspace_role(auth.uid(), id, 'admin'::workspace_role)
  OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_workspace(auth.uid(), id))
);

-- WORKSPACES - DELETE
DROP POLICY IF EXISTS "Owner pode deletar workspace" ON public.workspaces;
CREATE POLICY "Owner pode deletar workspace"
ON public.workspaces FOR DELETE
USING (
  has_workspace_role(auth.uid(), id, 'owner'::workspace_role)
  OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_workspace(auth.uid(), id))
);

-- 2. WORKSPACE_MEMBERS - SELECT
DROP POLICY IF EXISTS "Membros podem ver membros do workspace" ON public.workspace_members;
CREATE POLICY "Membros podem ver membros do workspace"
ON public.workspace_members FOR SELECT
USING (
  is_workspace_member(auth.uid(), workspace_id)
  OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_workspace(auth.uid(), workspace_id))
);

-- WORKSPACE_MEMBERS - INSERT
DROP POLICY IF EXISTS "Owner e admin podem adicionar membros" ON public.workspace_members;
CREATE POLICY "Owner e admin podem adicionar membros"
ON public.workspace_members FOR INSERT
WITH CHECK (
  has_workspace_role(auth.uid(), workspace_id, 'owner'::workspace_role)
  OR has_workspace_role(auth.uid(), workspace_id, 'admin'::workspace_role)
  OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_workspace(auth.uid(), workspace_id))
  OR (
    (auth.uid() = user_id)
    AND (NOT (EXISTS (
      SELECT 1 FROM workspace_members wm2
      WHERE wm2.workspace_id = workspace_members.workspace_id
    )))
  )
);

-- WORKSPACE_MEMBERS - UPDATE
DROP POLICY IF EXISTS "Owner pode atualizar roles" ON public.workspace_members;
CREATE POLICY "Owner pode atualizar roles"
ON public.workspace_members FOR UPDATE
USING (
  has_workspace_role(auth.uid(), workspace_id, 'owner'::workspace_role)
  OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_workspace(auth.uid(), workspace_id))
);

-- WORKSPACE_MEMBERS - DELETE
DROP POLICY IF EXISTS "Owner pode remover membros" ON public.workspace_members;
CREATE POLICY "Owner pode remover membros"
ON public.workspace_members FOR DELETE
USING (
  has_workspace_role(auth.uid(), workspace_id, 'owner'::workspace_role)
  OR has_workspace_role(auth.uid(), workspace_id, 'admin'::workspace_role)
  OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_workspace(auth.uid(), workspace_id))
  OR (auth.uid() = user_id)
);

-- 3. CATEGORIES - SELECT
DROP POLICY IF EXISTS "Membros do workspace podem ver categorias" ON public.categories;
CREATE POLICY "Membros do workspace podem ver categorias"
ON public.categories FOR SELECT
USING (
  is_workspace_member(auth.uid(), workspace_id)
  OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_workspace(auth.uid(), workspace_id))
);

-- CATEGORIES - INSERT
DROP POLICY IF EXISTS "Admin e Master podem criar categorias" ON public.categories;
CREATE POLICY "Admin e Master podem criar categorias"
ON public.categories FOR INSERT
WITH CHECK (
  is_workspace_member(auth.uid(), workspace_id) AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_workspace_role(auth.uid(), workspace_id, 'owner'::workspace_role)
    OR has_workspace_role(auth.uid(), workspace_id, 'admin'::workspace_role)
  )
  OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_workspace(auth.uid(), workspace_id))
);

-- CATEGORIES - UPDATE
DROP POLICY IF EXISTS "Admin e Master podem atualizar categorias" ON public.categories;
CREATE POLICY "Admin e Master podem atualizar categorias"
ON public.categories FOR UPDATE
USING (
  (is_workspace_member(auth.uid(), workspace_id) AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_workspace_role(auth.uid(), workspace_id, 'owner'::workspace_role)
    OR has_workspace_role(auth.uid(), workspace_id, 'admin'::workspace_role)
  ))
  OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_workspace(auth.uid(), workspace_id))
);

-- CATEGORIES - DELETE
DROP POLICY IF EXISTS "Admin e Master podem deletar categorias" ON public.categories;
CREATE POLICY "Admin e Master podem deletar categorias"
ON public.categories FOR DELETE
USING (
  (is_workspace_member(auth.uid(), workspace_id) AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_workspace_role(auth.uid(), workspace_id, 'owner'::workspace_role)
    OR has_workspace_role(auth.uid(), workspace_id, 'admin'::workspace_role)
  ))
  OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_workspace(auth.uid(), workspace_id))
);

-- 4. INVITATIONS - SELECT
DROP POLICY IF EXISTS "Usuários podem ver convites do workspace" ON public.invitations;
CREATE POLICY "Usuários podem ver convites do workspace"
ON public.invitations FOR SELECT
USING (
  (invited_by = auth.uid())
  OR is_workspace_member(auth.uid(), workspace_id)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_workspace(auth.uid(), workspace_id))
);

-- INVITATIONS - INSERT
DROP POLICY IF EXISTS "Membros podem criar convites no workspace" ON public.invitations;
CREATE POLICY "Membros podem criar convites no workspace"
ON public.invitations FOR INSERT
WITH CHECK (
  (
    (auth.uid() = invited_by)
    AND is_workspace_member(auth.uid(), workspace_id)
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_workspace_role(auth.uid(), workspace_id, 'owner'::workspace_role)
      OR has_workspace_role(auth.uid(), workspace_id, 'admin'::workspace_role)
    )
  )
  OR (
    (auth.uid() = invited_by)
    AND has_role(auth.uid(), 'master'::app_role)
    AND master_can_access_workspace(auth.uid(), workspace_id)
  )
);

-- INVITATIONS - UPDATE
DROP POLICY IF EXISTS "Criador do convite pode atualizar" ON public.invitations;
CREATE POLICY "Criador do convite pode atualizar"
ON public.invitations FOR UPDATE
USING (
  (invited_by = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_workspace(auth.uid(), workspace_id))
);

-- INVITATIONS - DELETE
DROP POLICY IF EXISTS "Criador do convite pode deletar" ON public.invitations;
CREATE POLICY "Criador do convite pode deletar"
ON public.invitations FOR DELETE
USING (
  (status <> 'accepted'::invitation_status)
  AND (
    (invited_by = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
    OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_workspace(auth.uid(), workspace_id))
    OR has_workspace_role(auth.uid(), workspace_id, 'owner'::workspace_role)
    OR has_workspace_role(auth.uid(), workspace_id, 'admin'::workspace_role)
  )
);

-- 5. USER_PERMISSIONS - SELECT
DROP POLICY IF EXISTS "Users can view permissions in workspace" ON public.user_permissions;
CREATE POLICY "Users can view permissions in workspace"
ON public.user_permissions FOR SELECT
USING (
  (user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_workspace(auth.uid(), workspace_id))
  OR has_workspace_role(auth.uid(), workspace_id, 'owner'::workspace_role)
  OR has_workspace_role(auth.uid(), workspace_id, 'admin'::workspace_role)
);

-- USER_PERMISSIONS - INSERT
DROP POLICY IF EXISTS "Master and owners can insert permissions" ON public.user_permissions;
CREATE POLICY "Master and owners can insert permissions"
ON public.user_permissions FOR INSERT
WITH CHECK (
  (has_role(auth.uid(), 'master'::app_role) AND master_can_access_workspace(auth.uid(), workspace_id))
  OR has_workspace_role(auth.uid(), workspace_id, 'owner'::workspace_role)
);

-- USER_PERMISSIONS - UPDATE
DROP POLICY IF EXISTS "Master and owners can update permissions" ON public.user_permissions;
CREATE POLICY "Master and owners can update permissions"
ON public.user_permissions FOR UPDATE
USING (
  (has_role(auth.uid(), 'master'::app_role) AND master_can_access_workspace(auth.uid(), workspace_id))
  OR has_workspace_role(auth.uid(), workspace_id, 'owner'::workspace_role)
);

-- USER_PERMISSIONS - DELETE
DROP POLICY IF EXISTS "Master and owners can delete permissions" ON public.user_permissions;
CREATE POLICY "Master and owners can delete permissions"
ON public.user_permissions FOR DELETE
USING (
  (has_role(auth.uid(), 'master'::app_role) AND master_can_access_workspace(auth.uid(), workspace_id))
  OR has_workspace_role(auth.uid(), workspace_id, 'owner'::workspace_role)
);

-- 6. PROJECTS - SELECT
DROP POLICY IF EXISTS "Users can view projects they are members of" ON public.projects;
CREATE POLICY "Users can view projects they are members of"
ON public.projects FOR SELECT
USING (
  is_project_member(auth.uid(), id)
  OR (created_by = auth.uid())
  OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_workspace(auth.uid(), workspace_id))
);

-- PROJECTS - UPDATE
DROP POLICY IF EXISTS "Project creators can update their projects" ON public.projects;
CREATE POLICY "Project creators can update their projects"
ON public.projects FOR UPDATE
USING (
  (created_by = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_workspace_role(auth.uid(), workspace_id, 'owner'::workspace_role)
  OR has_workspace_role(auth.uid(), workspace_id, 'admin'::workspace_role)
  OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_workspace(auth.uid(), workspace_id))
);

-- PROJECTS - DELETE
DROP POLICY IF EXISTS "Project creators can delete their projects" ON public.projects;
CREATE POLICY "Project creators can delete their projects"
ON public.projects FOR DELETE
USING (
  (created_by = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_workspace_role(auth.uid(), workspace_id, 'owner'::workspace_role)
  OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_workspace(auth.uid(), workspace_id))
);

-- 7. BOARD_SETTINGS - ALL
DROP POLICY IF EXISTS "Project admins can manage board settings" ON public.board_settings;
CREATE POLICY "Project admins can manage board settings"
ON public.board_settings FOR ALL
USING (
  has_project_admin_access(auth.uid(), project_id)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_project(auth.uid(), project_id))
)
WITH CHECK (
  has_project_admin_access(auth.uid(), project_id)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_project(auth.uid(), project_id))
);

-- 8. SPRINTS - INSERT
DROP POLICY IF EXISTS "Project admins can create sprints" ON public.sprints;
CREATE POLICY "Project admins can create sprints"
ON public.sprints FOR INSERT
WITH CHECK (
  (auth.uid() = created_by)
  AND (
    has_project_admin_access(auth.uid(), project_id)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_project(auth.uid(), project_id))
  )
);

-- SPRINTS - UPDATE
DROP POLICY IF EXISTS "Project admins can update sprints" ON public.sprints;
CREATE POLICY "Project admins can update sprints"
ON public.sprints FOR UPDATE
USING (
  has_project_admin_access(auth.uid(), project_id)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_project(auth.uid(), project_id))
);

-- SPRINTS - DELETE
DROP POLICY IF EXISTS "Project admins can delete sprints" ON public.sprints;
CREATE POLICY "Project admins can delete sprints"
ON public.sprints FOR DELETE
USING (
  has_project_admin_access(auth.uid(), project_id)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_project(auth.uid(), project_id))
);

-- 9. TASKS - UPDATE
DROP POLICY IF EXISTS "Authorized users can update tasks" ON public.tasks;
CREATE POLICY "Authorized users can update tasks"
ON public.tasks FOR UPDATE
USING (
  (assigned_to = auth.uid())
  OR (created_by = auth.uid())
  OR has_project_admin_access(auth.uid(), project_id)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_project(auth.uid(), project_id))
);

-- TASKS - DELETE
DROP POLICY IF EXISTS "Authorized users can delete tasks" ON public.tasks;
CREATE POLICY "Authorized users can delete tasks"
ON public.tasks FOR DELETE
USING (
  (created_by = auth.uid())
  OR (assigned_to = auth.uid())
  OR has_project_admin_access(auth.uid(), project_id)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_project(auth.uid(), project_id))
);

-- 10. SUB_TASKS - UPDATE
DROP POLICY IF EXISTS "Authorized users can update sub_tasks" ON public.sub_tasks;
CREATE POLICY "Authorized users can update sub_tasks"
ON public.sub_tasks FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = sub_tasks.task_id
    AND (
      (t.assigned_to = auth.uid())
      OR (t.created_by = auth.uid())
      OR has_project_admin_access(auth.uid(), t.project_id)
      OR has_role(auth.uid(), 'admin'::app_role)
      OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_project(auth.uid(), t.project_id))
    )
  )
);

-- SUB_TASKS - DELETE
DROP POLICY IF EXISTS "Authorized users can delete sub_tasks" ON public.sub_tasks;
CREATE POLICY "Authorized users can delete sub_tasks"
ON public.sub_tasks FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = sub_tasks.task_id
    AND (
      (t.assigned_to = auth.uid())
      OR (t.created_by = auth.uid())
      OR has_project_admin_access(auth.uid(), t.project_id)
      OR has_role(auth.uid(), 'admin'::app_role)
      OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_project(auth.uid(), t.project_id))
    )
  )
);

-- 11. PROFILES - SELECT (master sees profiles only from accessible workspaces or shared projects)
DROP POLICY IF EXISTS "Users can view profiles of project members" ON public.profiles;
CREATE POLICY "Users can view profiles of project members"
ON public.profiles FOR SELECT
USING (
  (id = auth.uid())
  OR shares_project_with(auth.uid(), id)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'master'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.user_id = profiles.id
      AND master_can_access_workspace(auth.uid(), wm.workspace_id)
    )
  )
);

-- 12. USER_ROLES - SELECT (keep system-level access but scoped)
DROP POLICY IF EXISTS "Users can view own role, admins/masters can view all" ON public.user_roles;
CREATE POLICY "Users can view own role, admins/masters can view all"
ON public.user_roles FOR SELECT
USING (
  (user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'master'::app_role)
    AND (
      -- Master can see roles of users in accessible workspaces
      EXISTS (
        SELECT 1 FROM public.workspace_members wm
        WHERE wm.user_id = user_roles.user_id
        AND master_can_access_workspace(auth.uid(), wm.workspace_id)
      )
      -- Or their own role
      OR user_roles.user_id = auth.uid()
    )
  )
);
