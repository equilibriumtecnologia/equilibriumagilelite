-- Drop existing update policy
DROP POLICY IF EXISTS "Project members can update tasks" ON public.tasks;

-- Create new policy: only assigned user, task creator, admin or master can update
CREATE POLICY "Assigned user, creator, admin or master can update tasks" 
ON public.tasks 
FOR UPDATE 
USING (
  auth.uid() = assigned_to 
  OR auth.uid() = created_by
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'master'::app_role)
);

-- Create enum for task history action types
CREATE TYPE public.task_action_type AS ENUM (
  'created',
  'status_changed',
  'assigned',
  'unassigned',
  'priority_changed',
  'due_date_changed',
  'title_changed',
  'description_changed',
  'comment_added',
  'deleted'
);

-- Create task_history table for audit and tracking
CREATE TABLE public.task_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action task_action_type NOT NULL,
  old_value TEXT,
  new_value TEXT,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_task_history_task_id ON public.task_history(task_id);
CREATE INDEX idx_task_history_created_at ON public.task_history(created_at);

-- Enable RLS
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_history
-- Users can view history of tasks they have access to (via project membership)
CREATE POLICY "Users can view history of their project tasks" 
ON public.task_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.project_members pm ON pm.project_id = t.project_id
    WHERE t.id = task_history.task_id
    AND pm.user_id = auth.uid()
  )
);

-- Users can insert history for tasks they can update
CREATE POLICY "Users can add history to their tasks" 
ON public.task_history 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_history.task_id
    AND (
      t.assigned_to = auth.uid() 
      OR t.created_by = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role) 
      OR has_role(auth.uid(), 'master'::app_role)
    )
  )
);

-- Enable realtime for task_history
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_history;

-- Add comment explaining the table
COMMENT ON TABLE public.task_history IS 'Audit trail for task changes including status updates, assignments, and comments';