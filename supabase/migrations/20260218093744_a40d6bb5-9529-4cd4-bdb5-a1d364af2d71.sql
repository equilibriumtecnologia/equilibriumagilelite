
-- =============================================
-- ETAPA 1: Consolidação de Roles de Projeto
-- =============================================

-- 1. Criar ENUM project_role
CREATE TYPE public.project_role AS ENUM ('owner', 'admin', 'member', 'viewer');

-- 2. Migrar coluna project_members.role de text para project_role ENUM
ALTER TABLE public.project_members
  ALTER COLUMN role DROP DEFAULT;

ALTER TABLE public.project_members
  ALTER COLUMN role TYPE public.project_role
  USING COALESCE(role, 'member')::public.project_role;

ALTER TABLE public.project_members
  ALTER COLUMN role SET DEFAULT 'member'::public.project_role;

ALTER TABLE public.project_members
  ALTER COLUMN role SET NOT NULL;

-- 3. Criar função has_project_role() security definer
CREATE OR REPLACE FUNCTION public.has_project_role(
  _user_id uuid, _project_id uuid, _role public.project_role
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE user_id = _user_id
      AND project_id = _project_id
      AND role = _role
  )
$$;

-- 4. Função auxiliar: verificar se tem role >= admin no projeto
CREATE OR REPLACE FUNCTION public.has_project_admin_access(
  _user_id uuid, _project_id uuid
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE user_id = _user_id
      AND project_id = _project_id
      AND role IN ('owner', 'admin')
  )
$$;

-- =============================================
-- 5. Atualizar RLS de TASKS
-- =============================================

-- DELETE: restringir a criador, assignee, project admin/owner, app admin/master
DROP POLICY IF EXISTS "Project members can delete tasks" ON public.tasks;
CREATE POLICY "Authorized users can delete tasks" ON public.tasks
FOR DELETE USING (
  created_by = auth.uid()
  OR assigned_to = auth.uid()
  OR has_project_admin_access(auth.uid(), project_id)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'master'::app_role)
);

-- UPDATE: manter lógica atual + project admin/owner
DROP POLICY IF EXISTS "Assigned user, creator, admin or master can update tasks" ON public.tasks;
CREATE POLICY "Authorized users can update tasks" ON public.tasks
FOR UPDATE USING (
  assigned_to = auth.uid()
  OR created_by = auth.uid()
  OR has_project_admin_access(auth.uid(), project_id)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'master'::app_role)
);

-- SELECT: project viewers podem ver (manter is_project_member)
-- Sem mudança necessária, is_project_member já cobre viewers

-- INSERT: project viewers NÃO podem criar tarefas
DROP POLICY IF EXISTS "Project members can create tasks" ON public.tasks;
CREATE POLICY "Non-viewer project members can create tasks" ON public.tasks
FOR INSERT WITH CHECK (
  is_project_member(auth.uid(), project_id)
  AND NOT has_project_role(auth.uid(), project_id, 'viewer'::project_role)
);

-- =============================================
-- 6. Atualizar RLS de SPRINTS
-- =============================================

-- INSERT: project admin/owner + app admin/master podem criar
DROP POLICY IF EXISTS "Project creators and admins can create sprints" ON public.sprints;
CREATE POLICY "Project admins can create sprints" ON public.sprints
FOR INSERT WITH CHECK (
  auth.uid() = created_by
  AND (
    has_project_admin_access(auth.uid(), project_id)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'master'::app_role)
  )
);

-- UPDATE
DROP POLICY IF EXISTS "Project creators and admins can update sprints" ON public.sprints;
CREATE POLICY "Project admins can update sprints" ON public.sprints
FOR UPDATE USING (
  has_project_admin_access(auth.uid(), project_id)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'master'::app_role)
);

-- DELETE
DROP POLICY IF EXISTS "Project creators and admins can delete sprints" ON public.sprints;
CREATE POLICY "Project admins can delete sprints" ON public.sprints
FOR DELETE USING (
  has_project_admin_access(auth.uid(), project_id)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'master'::app_role)
);

-- SELECT: sem mudança

-- =============================================
-- 7. Atualizar RLS de SUB_TASKS
-- =============================================

-- UPDATE: adicionar project admin/owner
DROP POLICY IF EXISTS "Task assignee, creator, admin or master can update sub_tasks" ON public.sub_tasks;
CREATE POLICY "Authorized users can update sub_tasks" ON public.sub_tasks
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = sub_tasks.task_id
    AND (
      t.assigned_to = auth.uid()
      OR t.created_by = auth.uid()
      OR has_project_admin_access(auth.uid(), t.project_id)
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'master'::app_role)
    )
  )
);

-- DELETE
DROP POLICY IF EXISTS "Task assignee, creator, admin or master can delete sub_tasks" ON public.sub_tasks;
CREATE POLICY "Authorized users can delete sub_tasks" ON public.sub_tasks
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = sub_tasks.task_id
    AND (
      t.assigned_to = auth.uid()
      OR t.created_by = auth.uid()
      OR has_project_admin_access(auth.uid(), t.project_id)
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'master'::app_role)
    )
  )
);

-- INSERT: viewers não podem criar subtarefas
DROP POLICY IF EXISTS "Users can create sub_tasks on their project tasks" ON public.sub_tasks;
CREATE POLICY "Non-viewer members can create sub_tasks" ON public.sub_tasks
FOR INSERT WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM tasks t
    JOIN project_members pm ON pm.project_id = t.project_id
    WHERE t.id = sub_tasks.task_id
      AND pm.user_id = auth.uid()
      AND pm.role != 'viewer'::project_role
  )
);

-- =============================================
-- 8. Atualizar RLS de PROJECT_MEMBERS
-- =============================================

-- INSERT: project owner/admin + app admin/master
DROP POLICY IF EXISTS "Project creators can add members" ON public.project_members;
CREATE POLICY "Project admins can add members" ON public.project_members
FOR INSERT WITH CHECK (
  has_project_admin_access(auth.uid(), project_id)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'master'::app_role)
);

-- UPDATE: project owner/admin + app admin/master
DROP POLICY IF EXISTS "Project creators and admins can update member roles" ON public.project_members;
CREATE POLICY "Project admins can update member roles" ON public.project_members
FOR UPDATE USING (
  has_project_admin_access(auth.uid(), project_id)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'master'::app_role)
) WITH CHECK (
  has_project_admin_access(auth.uid(), project_id)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'master'::app_role)
);

-- DELETE: project owner/admin + app admin/master + próprio membro pode sair
DROP POLICY IF EXISTS "Project creators can remove members" ON public.project_members;
CREATE POLICY "Project admins can remove members" ON public.project_members
FOR DELETE USING (
  has_project_admin_access(auth.uid(), project_id)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'master'::app_role)
  OR auth.uid() = user_id
);

-- =============================================
-- 9. Atualizar RLS de BOARD_SETTINGS
-- =============================================

DROP POLICY IF EXISTS "Project creators and admins can manage board settings" ON public.board_settings;
CREATE POLICY "Project admins can manage board settings" ON public.board_settings
FOR ALL USING (
  has_project_admin_access(auth.uid(), project_id)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'master'::app_role)
) WITH CHECK (
  has_project_admin_access(auth.uid(), project_id)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'master'::app_role)
);

-- =============================================
-- 10. Atualizar trigger add_creator_as_member para usar ENUM
-- =============================================

CREATE OR REPLACE FUNCTION public.add_creator_as_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner'::project_role);
  RETURN NEW;
END;
$function$;
