import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import type { Tables, TablesInsert, TablesUpdate, Enums } from "@/integrations/supabase/types";

type Task = Tables<"tasks"> & {
  assigned_user?: Tables<"profiles"> | null;
  project?: Tables<"projects"> | null;
};

type TaskActionType = Enums<"task_action_type">;

export const useTasks = (projectId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select(`
          *,
          assigned_user:profiles!tasks_assigned_to_fkey(id, full_name, avatar_url),
          project:projects!tasks_project_id_fkey(id, name)
        `)
        .order("created_at", { ascending: false });

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Task[];
    },
  });

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: projectId ? `project_id=eq.${projectId}` : undefined,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, projectId]);

  const createTask = useMutation({
    mutationFn: async (task: TablesInsert<"tasks">) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert(task)
        .select()
        .single();

      if (error) throw error;

      // Add created history entry
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("task_history").insert({
          task_id: data.id,
          user_id: user.id,
          action: "created",
          new_value: task.title,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({
        title: "Sucesso!",
        description: "Atividade criada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"tasks"> & { id: string; historyComment?: string }) => {
      // Get current task state for history comparison
      const { data: currentTask, error: fetchError } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      // Extract historyComment from updates to not send it to the database
      const { historyComment, ...dbUpdates } = updates as any;

      const { data, error } = await supabase
        .from("tasks")
        .update(dbUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Track changes in history
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const historyEntries: Array<{
          task_id: string;
          user_id: string;
          action: TaskActionType;
          old_value?: string | null;
          new_value?: string | null;
          comment?: string | null;
        }> = [];

        // Check what changed
        if (updates.status && updates.status !== currentTask.status) {
          historyEntries.push({
            task_id: id,
            user_id: user.id,
            action: "status_changed",
            old_value: currentTask.status,
            new_value: updates.status,
            comment: historyComment,
          });
        }

        if (updates.priority && updates.priority !== currentTask.priority) {
          historyEntries.push({
            task_id: id,
            user_id: user.id,
            action: "priority_changed",
            old_value: currentTask.priority,
            new_value: updates.priority,
          });
        }

        if (updates.assigned_to !== undefined && updates.assigned_to !== currentTask.assigned_to) {
          historyEntries.push({
            task_id: id,
            user_id: user.id,
            action: updates.assigned_to ? "assigned" : "unassigned",
            old_value: currentTask.assigned_to,
            new_value: updates.assigned_to,
          });
        }

        if (updates.due_date !== undefined && updates.due_date !== currentTask.due_date) {
          historyEntries.push({
            task_id: id,
            user_id: user.id,
            action: "due_date_changed",
            old_value: currentTask.due_date,
            new_value: updates.due_date,
          });
        }

        if (updates.title && updates.title !== currentTask.title) {
          historyEntries.push({
            task_id: id,
            user_id: user.id,
            action: "title_changed",
            old_value: currentTask.title,
            new_value: updates.title,
          });
        }

        if (updates.description !== undefined && updates.description !== currentTask.description) {
          historyEntries.push({
            task_id: id,
            user_id: user.id,
            action: "description_changed",
            old_value: currentTask.description || "",
            new_value: updates.description || "",
          });
        }

        // Insert history entries
        if (historyEntries.length > 0) {
          await supabase.from("task_history").insert(historyEntries);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({
        title: "Sucesso!",
        description: "Atividade atualizada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({
        title: "Sucesso!",
        description: "Atividade excluída com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
  };
};
