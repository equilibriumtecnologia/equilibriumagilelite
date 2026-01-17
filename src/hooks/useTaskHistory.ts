import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import type { Tables } from "@/integrations/supabase/types";

type TaskHistory = Tables<"task_history"> & {
  user?: Tables<"profiles"> | null;
};

export type TaskActionType = 
  | "created"
  | "status_changed"
  | "assigned"
  | "unassigned"
  | "priority_changed"
  | "due_date_changed"
  | "title_changed"
  | "description_changed"
  | "comment_added"
  | "deleted";

export const useTaskHistory = (taskId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: history, isLoading } = useQuery({
    queryKey: ["task-history", taskId],
    queryFn: async () => {
      if (!taskId) return [];
      
      // First get history entries
      const { data: historyData, error: historyError } = await supabase
        .from("task_history")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false });

      if (historyError) throw historyError;

      // Then get user profiles for each unique user_id
      const userIds = [...new Set(historyData.map(h => h.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Map profiles to history entries
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
      return historyData.map(h => ({
        ...h,
        user: profilesMap.get(h.user_id) || null,
      })) as TaskHistory[];
    },
    enabled: !!taskId,
  });

  // Subscribe to realtime changes
  useEffect(() => {
    if (!taskId) return;

    const channel = supabase
      .channel(`task-history-${taskId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "task_history",
          filter: `task_id=eq.${taskId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["task-history", taskId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, taskId]);

  const addHistoryEntry = useMutation({
    mutationFn: async ({
      taskId,
      action,
      oldValue,
      newValue,
      comment,
    }: {
      taskId: string;
      action: TaskActionType;
      oldValue?: string | null;
      newValue?: string | null;
      comment?: string | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("task_history")
        .insert({
          task_id: taskId,
          user_id: user.id,
          action: action,
          old_value: oldValue,
          new_value: newValue,
          comment: comment,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-history"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addComment = useMutation({
    mutationFn: async ({
      taskId,
      comment,
    }: {
      taskId: string;
      comment: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("task_history")
        .insert({
          task_id: taskId,
          user_id: user.id,
          action: "comment_added",
          comment: comment,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-history"] });
      toast({
        title: "Sucesso!",
        description: "Comentário adicionado.",
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

  // Calculate time spent in each status
  const getStatusDurations = () => {
    if (!history) return {};
    
    const statusChanges = history
      .filter(h => h.action === "status_changed" || h.action === "created")
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const durations: Record<string, number> = {};
    
    for (let i = 0; i < statusChanges.length; i++) {
      const current = statusChanges[i];
      const next = statusChanges[i + 1];
      const status = current.action === "created" ? "todo" : current.new_value;
      
      if (status) {
        const startTime = new Date(current.created_at).getTime();
        const endTime = next ? new Date(next.created_at).getTime() : Date.now();
        const duration = endTime - startTime;
        
        durations[status] = (durations[status] || 0) + duration;
      }
    }
    
    return durations;
  };

  return {
    history,
    isLoading,
    addHistoryEntry,
    addComment,
    getStatusDurations,
  };
};
