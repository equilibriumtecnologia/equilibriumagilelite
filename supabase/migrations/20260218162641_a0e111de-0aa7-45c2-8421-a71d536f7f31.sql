
-- Drop the existing permissive SELECT policy
DROP POLICY IF EXISTS "Users can view projects they are members of" ON public.projects;

-- Create a new restrictive SELECT policy: only project members or project creator can see the project
CREATE POLICY "Users can view projects they are members of"
ON public.projects
FOR SELECT
USING (
  is_project_member(auth.uid(), id)
  OR (created_by = auth.uid())
  OR has_role(auth.uid(), 'master'::app_role)
);
