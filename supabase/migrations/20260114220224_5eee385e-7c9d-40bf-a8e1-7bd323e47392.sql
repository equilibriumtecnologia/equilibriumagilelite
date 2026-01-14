-- Fix: Add UPDATE policy on project_members table for role management
-- This allows project creators and admins to update member roles

CREATE POLICY "Project creators and admins can update member roles"
  ON public.project_members FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT created_by FROM public.projects 
      WHERE id = project_id
    )
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'master'::app_role)
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT created_by FROM public.projects 
      WHERE id = project_id
    )
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'master'::app_role)
  );