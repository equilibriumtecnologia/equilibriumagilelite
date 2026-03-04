import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { Tables } from "@/integrations/supabase/types";

export type ActivityEntry = Tables<"task_history"> & {
  user?: { id: string; full_name: string; avatar_url: string | null } | null;
  task?: { id: string; title: string; project_id: string } | null;
};

export function useActivityFeed(projectId?: string) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activity-feed", projectId, currentWorkspace?.id],
    queryFn: async () => {
      // Get workspace project IDs
      let projectIds: string[] = [];
      if (projectId) {
        projectIds = [projectId];
      } else if (currentWorkspace?.id) {
        const { data } = await supabase
          .from("projects")
          .select("id")
          .eq("workspace_id", currentWorkspace.id);
        projectIds = (data || []).map((p) => p.id);
      }
      if (projectIds.length === 0) return [];

      // Get task IDs for these projects
      const { data: taskRows } = await supabase
        .from("tasks")
        .select("id, title, project_id")
        .in("project_id", projectIds);
      if (!taskRows || taskRows.length === 0) return [];

      const taskMap = new Map(taskRows.map((t) => [t.id, t]));
      const taskIds = taskRows.map((t) => t.id);

      // Get recent history entries
      const { data: historyData, error } = await supabase
        .from("task_history")
        .select("*")
        .in("task_id", taskIds)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      if (!historyData || historyData.length === 0) return [];

      // Get profiles
      const userIds = [...new Set(historyData.map((h) => h.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, p])
      );

      return historyData.map((h) => ({
        ...h,
        user: profileMap.get(h.user_id) || null,
        task: taskMap.get(h.task_id) || null,
      })) as ActivityEntry[];
    },
    enabled: !!user && (!!projectId || !!currentWorkspace?.id),
  });

  return { activities, isLoading };
}
