import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { useWorkspace } from "@/contexts/WorkspaceContext";

type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  category: Database["public"]["Tables"]["categories"]["Row"] | null;
  project_members: Array<{
    user_id: string;
    role: string;
    profiles: Database["public"]["Tables"]["profiles"]["Row"];
  }>;
  tasks: Database["public"]["Tables"]["tasks"]["Row"][];
  criticality_level?: number | null;
};

export function useProjects() {
  const { currentWorkspace } = useWorkspace();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    if (!currentWorkspace) { setProjects([]); setLoading(false); return; }
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
          tasks(*)
        `)
        .eq("workspace_id", currentWorkspace.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar projetos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();

    const channel = supabase
      .channel("projects-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => fetchProjects()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentWorkspace?.id]);

  return { projects, loading, refetch: fetchProjects };
}
