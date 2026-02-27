
-- Fix sprint RLS policies to include workspace admins

-- DROP existing policies
DROP POLICY IF EXISTS "Project admins can create sprints" ON public.sprints;
DROP POLICY IF EXISTS "Project admins can update sprints" ON public.sprints;
DROP POLICY IF EXISTS "Project admins can delete sprints" ON public.sprints;

-- Recreate with workspace admin check
CREATE POLICY "Project admins can create sprints"
ON public.sprints FOR INSERT
WITH CHECK (
  (auth.uid() = created_by) AND (
    has_project_admin_access(auth.uid(), project_id)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_project(auth.uid(), project_id))
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = sprints.project_id
      AND has_workspace_role(auth.uid(), p.workspace_id, 'admin'::workspace_role)
    )
  )
);

CREATE POLICY "Project admins can update sprints"
ON public.sprints FOR UPDATE
USING (
  has_project_admin_access(auth.uid(), project_id)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_project(auth.uid(), project_id))
  OR EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = sprints.project_id
    AND has_workspace_role(auth.uid(), p.workspace_id, 'admin'::workspace_role)
  )
);

CREATE POLICY "Project admins can delete sprints"
ON public.sprints FOR DELETE
USING (
  has_project_admin_access(auth.uid(), project_id)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_project(auth.uid(), project_id))
  OR EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = sprints.project_id
    AND has_workspace_role(auth.uid(), p.workspace_id, 'admin'::workspace_role)
  )
);
