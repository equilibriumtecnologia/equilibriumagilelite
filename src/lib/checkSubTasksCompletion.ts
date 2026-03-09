import { supabase } from "@/integrations/supabase/client";

/**
 * Checks if a task has incomplete sub-tasks.
 * Returns { hasIncomplete: true, pending, total } if there are pending items.
 */
export async function checkSubTasksCompletion(taskId: string): Promise<{
  hasIncomplete: boolean;
  pending: number;
  total: number;
}> {
  const { data, error } = await supabase
    .from("sub_tasks")
    .select("id, is_completed")
    .eq("task_id", taskId);

  if (error || !data || data.length === 0) {
    return { hasIncomplete: false, pending: 0, total: 0 };
  }

  const pending = data.filter((st) => !st.is_completed).length;
  return { hasIncomplete: pending > 0, pending, total: data.length };
}
