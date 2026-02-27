import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks"> & {
  assigned_user?: Tables<"profiles"> | null;
};

type Sprint = Tables<"sprints">;

type TaskHistory = Tables<"task_history">;

export interface BurndownDataPoint {
  date: string;
  ideal: number;
  actual: number;
}

export interface VelocityDataPoint {
  sprint: string;
  velocity: number;
  average: number;
}

export interface CumulativeFlowDataPoint {
  date: string;
  todo: number;
  in_progress: number;
  review: number;
  completed: number;
}

export interface CycleTimeDataPoint {
  task: string;
  leadTime: number;
  cycleTime: number;
  completedAt: string;
}

export interface TeamMemberPerformance {
  id: string;
  name: string;
  avatar_url: string | null;
  tasksCompleted: number;
  storyPointsDelivered: number;
  avgCycleTime: number;
  completionRate: number;
}

export function useReportData(projectId?: string) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();

  // Helper to get workspace project IDs for filtering
  const getWorkspaceProjectIds = async (): Promise<string[]> => {
    if (!currentWorkspace?.id) return [];
    const { data } = await supabase
      .from("projects")
      .select("id")
      .eq("workspace_id", currentWorkspace.id);
    return (data || []).map(p => p.id);
  };

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["report-tasks", projectId, currentWorkspace?.id],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select(`
          *,
          assigned_user:profiles!tasks_assigned_to_fkey(id, full_name, avatar_url)
        `)
        .order("created_at", { ascending: true });

      if (projectId) {
        query = query.eq("project_id", projectId);
      } else {
        const wsProjectIds = await getWorkspaceProjectIds();
        if (wsProjectIds.length === 0) return [];
        query = query.in("project_id", wsProjectIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!user && (!!projectId || !!currentWorkspace?.id),
  });

  const { data: sprints = [], isLoading: sprintsLoading } = useQuery({
    queryKey: ["report-sprints", projectId, currentWorkspace?.id],
    queryFn: async () => {
      let query = supabase
        .from("sprints")
        .select("*")
        .order("start_date", { ascending: true });

      if (projectId) {
        query = query.eq("project_id", projectId);
      } else {
        const wsProjectIds = await getWorkspaceProjectIds();
        if (wsProjectIds.length === 0) return [];
        query = query.in("project_id", wsProjectIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Sprint[];
    },
    enabled: !!user && (!!projectId || !!currentWorkspace?.id),
  });

  const { data: taskHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["report-task-history", projectId, currentWorkspace?.id],
    queryFn: async () => {
      let taskIdsQuery = supabase.from("tasks").select("id");
      if (projectId) {
        taskIdsQuery = taskIdsQuery.eq("project_id", projectId);
      } else {
        const wsProjectIds = await getWorkspaceProjectIds();
        if (wsProjectIds.length === 0) return [];
        taskIdsQuery = taskIdsQuery.in("project_id", wsProjectIds);
      }

      const { data: taskIds, error: taskIdsError } = await taskIdsQuery;
      if (taskIdsError) throw taskIdsError;

      if (!taskIds || taskIds.length === 0) return [];

      const ids = taskIds.map((t) => t.id);
      const { data, error } = await supabase
        .from("task_history")
        .select("*")
        .in("task_id", ids)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as TaskHistory[];
    },
    enabled: !!user && (!!projectId || !!currentWorkspace?.id),
  });

  // Burndown data for a specific sprint
  const getBurndownData = (sprintId: string): BurndownDataPoint[] => {
    const sprint = sprints.find((s) => s.id === sprintId);
    if (!sprint) return [];

    const sprintTasks = tasks.filter((t) => t.sprint_id === sprintId);
    const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.story_points || 1), 0);

    const startDate = new Date(sprint.start_date);
    const endDate = new Date(sprint.end_date);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (totalDays <= 0) return [];

    const statusChanges = taskHistory
      .filter((h) => h.action === "status_changed" && sprintTasks.some((t) => t.id === h.task_id))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const data: BurndownDataPoint[] = [];
    let completedPoints = 0;
    const completedByDate = new Map<string, number>();

    for (const change of statusChanges) {
      if (change.new_value === "completed") {
        const task = sprintTasks.find((t) => t.id === change.task_id);
        const dateKey = new Date(change.created_at).toISOString().split("T")[0];
        completedByDate.set(dateKey, (completedByDate.get(dateKey) || 0) + (task?.story_points || 1));
      }
    }

    const today = new Date();
    for (let i = 0; i <= totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      if (date > today) break;

      const dateKey = date.toISOString().split("T")[0];
      completedPoints += completedByDate.get(dateKey) || 0;

      data.push({
        date: dateKey,
        ideal: Math.round((totalPoints * (totalDays - i)) / totalDays * 10) / 10,
        actual: totalPoints - completedPoints,
      });
    }

    return data;
  };

  // Velocity data
  const getVelocityData = (): VelocityDataPoint[] => {
    const completedSprints = sprints
      .filter((s) => s.status === "completed" && s.velocity !== null)
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    let runningSum = 0;
    return completedSprints.map((sprint, index) => {
      runningSum += sprint.velocity || 0;
      return {
        sprint: sprint.name,
        velocity: sprint.velocity || 0,
        average: Math.round((runningSum / (index + 1)) * 10) / 10,
      };
    });
  };

  // Cumulative Flow Diagram data
  const getCFDData = (): CumulativeFlowDataPoint[] => {
    if (tasks.length === 0) return [];

    const firstTaskDate = new Date(tasks[0].created_at);
    const today = new Date();
    const data: CumulativeFlowDataPoint[] = [];

    const taskStatusAtDate = new Map<string, Map<string, string>>();
    
    for (const task of tasks) {
      const createdDate = new Date(task.created_at).toISOString().split("T")[0];
      if (!taskStatusAtDate.has(task.id)) {
        taskStatusAtDate.set(task.id, new Map());
      }
      taskStatusAtDate.get(task.id)!.set(createdDate, "todo");
    }

    for (const change of taskHistory) {
      if (change.action === "status_changed" && change.new_value) {
        const dateKey = new Date(change.created_at).toISOString().split("T")[0];
        if (!taskStatusAtDate.has(change.task_id)) {
          taskStatusAtDate.set(change.task_id, new Map());
        }
        taskStatusAtDate.get(change.task_id)!.set(dateKey, change.new_value);
      }
    }

    const startDate = new Date(Math.max(firstTaskDate.getTime(), today.getTime() - 30 * 24 * 60 * 60 * 1000));
    
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split("T")[0];
      const counts = { todo: 0, in_progress: 0, review: 0, completed: 0 };

      for (const task of tasks) {
        const taskCreatedDate = new Date(task.created_at).toISOString().split("T")[0];
        if (taskCreatedDate > dateKey) continue;

        const statusHistory = taskStatusAtDate.get(task.id);
        if (!statusHistory) continue;

        let latestStatus = "todo";
        let latestDate = "";
        for (const [sDate, status] of statusHistory) {
          if (sDate <= dateKey && sDate >= latestDate) {
            latestStatus = status;
            latestDate = sDate;
          }
        }

        if (latestStatus in counts) {
          counts[latestStatus as keyof typeof counts]++;
        }
      }

      data.push({ date: dateKey, ...counts });
    }

    return data;
  };

  // Cycle Time & Lead Time
  const getCycleTimeData = (): CycleTimeDataPoint[] => {
    const completedTasks = tasks.filter((t) => t.status === "completed");
    
    return completedTasks.map((task) => {
      const createdAt = new Date(task.created_at).getTime();
      const updatedAt = new Date(task.updated_at).getTime();
      
      const leadTime = Math.round((updatedAt - createdAt) / (1000 * 60 * 60 * 24) * 10) / 10;
      
      const firstInProgress = taskHistory.find(
        (h) => h.task_id === task.id && h.action === "status_changed" && h.new_value === "in_progress"
      );
      const cycleTime = firstInProgress
        ? Math.round((updatedAt - new Date(firstInProgress.created_at).getTime()) / (1000 * 60 * 60 * 24) * 10) / 10
        : leadTime;

      return {
        task: task.title.length > 20 ? task.title.substring(0, 20) + "..." : task.title,
        leadTime: Math.max(0, leadTime),
        cycleTime: Math.max(0, cycleTime),
        completedAt: task.updated_at,
      };
    }).sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
      .slice(-20);
  };

  // Team Performance
  const getTeamPerformance = (): TeamMemberPerformance[] => {
    const memberMap = new Map<string, TeamMemberPerformance>();

    for (const task of tasks) {
      if (!task.assigned_to || !task.assigned_user) continue;

      if (!memberMap.has(task.assigned_to)) {
        memberMap.set(task.assigned_to, {
          id: task.assigned_to,
          name: (task.assigned_user as any).full_name || "Sem nome",
          avatar_url: (task.assigned_user as any).avatar_url || null,
          tasksCompleted: 0,
          storyPointsDelivered: 0,
          avgCycleTime: 0,
          completionRate: 0,
        });
      }

      const member = memberMap.get(task.assigned_to)!;
      const totalTasks = tasks.filter((t) => t.assigned_to === task.assigned_to).length;

      if (task.status === "completed") {
        member.tasksCompleted++;
        member.storyPointsDelivered += task.story_points || 0;
      }

      member.completionRate = totalTasks > 0 ? Math.round((member.tasksCompleted / totalTasks) * 100) : 0;
    }

    for (const [memberId, member] of memberMap) {
      const completedTasks = tasks.filter(
        (t) => t.assigned_to === memberId && t.status === "completed"
      );
      if (completedTasks.length > 0) {
        const totalCycleTime = completedTasks.reduce((sum, t) => {
          const created = new Date(t.created_at).getTime();
          const updated = new Date(t.updated_at).getTime();
          return sum + (updated - created) / (1000 * 60 * 60 * 24);
        }, 0);
        member.avgCycleTime = Math.round((totalCycleTime / completedTasks.length) * 10) / 10;
      }
    }

    return Array.from(memberMap.values()).sort((a, b) => b.storyPointsDelivered - a.storyPointsDelivered);
  };

  return {
    tasks,
    sprints,
    taskHistory,
    isLoading: tasksLoading || sprintsLoading || historyLoading,
    getBurndownData,
    getVelocityData,
    getCFDData,
    getCycleTimeData,
    getTeamPerformance,
  };
}
