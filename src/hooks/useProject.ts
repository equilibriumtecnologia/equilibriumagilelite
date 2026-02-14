import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  const queryClient = useQueryClient();

  const { data: project = null, isLoading: loading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
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
        .eq("id", projectId!)
        .single();

      if (error) throw error;
      return data as Project;
    },
    enabled: !!projectId,
  });

  return {
    project,
    loading,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["project", projectId] }),
  };
}
