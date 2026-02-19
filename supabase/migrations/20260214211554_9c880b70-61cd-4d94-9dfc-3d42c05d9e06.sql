
-- Drop the old restrictive INSERT policy
DROP POLICY IF EXISTS "Users can add history to their tasks" ON public.task_history;

-- Create a new policy that allows any project member to add history entries
CREATE POLICY "Project members can add task history"
ON public.task_history
FOR INSERT
WITH CHECK (
  (auth.uid() = user_id) AND
  EXISTS (
    SELECT 1
    FROM tasks t
    JOIN project_members pm ON pm.project_id = t.project_id
    WHERE t.id = task_history.task_id
      AND pm.user_id = auth.uid()
  )
);
