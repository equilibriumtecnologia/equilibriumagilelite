import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  category: Database["public"]["Tables"]["categories"]["Row"] | null;
  project_members: Array<{
    user_id: string;
    role: string;
    profiles: Database["public"]["Tables"]["profiles"]["Row"];
  }>;
  tasks: Array<
    Database["public"]["Tables"]["tasks"]["Row"] & {
      assigned_to_profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
      created_by_profile: Database["public"]["Tables"]["profiles"]["Row"];
    }
  >;
};

export function useProject(projectId: string | undefined) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProject = async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          category:categories(*),
          project_members(
            user_id,
            role,
            profiles(*)
          ),
          tasks(
            *,
            assigned_to_profile:profiles!tasks_assigned_to_fkey(*),
            created_by_profile:profiles!tasks_created_by_fkey(*)
          )
        `)
        .eq("id", projectId)
        .single();

      if (error) throw error;
      setProject(data as Project);
    } catch (error: any) {
      toast.error("Erro ao carregar projeto: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();

    if (!projectId) return;

    // Realtime subscription
    const channel = supabase
      .channel(`project-${projectId}-changes`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
          filter: `id=eq.${projectId}`,
        },
        () => {
          fetchProject();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchProject();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_members",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchProject();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return { project, loading, refetch: fetchProject };
}
