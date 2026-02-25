import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type WorkspaceRole = Database["public"]["Enums"]["workspace_role"];

interface UseUserRoleReturn {
  role: AppRole | null;
  workspaceRole: WorkspaceRole | null;
  loading: boolean;
  isAdmin: boolean;
  isMaster: boolean;
  isUser: boolean;
  isWorkspaceOwner: boolean;
  isWorkspaceAdmin: boolean;
  canManageInvitations: boolean;
  canManageTeam: boolean;
  canAccessSettings: boolean;
}

export function useUserRole(): UseUserRoleReturn {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [role, setRole] = useState<AppRole | null>(null);
  const [workspaceRole, setWorkspaceRole] = useState<WorkspaceRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      if (!user) {
        setRole(null);
        setWorkspaceRole(null);
        setLoading(false);
        return;
      }

      try {
        // Fetch global role
        const rolePromise = supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        // Fetch workspace role if workspace is active
        const wsPromise = currentWorkspace
          ? supabase
              .from("workspace_members")
              .select("role")
              .eq("user_id", user.id)
              .eq("workspace_id", currentWorkspace.id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null });

        const [roleResult, wsResult] = await Promise.all([rolePromise, wsPromise]);

        if (roleResult.error) throw roleResult.error;
        if (wsResult.error) throw wsResult.error;

        setRole(roleResult.data?.role || null);
        setWorkspaceRole(wsResult.data?.role || null);
      } catch (error) {
        console.error("Error fetching user roles:", error);
        setRole(null);
        setWorkspaceRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [user, currentWorkspace?.id]);

  const isMaster = role === "master";
  const isAdmin = role === "admin";
  const isUser = role === "user";
  const isWorkspaceOwner = workspaceRole === "owner";
  const isWorkspaceAdmin = workspaceRole === "admin";

  // Combine: global admin/master OR workspace owner/admin
  const hasManagementAccess = isMaster || isAdmin || isWorkspaceOwner || isWorkspaceAdmin;

  return {
    role,
    workspaceRole,
    loading,
    isAdmin,
    isMaster,
    isUser,
    isWorkspaceOwner,
    isWorkspaceAdmin,
    canManageInvitations: hasManagementAccess,
    canManageTeam: hasManagementAccess,
    canAccessSettings: hasManagementAccess,
  };
}
