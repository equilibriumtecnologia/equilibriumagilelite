import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  is_default: boolean;
  workspace_id: string;
  created_at: string;
  updated_at: string;
}

export function useCategories() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading: loading } = useQuery({
    queryKey: ["categories", currentWorkspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .order("name");

      if (error) throw error;
      return (data || []) as Category[];
    },
    enabled: !!currentWorkspace?.id,
  });

  const createCategory = async (
    category: Omit<
      Category,
      "id" | "created_at" | "updated_at" | "workspace_id"
    >,
  ) => {
    if (!currentWorkspace) return;
    try {
      const { error } = await supabase
        .from("categories")
        .insert({ ...category, workspace_id: currentWorkspace.id });
      if (error) throw error;
      toast.success("Categoria criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (error: any) {
      toast.error("Erro ao criar categoria: " + error.message);
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      const { error } = await supabase
        .from("categories")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
      toast.success("Categoria atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (error: any) {
      toast.error("Erro ao atualizar categoria: " + error.message);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      toast.success("Categoria removida com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (error: any) {
      toast.error("Erro ao deletar categoria: " + error.message);
    }
  };

  return {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: () =>
      queryClient.invalidateQueries({
        queryKey: ["categories", currentWorkspace?.id],
      }),
  };
}
