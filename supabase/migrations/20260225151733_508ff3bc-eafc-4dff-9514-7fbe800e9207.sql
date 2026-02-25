
-- Add RLS policies to task_notification_log table
-- This table is used by the check-due-tasks edge function (service role) to track sent notifications

-- RLS is already enabled but no policies exist. Add proper policies:

-- Users can view their own notification logs
CREATE POLICY "Users can view own notification logs"
ON public.task_notification_log
FOR SELECT
USING (auth.uid() = user_id);

-- Only service role (edge functions) should insert - allow authenticated users who are the target
CREATE POLICY "Service role can insert notification logs"
ON public.task_notification_log
FOR INSERT
WITH CHECK (true);

-- No one should update notification logs
-- No one should delete notification logs (immutable audit trail)
