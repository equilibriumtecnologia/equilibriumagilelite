import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DowngradeQueueItem {
  id: string;
  user_id: string;
  item_type: "owned_workspace" | "guest_workspace" | "exceeding_project";
  workspace_id: string | null;
  project_id: string | null;
  grace_period_ends_at: string;
  suspended_at: string | null;
  delete_after: string | null;
  export_url: string | null;
  status: "grace_period" | "suspended" | "exported" | "deleted" | "restored";
  previous_plan_slug: string | null;
  new_plan_slug: string | null;
  created_at: string;
}

export function useDowngradeQueue() {
  const { user } = useAuth();

  const { data: queueItems, isLoading } = useQuery({
    queryKey: ["downgrade-queue", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("downgrade_queue")
        .select("*")
        .eq("user_id", user!.id)
        .in("status", ["grace_period", "suspended", "exported"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as DowngradeQueueItem[];
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Check every minute
  });

  const activeItems = queueItems || [];
  const hasGracePeriodItems = activeItems.some(i => i.status === "grace_period");
  const hasSuspendedItems = activeItems.some(i => i.status === "suspended" || i.status === "exported");

  const isWorkspaceSuspended = (workspaceId: string) =>
    activeItems.some(i => 
      i.workspace_id === workspaceId && 
      i.item_type === "owned_workspace" &&
      (i.status === "suspended" || i.status === "exported")
    );

  const isWorkspaceInGracePeriod = (workspaceId: string) =>
    activeItems.some(i =>
      i.workspace_id === workspaceId &&
      i.status === "grace_period"
    );

  const isProjectReadOnly = (projectId: string) =>
    activeItems.some(i =>
      i.project_id === projectId &&
      i.item_type === "exceeding_project" &&
      (i.status === "grace_period" || i.status === "suspended" || i.status === "exported")
    );

  const getGracePeriodEnd = () => {
    const graceItem = activeItems.find(i => i.status === "grace_period");
    return graceItem?.grace_period_ends_at || null;
  };

  const exportWorkspace = async (workspaceId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Not authenticated");

    const response = await supabase.functions.invoke("export-workspace-data", {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { workspace_id: workspaceId },
    });

    if (response.error) throw new Error(response.error.message);
    return response.data as { success: boolean; download_url?: string };
  };

  return {
    queueItems: activeItems,
    isLoading,
    hasGracePeriodItems,
    hasSuspendedItems,
    isWorkspaceSuspended,
    isWorkspaceInGracePeriod,
    isProjectReadOnly,
    getGracePeriodEnd,
    exportWorkspace,
  };
}
