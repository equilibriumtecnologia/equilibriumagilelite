import { useMemo } from "react";
import type { Tables } from "@/integrations/supabase/types";

type TaskHistory = Tables<"task_history"> & {
  user?: Tables<"profiles"> | null;
};

interface TaskMetrics {
  totalTime: number; // ms since creation
  currentStepTime: number; // ms in current status
  currentStatus: string;
  statusDurations: Record<string, number>; // time spent in each status
  lastStatusChange: Date | null;
}

// Format duration to human readable string
export const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
};

export const useTaskMetrics = (
  task: Tables<"tasks"> | null,
  history: TaskHistory[] | undefined
): TaskMetrics | null => {
  return useMemo(() => {
    if (!task) return null;

    const now = Date.now();
    const createdAt = new Date(task.created_at).getTime();
    const totalTime = now - createdAt;

    // Sort history by date ascending
    const sortedHistory = [...(history || [])]
      .filter(h => h.action === "status_changed" || h.action === "created")
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Calculate time spent in each status
    const statusDurations: Record<string, number> = {};
    let lastStatusChange: Date | null = null;
    let currentStepTime = 0;

    if (sortedHistory.length === 0) {
      // No history - task has been in 'todo' since creation
      currentStepTime = totalTime;
      statusDurations["todo"] = totalTime;
      lastStatusChange = new Date(task.created_at);
    } else {
      for (let i = 0; i < sortedHistory.length; i++) {
        const current = sortedHistory[i];
        const next = sortedHistory[i + 1];
        
        // Determine status for this period
        let status: string;
        if (current.action === "created") {
          status = "todo";
        } else {
          status = current.new_value || "todo";
        }
        
        const startTime = new Date(current.created_at).getTime();
        const endTime = next ? new Date(next.created_at).getTime() : now;
        const duration = endTime - startTime;
        
        statusDurations[status] = (statusDurations[status] || 0) + duration;

        // Track last status change
        if (current.action === "status_changed") {
          lastStatusChange = new Date(current.created_at);
        }
      }

      // Current step time is the time since the last status change (or creation if no changes)
      const lastChange = sortedHistory[sortedHistory.length - 1];
      if (lastChange) {
        currentStepTime = now - new Date(lastChange.created_at).getTime();
        if (lastChange.action !== "status_changed") {
          // If the last entry is creation, no status change happened yet
          lastStatusChange = new Date(task.created_at);
        }
      }
    }

    return {
      totalTime,
      currentStepTime,
      currentStatus: task.status,
      statusDurations,
      lastStatusChange,
    };
  }, [task, history]);
};

// Get status label in Portuguese
export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    todo: "A Fazer",
    in_progress: "Em Progresso",
    review: "Em Revisão",
    completed: "Concluída",
  };
  return labels[status] || status;
};
