
-- Fix overly permissive INSERT policy on task_notification_log
-- This table is only written by the check-due-tasks edge function via service role
-- Regular users should not be able to insert directly
DROP POLICY "Service role can insert notification logs" ON public.task_notification_log;

-- Only allow inserts where the user_id matches the authenticated user (defense in depth)
-- The service role bypasses RLS anyway, so this just prevents abuse from anon/authenticated
CREATE POLICY "Authenticated users can log own notifications"
ON public.task_notification_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);
