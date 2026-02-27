import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { Database } from "@/integrations/supabase/types";

type ProjectRole = Database["public"]["Enums"]["project_role"];
type WorkspaceRole = Database["public"]["Enums"]["workspace_role"];

interface UseProjectRoleReturn {
  role: ProjectRole | null;
  loading: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isMember: boolean;
  isViewer: boolean;
  canManageProject: boolean;
  canManageMembers: boolean;
  canCreateTasks: boolean;
  canEditAnyTask: boolean;
  canDeleteAnyTask: boolean;
  canManageSprints: boolean;
}

export function useProjectRole(projectId: string | undefined): UseProjectRoleReturn {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [role, setRole] = useState<ProjectRole | null>(null);
  const [workspaceRole, setWorkspaceRole] = useState<WorkspaceRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    if (!user || !projectId) {
      setRole(null);
      setWorkspaceRole(null);
      setLoading(false);
      return;
    }

    try {
      // Fetch project role
      const { data: projectData, error: projectError } = await supabase
        .from("project_members")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (projectError) throw projectError;
      setRole(projectData?.role || null);

      // Fetch workspace role
      if (currentWorkspace?.id) {
        const { data: wsData, error: wsError } = await supabase
          .from("workspace_members")
          .select("role")
          .eq("workspace_id", currentWorkspace.id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (wsError) throw wsError;
        setWorkspaceRole(wsData?.role || null);
      }
    } catch (error) {
      console.error("Error fetching project role:", error);
      setRole(null);
      setWorkspaceRole(null);
    } finally {
      setLoading(false);
    }
  }, [user, projectId, currentWorkspace?.id]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const isOwner = role === "owner";
  const isAdmin = role === "admin";
  const isMember = role === "member";
  const isViewer = role === "viewer";
  const isWsOwnerOrAdmin = workspaceRole === "owner" || workspaceRole === "admin";

  return {
    role,
    loading,
    isOwner,
    isAdmin,
    isMember,
    isViewer,
    canManageProject: isOwner || isAdmin || isWsOwnerOrAdmin,
    canManageMembers: isOwner || isAdmin || isWsOwnerOrAdmin,
    canCreateTasks: isOwner || isAdmin || isMember || isWsOwnerOrAdmin,
    canEditAnyTask: isOwner || isAdmin || isWsOwnerOrAdmin,
    canDeleteAnyTask: isOwner || isAdmin || isWsOwnerOrAdmin,
    canManageSprints: isOwner || isAdmin || isWsOwnerOrAdmin,
  };
}
