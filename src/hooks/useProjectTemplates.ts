import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TemplateConfig {
  columns: string[];
  column_labels: Record<string, string>;
  column_colors: Record<string, string>;
  wip_limits: Record<string, number>;
  default_categories: string[];
  sample_tasks: Array<{
    title: string;
    priority: string;
    status: string;
  }>;
}

export interface ProjectTemplate {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  category: string | null;
  is_public: boolean;
  created_by: string | null;
  config: TemplateConfig;
  created_at: string;
  updated_at: string;
}

export function useProjectTemplates() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["project-templates", currentWorkspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_templates")
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .order("category", { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as ProjectTemplate[];
    },
    enabled: !!currentWorkspace?.id,
  });

  const createTemplate = useMutation({
    mutationFn: async (values: {
      name: string;
      description?: string;
      category?: string;
      config: TemplateConfig;
    }) => {
      if (!currentWorkspace || !user) throw new Error("Workspace ou usuário não encontrado");

      const { error } = await supabase.from("project_templates").insert({
        workspace_id: currentWorkspace.id,
        name: values.name,
        description: values.description || null,
        category: values.category || "custom",
        created_by: user.id,
        config: values.config as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-templates"] });
      toast.success("Template criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar template: " + error.message);
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-templates"] });
      toast.success("Template excluído com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir template: " + error.message);
    },
  });

  return { templates, isLoading, createTemplate, deleteTemplate };
}
