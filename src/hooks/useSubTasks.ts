import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface SubTask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  created_by: string;
  position: number;
}

export function useSubTasks(taskId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const subTasksQuery = useQuery({
    queryKey: ["sub_tasks", taskId],
    queryFn: async () => {
      if (!taskId) return [];
      
      const { data, error } = await supabase
        .from("sub_tasks")
        .select("*")
        .eq("task_id", taskId)
        .order("position", { ascending: true });

      if (error) throw error;
      return data as SubTask[];
    },
    enabled: !!taskId && !!user,
  });

  const createSubTask = useMutation({
    mutationFn: async ({ title }: { title: string }) => {
      if (!taskId || !user) throw new Error("Dados inválidos");

      // Get max position
      const currentSubTasks = subTasksQuery.data || [];
      const maxPosition = currentSubTasks.reduce((max, st) => Math.max(max, st.position), -1);

      const { data, error } = await supabase
        .from("sub_tasks")
        .insert({
          task_id: taskId,
          title,
          created_by: user.id,
          position: maxPosition + 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub_tasks", taskId] });
      toast.success("Sub-tarefa criada com sucesso");
    },
    onError: (error) => {
      console.error("Erro ao criar sub-tarefa:", error);
      toast.error("Erro ao criar sub-tarefa");
    },
  });

  const toggleSubTask = useMutation({
    mutationFn: async ({ subTaskId, isCompleted }: { subTaskId: string; isCompleted: boolean }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const updateData: Partial<SubTask> = {
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
        completed_by: isCompleted ? user.id : null,
      };

      const { data, error } = await supabase
        .from("sub_tasks")
        .update(updateData)
        .eq("id", subTaskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sub_tasks", taskId] });
      if (data.is_completed) {
        toast.success("Sub-tarefa concluída!", {
          description: "A sub-tarefa foi marcada como concluída.",
        });
      }
    },
    onError: (error) => {
      console.error("Erro ao atualizar sub-tarefa:", error);
      toast.error("Erro ao atualizar sub-tarefa");
    },
  });

  const deleteSubTask = useMutation({
    mutationFn: async (subTaskId: string) => {
      const { error } = await supabase
        .from("sub_tasks")
        .delete()
        .eq("id", subTaskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub_tasks", taskId] });
      toast.success("Sub-tarefa removida");
    },
    onError: (error) => {
      console.error("Erro ao remover sub-tarefa:", error);
      toast.error("Erro ao remover sub-tarefa");
    },
  });

  const updateSubTaskTitle = useMutation({
    mutationFn: async ({ subTaskId, title }: { subTaskId: string; title: string }) => {
      const { data, error } = await supabase
        .from("sub_tasks")
        .update({ title })
        .eq("id", subTaskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub_tasks", taskId] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar título:", error);
      toast.error("Erro ao atualizar título");
    },
  });

  // Calculate completion progress
  const completedCount = subTasksQuery.data?.filter((st) => st.is_completed).length || 0;
  const totalCount = subTasksQuery.data?.length || 0;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    subTasks: subTasksQuery.data || [],
    isLoading: subTasksQuery.isLoading,
    createSubTask,
    toggleSubTask,
    deleteSubTask,
    updateSubTaskTitle,
    completedCount,
    totalCount,
    progress,
  };
}
