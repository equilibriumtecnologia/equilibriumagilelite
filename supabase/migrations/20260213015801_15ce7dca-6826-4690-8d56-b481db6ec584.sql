
-- Create task_notification_log table to prevent duplicate notifications
CREATE TABLE public.task_notification_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('due_soon', 'overdue')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint to prevent sending the same notification twice
ALTER TABLE public.task_notification_log 
  ADD CONSTRAINT unique_task_user_notification UNIQUE (task_id, user_id, notification_type);

-- Create index for faster lookups
CREATE INDEX idx_task_notification_log_task_user ON public.task_notification_log(task_id, user_id);

-- Enable RLS (no public policies - only service_role can access)
ALTER TABLE public.task_notification_log ENABLE ROW LEVEL SECURITY;

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
