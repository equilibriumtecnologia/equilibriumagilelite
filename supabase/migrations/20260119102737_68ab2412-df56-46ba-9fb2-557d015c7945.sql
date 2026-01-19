-- Create sub_tasks table
CREATE TABLE public.sub_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  position INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.sub_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Same access as parent task
CREATE POLICY "Users can view sub_tasks of their project tasks"
ON public.sub_tasks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN project_members pm ON pm.project_id = t.project_id
    WHERE t.id = sub_tasks.task_id AND pm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create sub_tasks on their project tasks"
ON public.sub_tasks
FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN project_members pm ON pm.project_id = t.project_id
    WHERE t.id = sub_tasks.task_id AND pm.user_id = auth.uid()
  )
);

CREATE POLICY "Task assignee, creator, admin or master can update sub_tasks"
ON public.sub_tasks
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = sub_tasks.task_id
    AND (t.assigned_to = auth.uid() OR t.created_by = auth.uid() 
         OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master'))
  )
);

CREATE POLICY "Task assignee, creator, admin or master can delete sub_tasks"
ON public.sub_tasks
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = sub_tasks.task_id
    AND (t.assigned_to = auth.uid() OR t.created_by = auth.uid() 
         OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master'))
  )
);