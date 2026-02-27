import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { Tables, TablesInsert, TablesUpdate, Enums } from "@/integrations/supabase/types";

type Task = Tables<"tasks"> & {
  assigned_user?: Tables<"profiles"> | null;
  project?: Tables<"projects"> | null;
};

type TaskActionType = Enums<"task_action_type">;

export const useTasks = (projectId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspace();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks", projectId, currentWorkspace?.id],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select(`
          *,
          assigned_user:profiles!tasks_assigned_to_fkey(id, full_name, avatar_url),
          project:projects!tasks_project_id_fkey(id, name, workspace_id)
        `)
        .order("created_at", { ascending: false });

      if (projectId) {
        query = query.eq("project_id", projectId);
      } else if (currentWorkspace?.id) {
        // Filter tasks to current workspace via projects
        // First get project IDs for this workspace
        const { data: wsProjects } = await supabase
          .from("projects")
          .select("id")
          .eq("workspace_id", currentWorkspace.id);
        
        if (!wsProjects || wsProjects.length === 0) return [];
        query = query.in("project_id", wsProjects.map(p => p.id));
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!currentWorkspace?.id || !!projectId,
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
          queryClient.invalidateQueries({ queryKey: ["tasks", projectId, currentWorkspace?.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, projectId, currentWorkspace?.id]);

  const createTask = useMutation({
    mutationFn: async (task: TablesInsert<"tasks">) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert(task)
        .select(`
          *,
          assigned_user:profiles!tasks_assigned_to_fkey(id, full_name, avatar_url),
          project:projects!tasks_project_id_fkey(id, name)
        `)
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

        // Send notification if task is assigned to someone else
        if (task.assigned_to && task.assigned_to !== user.id) {
          const { data: assigneeProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", task.assigned_to)
            .single();

          if (assigneeProfile) {
            const { data: changerProfile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", user.id)
              .single();

            try {
              await supabase.functions.invoke("send-task-notification", {
                body: {
                  taskId: data.id,
                  taskTitle: data.title,
                  projectName: (data as any).project?.name || "",
                  notificationType: "assigned",
                  recipientUserId: task.assigned_to,
                  recipientName: assigneeProfile.full_name,
                  changedByName: changerProfile?.full_name || "Um usuário",
                },
              });
            } catch (e) {
              console.error("Failed to send notification:", e);
            }
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
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
        .select(`
          *,
          project:projects!tasks_project_id_fkey(id, name)
        `)
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

        // Get changer profile
        const { data: changerProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        // Check what changed - Status
        if (updates.status && updates.status !== currentTask.status) {
          historyEntries.push({
            task_id: id,
            user_id: user.id,
            action: "status_changed",
            old_value: currentTask.status,
            new_value: updates.status,
            comment: historyComment,
          });

          // Send notification to assigned user if they're not the one changing it
          if (currentTask.assigned_to && currentTask.assigned_to !== user.id) {
            const { data: assigneeProfile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", currentTask.assigned_to)
              .single();

            if (assigneeProfile) {
              try {
                await supabase.functions.invoke("send-task-notification", {
                  body: {
                    taskId: id,
                    taskTitle: currentTask.title,
                    projectName: (currentTask as any).project?.name || "",
                    notificationType: "status_changed",
                    recipientUserId: currentTask.assigned_to,
                    recipientName: assigneeProfile.full_name,
                    changedByName: changerProfile?.full_name || "Um usuário",
                    oldStatus: currentTask.status,
                    newStatus: updates.status,
                  },
                });
              } catch (e) {
                console.error("Failed to send status notification:", e);
              }
            }
          }
        }

        // Check what changed - Priority
        if (updates.priority && updates.priority !== currentTask.priority) {
          historyEntries.push({
            task_id: id,
            user_id: user.id,
            action: "priority_changed",
            old_value: currentTask.priority,
            new_value: updates.priority,
          });
        }

        // Check what changed - Assignment
        if (updates.assigned_to !== undefined && updates.assigned_to !== currentTask.assigned_to) {
          historyEntries.push({
            task_id: id,
            user_id: user.id,
            action: updates.assigned_to ? "assigned" : "unassigned",
            old_value: currentTask.assigned_to,
            new_value: updates.assigned_to,
          });

          // Send notification to newly assigned user (if they're not the one assigning)
          if (updates.assigned_to && updates.assigned_to !== user.id) {
            const { data: assigneeProfile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", updates.assigned_to)
              .single();

            if (assigneeProfile) {
              try {
                await supabase.functions.invoke("send-task-notification", {
                  body: {
                    taskId: id,
                    taskTitle: currentTask.title,
                    projectName: (currentTask as any).project?.name || "",
                    notificationType: "assigned",
                    recipientUserId: updates.assigned_to,
                    recipientName: assigneeProfile.full_name,
                    changedByName: changerProfile?.full_name || "Um usuário",
                  },
                });
              } catch (e) {
                console.error("Failed to send assignment notification:", e);
              }
            }
          }
        }

        // Check what changed - Due Date
        if (updates.due_date !== undefined && updates.due_date !== currentTask.due_date) {
          historyEntries.push({
            task_id: id,
            user_id: user.id,
            action: "due_date_changed",
            old_value: currentTask.due_date,
            new_value: updates.due_date,
          });
        }

        // Check what changed - Title
        if (updates.title && updates.title !== currentTask.title) {
          historyEntries.push({
            task_id: id,
            user_id: user.id,
            action: "title_changed",
            old_value: currentTask.title,
            new_value: updates.title,
          });
        }

        // Check what changed - Description
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
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
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
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
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

