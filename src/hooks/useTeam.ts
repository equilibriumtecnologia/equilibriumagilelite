import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];

export type TeamMember = Profile & {
  roles: UserRole[];
  project_count: number;
  task_count: number;
  completed_task_count: number;
};

export function useTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeam = async () => {
    try {
      // Buscar todos os perfis
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name");

      if (profilesError) throw profilesError;

      // Buscar roles de cada usuário
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Buscar contagem de projetos por usuário
      const { data: projectCounts, error: projectCountsError } = await supabase
        .from("project_members")
        .select("user_id");

      if (projectCountsError) throw projectCountsError;

      // Buscar contagem de tarefas por usuário
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("assigned_to, status");

      if (tasksError) throw tasksError;

      // Montar dados dos membros
      const teamMembers: TeamMember[] = profiles.map((profile) => {
        const userRoles = roles.filter((r) => r.user_id === profile.id);
        const projectCount = projectCounts.filter((pc) => pc.user_id === profile.id).length;
        const userTasks = tasks.filter((t) => t.assigned_to === profile.id);
        const taskCount = userTasks.length;
        const completedTaskCount = userTasks.filter((t) => t.status === "completed").length;

        return {
          ...profile,
          roles: userRoles,
          project_count: projectCount,
          task_count: taskCount,
          completed_task_count: completedTaskCount,
        };
      });

      setMembers(teamMembers);
    } catch (error: any) {
      toast.error("Erro ao carregar equipe: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();

    // Realtime updates
    const profilesChannel = supabase
      .channel("profiles-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => fetchTeam()
      )
      .subscribe();

    const rolesChannel = supabase
      .channel("roles-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_roles" },
        () => fetchTeam()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(rolesChannel);
    };
  }, []);

  return { members, loading, refetch: fetchTeam };
}
