import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/integrations/supabase/types";

type Sprint = Database["public"]["Tables"]["sprints"]["Row"];
type SprintInsert = Database["public"]["Tables"]["sprints"]["Insert"];
type SprintUpdate = Database["public"]["Tables"]["sprints"]["Update"];
type SprintStatus = Database["public"]["Enums"]["sprint_status"];

export function useSprints(projectId?: string) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: sprints = [], isLoading } = useQuery({
    queryKey: ["sprints", projectId],
    queryFn: async () => {
      const query = supabase
        .from("sprints")
        .select("*")
        .order("start_date", { ascending: false });

      if (projectId) {
        query.eq("project_id", projectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Sprint[];
    },
    enabled: !!user,
  });

  const activeSprint = sprints.find((s) => s.status === "active");
  const planningSprints = sprints.filter((s) => s.status === "planning");
  const completedSprints = sprints.filter((s) => s.status === "completed");

  const createSprint = useMutation({
    mutationFn: async (sprint: Omit<SprintInsert, "created_by">) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("sprints")
        .insert({
          ...sprint,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
      toast({
        title: "Sprint criada",
        description: "A sprint foi criada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar sprint",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSprint = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: SprintUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("sprints")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
      toast({
        title: "Sprint atualizada",
        description: "A sprint foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar sprint",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSprint = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sprints").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({
        title: "Sprint excluída",
        description: "A sprint foi excluída com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir sprint",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const startSprint = useMutation({
    mutationFn: async (id: string) => {
      // First, complete any active sprint
      const { data: activeSprints } = await supabase
        .from("sprints")
        .select("id")
        .eq("status", "active")
        .eq("project_id", projectId || "");

      if (activeSprints && activeSprints.length > 0) {
        await supabase
          .from("sprints")
          .update({ status: "completed" as SprintStatus })
          .eq("id", activeSprints[0].id);
      }

      const { data, error } = await supabase
        .from("sprints")
        .update({ status: "active" as SprintStatus })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
      toast({
        title: "Sprint iniciada",
        description: "A sprint está agora ativa.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao iniciar sprint",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const completeSprint = useMutation({
    mutationFn: async (id: string) => {
      // Calculate velocity based on completed story points
      const { data: tasks } = await supabase
        .from("tasks")
        .select("story_points")
        .eq("sprint_id", id)
        .eq("status", "completed");

      const velocity = tasks?.reduce(
        (sum, task) => sum + (task.story_points || 0),
        0
      ) || 0;

      const { data, error } = await supabase
        .from("sprints")
        .update({ 
          status: "completed" as SprintStatus,
          velocity 
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
      toast({
        title: "Sprint finalizada",
        description: "A sprint foi concluída com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao finalizar sprint",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    sprints,
    activeSprint,
    planningSprints,
    completedSprints,
    isLoading,
    createSprint,
    updateSprint,
    deleteSprint,
    startSprint,
    completeSprint,
  };
}
