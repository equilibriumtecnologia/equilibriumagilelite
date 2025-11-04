import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("categories")
        .select("*")
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

  const createCategory = async (category: Omit<Category, "id" | "created_at" | "updated_at">) => {
    try {
      const { error } = await supabase
        .from("categories")
        .insert(category);

      if (error) throw error;
      toast.success("Categoria criada com sucesso!");
      await fetchCategories();
    } catch (error: any) {
      console.error("Erro ao criar categoria:", error);
      toast.error("Erro ao criar categoria: " + error.message);
      throw error;
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
      await fetchCategories();
    } catch (error: any) {
      console.error("Erro ao atualizar categoria:", error);
      toast.error("Erro ao atualizar categoria: " + error.message);
      throw error;
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
      await fetchCategories();
    } catch (error: any) {
      console.error("Erro ao remover categoria:", error);
      toast.error("Erro ao remover categoria: " + error.message);
      throw error;
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}
