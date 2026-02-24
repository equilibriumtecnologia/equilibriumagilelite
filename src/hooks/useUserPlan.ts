import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserPlan {
  plan_name: string;
  plan_slug: string;
  max_workspaces: number;
  max_created_workspaces: number;
  max_guest_workspaces: number;
  max_projects_per_workspace: number;
  max_invites_per_workspace: number;
  max_users_per_workspace: number;
  features: Record<string, any>;
  status: string;
  current_period_end: string | null;
  is_master: boolean;
}

export function useUserPlan() {
  const { user } = useAuth();

  const { data: plan, isLoading: loading } = useQuery({
    queryKey: ["user-plan", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_plan", {
        _user_id: user!.id,
      });
      if (error) throw error;
      return data as unknown as UserPlan;
    },
    enabled: !!user?.id,
  });

  const checkProjectLimit = async (workspaceId: string): Promise<boolean> => {
    if (!user) return false;
    const { data, error } = await supabase.rpc("check_project_limit", {
      _user_id: user.id,
      _workspace_id: workspaceId,
    });
    if (error) return false;
    return data as boolean;
  };

  const checkInviteLimit = async (workspaceId: string): Promise<boolean> => {
    if (!user) return false;
    const { data, error } = await supabase.rpc("check_invite_limit", {
      _user_id: user.id,
      _workspace_id: workspaceId,
    });
    if (error) return false;
    return data as boolean;
  };

  const checkCanCreateWorkspace = async (): Promise<boolean> => {
    if (!user) return false;
    const { data, error } = await supabase.rpc("check_can_create_workspace", {
      _user_id: user.id,
    });
    if (error) return false;
    return data as boolean;
  };

  return {
    plan: plan ?? null,
    loading,
    isMaster: plan?.is_master ?? false,
    isFree: plan?.plan_slug === "free",
    checkProjectLimit,
    checkInviteLimit,
    checkCanCreateWorkspace,
  };
}
