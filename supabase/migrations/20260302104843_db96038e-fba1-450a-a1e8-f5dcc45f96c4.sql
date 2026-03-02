
-- Fix tasks UPDATE policy to include workspace admins
DROP POLICY IF EXISTS "Authorized users can update tasks" ON public.tasks;
CREATE POLICY "Authorized users can update tasks"
ON public.tasks
FOR UPDATE
USING (
  (assigned_to = auth.uid())
  OR (created_by = auth.uid())
  OR has_project_admin_access(auth.uid(), project_id)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_project(auth.uid(), project_id))
  OR (EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = tasks.project_id
    AND (
      has_workspace_role(auth.uid(), p.workspace_id, 'owner'::workspace_role)
      OR has_workspace_role(auth.uid(), p.workspace_id, 'admin'::workspace_role)
    )
  ))
);

-- Fix tasks DELETE policy to include workspace admins
DROP POLICY IF EXISTS "Authorized users can delete tasks" ON public.tasks;
CREATE POLICY "Authorized users can delete tasks"
ON public.tasks
FOR DELETE
USING (
  (created_by = auth.uid())
  OR (assigned_to = auth.uid())
  OR has_project_admin_access(auth.uid(), project_id)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_project(auth.uid(), project_id))
  OR (EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = tasks.project_id
    AND (
      has_workspace_role(auth.uid(), p.workspace_id, 'owner'::workspace_role)
      OR has_workspace_role(auth.uid(), p.workspace_id, 'admin'::workspace_role)
    )
  ))
);
