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
  executorPoints: number;
  reviewerPoints: number;
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

  // Helper to get project split config
  const getProjectSplitPercent = async (pId: string): Promise<number> => {
    const { data } = await supabase
      .from("projects")
      .select("executor_split_percent")
      .eq("id", pId)
      .maybeSingle();
    return (data as any)?.executor_split_percent ?? 70;
  };

  // Cache project split configs
  const { data: projectSplitConfigs = new Map<string, number>() } = useQuery({
    queryKey: ["project-split-configs", projectId, currentWorkspace?.id],
    queryFn: async () => {
      let query = supabase.from("projects").select("id, executor_split_percent");
      if (projectId) {
        query = query.eq("id", projectId);
      } else {
        const wsProjectIds = await getWorkspaceProjectIds();
        if (wsProjectIds.length === 0) return new Map<string, number>();
        query = query.in("id", wsProjectIds);
      }
      const { data } = await query;
      const map = new Map<string, number>();
      for (const p of data || []) {
        map.set(p.id, (p as any).executor_split_percent ?? 70);
      }
      return map;
    },
    enabled: !!user && (!!projectId || !!currentWorkspace?.id),
  });

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

  // Helper: find executor (assigned during in_progress) and reviewer (assigned during review→completed)
  const getTaskContributors = (taskId: string): { executorId: string | null; reviewerId: string | null } => {
    const history = taskHistory.filter((h) => h.task_id === taskId);
    let executorId: string | null = null;
    let reviewerId: string | null = null;

    // Find who was assigned when task moved to in_progress
    // Strategy: look at assignments and status changes chronologically
    const assignments = history.filter((h) => h.action === "assigned");
    const statusChanges = history.filter((h) => h.action === "status_changed");

    // The executor is whoever was assigned when status changed to in_progress
    const toInProgress = statusChanges.find((h) => h.new_value === "in_progress");
    if (toInProgress) {
      // Find the most recent assignment before or at the in_progress change
      const assignmentsBefore = assignments
        .filter((a) => new Date(a.created_at) <= new Date(toInProgress.created_at))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      if (assignmentsBefore.length > 0 && assignmentsBefore[0].new_value) {
        executorId = assignmentsBefore[0].new_value;
      }
    }

    // The reviewer is whoever was assigned when status changed to completed (via review)
    const toCompleted = statusChanges.find((h) => h.new_value === "completed");
    if (toCompleted) {
      const assignmentsBeforeComplete = assignments
        .filter((a) => new Date(a.created_at) <= new Date(toCompleted.created_at))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      if (assignmentsBeforeComplete.length > 0 && assignmentsBeforeComplete[0].new_value) {
        const lastAssigned = assignmentsBeforeComplete[0].new_value;
        // Only set reviewer if different from executor
        if (lastAssigned !== executorId) {
          reviewerId = lastAssigned;
        }
      }
    }

    return { executorId, reviewerId };
  };

  // Team Performance with 70/30 split
  const getTeamPerformance = (): TeamMemberPerformance[] => {
    const memberMap = new Map<string, TeamMemberPerformance>();

    const ensureMember = (userId: string) => {
      if (!memberMap.has(userId)) {
        const taskWithUser = tasks.find((t) => t.assigned_to === userId && t.assigned_user);
        memberMap.set(userId, {
          id: userId,
          name: taskWithUser ? (taskWithUser.assigned_user as any).full_name || "Sem nome" : "Sem nome",
          avatar_url: taskWithUser ? (taskWithUser.assigned_user as any).avatar_url || null : null,
          tasksCompleted: 0,
          storyPointsDelivered: 0,
          executorPoints: 0,
          reviewerPoints: 0,
          avgCycleTime: 0,
          completionRate: 0,
        });
      }
    };

    // First pass: register all assigned members
    for (const task of tasks) {
      if (task.assigned_to && task.assigned_user) {
        ensureMember(task.assigned_to);
      }
    }

    // Second pass: distribute points for completed tasks
    for (const task of tasks) {
      if (task.status !== "completed") continue;

      const points = task.story_points || 0;
      if (points === 0) continue;

      // Get project-specific split percentage
      const splitPercent = projectSplitConfigs.get(task.project_id) ?? 70;
      const executorRatio = splitPercent / 100;
      const reviewerRatio = 1 - executorRatio;

      const { executorId, reviewerId } = getTaskContributors(task.id);

      if (executorId && reviewerId) {
        ensureMember(executorId);
        ensureMember(reviewerId);
        const execPts = Math.round(points * executorRatio * 10) / 10;
        const revPts = Math.round(points * reviewerRatio * 10) / 10;
        memberMap.get(executorId)!.storyPointsDelivered += execPts;
        memberMap.get(executorId)!.executorPoints += execPts;
        memberMap.get(reviewerId)!.storyPointsDelivered += revPts;
        memberMap.get(reviewerId)!.reviewerPoints += revPts;
      } else if (executorId) {
        ensureMember(executorId);
        memberMap.get(executorId)!.storyPointsDelivered += points;
        memberMap.get(executorId)!.executorPoints += points;
      } else if (task.assigned_to) {
        ensureMember(task.assigned_to);
        memberMap.get(task.assigned_to)!.storyPointsDelivered += points;
        memberMap.get(task.assigned_to)!.executorPoints += points;
      }
    }

    // Calculate completion rates and cycle times
    for (const task of tasks) {
      if (!task.assigned_to) continue;
      if (!memberMap.has(task.assigned_to)) continue;

      if (task.status === "completed") {
        memberMap.get(task.assigned_to)!.tasksCompleted++;
      }
    }

    for (const [memberId, member] of memberMap) {
      const totalTasks = tasks.filter((t) => t.assigned_to === memberId).length;
      member.completionRate = totalTasks > 0 ? Math.round((member.tasksCompleted / totalTasks) * 100) : 0;

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
