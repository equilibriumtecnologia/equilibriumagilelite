import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type ProjectRole = Database["public"]["Enums"]["project_role"];

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
  const [role, setRole] = useState<ProjectRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user || !projectId) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("project_members")
          .select("role")
          .eq("project_id", projectId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;
        setRole(data?.role || null);
      } catch (error) {
        console.error("Error fetching project role:", error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user, projectId]);

  const isOwner = role === "owner";
  const isAdmin = role === "admin";
  const isMember = role === "member";
  const isViewer = role === "viewer";

  return {
    role,
    loading,
    isOwner,
    isAdmin,
    isMember,
    isViewer,
    canManageProject: isOwner || isAdmin,
    canManageMembers: isOwner || isAdmin,
    canCreateTasks: isOwner || isAdmin || isMember,
    canEditAnyTask: isOwner || isAdmin,
    canDeleteAnyTask: isOwner || isAdmin,
    canManageSprints: isOwner || isAdmin,
  };
}
