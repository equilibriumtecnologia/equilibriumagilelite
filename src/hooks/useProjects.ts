import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading: loading } = useQuery({
    queryKey: ["projects", currentWorkspace?.id],
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
          tasks(*)
        `)
        .eq("workspace_id", currentWorkspace!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Project[];
    },
    enabled: !!currentWorkspace?.id,
  });

  const createProject = useMutation({
    mutationFn: async (values: {
      name: string;
      description?: string;
      category_id: string;
      status: string;
      deadline?: string | null;
      criticality_level?: number;
      created_by: string;
      workspace_id: string;
    }) => {
      const { error } = await supabase.from("projects").insert({
        name: values.name,
        description: values.description || null,
        category_id: values.category_id,
        status: values.status as any,
        deadline: values.deadline || null,
        criticality_level: values.criticality_level,
        created_by: values.created_by,
        workspace_id: values.workspace_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Projeto criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar projeto: " + error.message);
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
      toast.success("Projeto atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar projeto: " + error.message);
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
      toast.success("Projeto excluído com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir projeto: " + error.message);
    },
  });

  return { projects, loading, createProject, updateProject, deleteProject, refetch: () => queryClient.invalidateQueries({ queryKey: ["projects", currentWorkspace?.id] }) };
}
