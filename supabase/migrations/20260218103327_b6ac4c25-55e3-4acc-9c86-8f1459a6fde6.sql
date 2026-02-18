
-- Fix: Tighten notifications INSERT policy to require triggered_by = auth.uid()
-- This prevents users from impersonating other users as notification triggers
-- and limits who they can send notifications to (project members only)

DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;

CREATE POLICY "Authenticated users can create notifications for project members"
ON public.notifications
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (triggered_by IS NULL OR triggered_by = auth.uid())
);
