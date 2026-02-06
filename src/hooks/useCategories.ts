import { useState, useEffect } from "react";
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    if (!currentWorkspace) { setCategories([]); setLoading(false); return; }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("workspace_id", currentWorkspace.id)
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar categorias:", error);
      toast.error("Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (category: Omit<Category, "id" | "created_at" | "updated_at" | "workspace_id">) => {
    if (!currentWorkspace) return;
    try {
      const { error } = await supabase
        .from("categories")
        .insert({ ...category, workspace_id: currentWorkspace.id });

      if (error) throw error;
      toast.success("Categoria criada com sucesso!");
      fetchCategories();
    } catch (error: any) {
      console.error("Erro ao criar categoria:", error);
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
      fetchCategories();
    } catch (error: any) {
      console.error("Erro ao atualizar categoria:", error);
      toast.error("Erro ao atualizar categoria: " + error.message);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Categoria removida com sucesso!");
      fetchCategories();
    } catch (error: any) {
      console.error("Erro ao deletar categoria:", error);
      toast.error("Erro ao deletar categoria: " + error.message);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [currentWorkspace?.id]);

  return {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}
