import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { useWorkspace } from "@/contexts/WorkspaceContext";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type WorkspaceMember = Database["public"]["Tables"]["workspace_members"]["Row"];

export type TeamMember = Profile & {
  roles: { role: string; user_id: string }[];
  workspace_role: string;
  project_count: number;
  task_count: number;
  completed_task_count: number;
};

export function useTeam() {
  const { currentWorkspace } = useWorkspace();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeam = async () => {
    if (!currentWorkspace) { setMembers([]); setLoading(false); return; }
    try {
      // Buscar membros do workspace
      const { data: wsMembers, error: wsMembersError } = await supabase
        .from("workspace_members")
        .select("user_id")
        .eq("workspace_id", currentWorkspace.id);

      if (wsMembersError) throw wsMembersError;
      const memberIds = wsMembers.map((m) => m.user_id);
      if (memberIds.length === 0) { setMembers([]); setLoading(false); return; }

      // Buscar perfis dos membros do workspace
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", memberIds)
        .order("full_name");

      if (profilesError) throw profilesError;

      // Buscar roles do workspace (não globais)
      const { data: wsRoles, error: wsRolesError } = await supabase
        .from("workspace_members")
        .select("user_id, role")
        .eq("workspace_id", currentWorkspace.id);

      if (wsRolesError) throw wsRolesError;

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
        const wsRole = wsRoles.find((r) => r.user_id === profile.id);
        const projectCount = projectCounts.filter((pc) => pc.user_id === profile.id).length;
        const userTasks = tasks.filter((t) => t.assigned_to === profile.id);
        const taskCount = userTasks.length;
        const completedTaskCount = userTasks.filter((t) => t.status === "completed").length;

        return {
          ...profile,
          roles: wsRole ? [{ role: wsRole.role, user_id: wsRole.user_id }] : [],
          workspace_role: wsRole?.role || "member",
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
      .channel("ws-members-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workspace_members" },
        () => fetchTeam()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(rolesChannel);
    };
  }, [currentWorkspace?.id]);

  return { members, loading, refetch: fetchTeam };
}
