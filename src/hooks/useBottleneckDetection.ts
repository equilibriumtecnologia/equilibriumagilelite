import { useMemo } from "react";
import { differenceInDays } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
  assigned_to_profile?: Database["public"]["Tables"]["profiles"]["Row"] | null;
};

type TaskStatus = "todo" | "in_progress" | "review" | "completed";

export interface Bottleneck {
  id: string;
  type: "wip_exceeded" | "stalled_tasks" | "no_exit" | "overloaded_assignee";
  severity: "warning" | "critical";
  title: string;
  description: string;
  columnId?: TaskStatus;
  assigneeId?: string;
  assigneeName?: string;
  taskCount?: number;
  stalledDays?: number;
}

interface UseBottleneckDetectionProps {
  tasks: Task[];
  wipLimits?: Record<string, number | null>;
  stalledThresholdDays?: number;
  overloadThreshold?: number;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "A Fazer",
  in_progress: "Em Progresso",
  review: "Em Revisão",
  completed: "Concluído",
};

export function useBottleneckDetection({
  tasks,
  wipLimits = {},
  stalledThresholdDays = 3,
  overloadThreshold = 5,
}: UseBottleneckDetectionProps): Bottleneck[] {
  return useMemo(() => {
    if (!tasks || tasks.length === 0) return [];

    const bottlenecks: Bottleneck[] = [];
    const now = new Date();
    const activeStatuses: TaskStatus[] = ["todo", "in_progress", "review"];

    // Group tasks by status (excluding completed)
    const tasksByStatus: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      review: [],
      completed: [],
    };
    for (const task of tasks) {
      const status = task.status as TaskStatus;
      if (tasksByStatus[status]) {
        tasksByStatus[status].push(task);
      }
    }

    // 1. WIP above limit
    for (const status of activeStatuses) {
      const limit = wipLimits[status];
      if (limit && tasksByStatus[status].length > limit) {
        const excess = tasksByStatus[status].length - limit;
        bottlenecks.push({
          id: `wip_${status}`,
          type: "wip_exceeded",
          severity: excess >= 3 ? "critical" : "warning",
          title: `WIP excedido em "${STATUS_LABELS[status]}"`,
          description: `${tasksByStatus[status].length} tarefas (limite: ${limit}). ${excess} acima do permitido.`,
          columnId: status,
          taskCount: tasksByStatus[status].length,
        });
      }
    }

    // 2. Stalled tasks (no status change for X+ days)
    for (const status of activeStatuses) {
      const stalledTasks = tasksByStatus[status].filter((task) => {
        const lastUpdate = new Date(task.updated_at);
        return differenceInDays(now, lastUpdate) >= stalledThresholdDays;
      });

      if (stalledTasks.length > 0) {
        const maxDays = Math.max(
          ...stalledTasks.map((t) => differenceInDays(now, new Date(t.updated_at)))
        );
        bottlenecks.push({
          id: `stalled_${status}`,
          type: "stalled_tasks",
          severity: maxDays >= 7 ? "critical" : "warning",
          title: `${stalledTasks.length} tarefa(s) parada(s) em "${STATUS_LABELS[status]}"`,
          description: `Sem atualização há ${stalledThresholdDays}+ dias. Máximo: ${maxDays} dias.`,
          columnId: status,
          taskCount: stalledTasks.length,
          stalledDays: maxDays,
        });
      }
    }

    // 3. Column without exit (in_progress or review with tasks but no completed recently)
    const recentlyCompleted = tasksByStatus.completed.filter((task) => {
      return differenceInDays(now, new Date(task.updated_at)) <= 7;
    });

    for (const status of ["in_progress", "review"] as TaskStatus[]) {
      if (tasksByStatus[status].length >= 3 && recentlyCompleted.length === 0) {
        bottlenecks.push({
          id: `no_exit_${status}`,
          type: "no_exit",
          severity: tasksByStatus[status].length >= 5 ? "critical" : "warning",
          title: `Acúmulo em "${STATUS_LABELS[status]}" sem saída`,
          description: `${tasksByStatus[status].length} tarefas acumuladas e nenhuma concluída nos últimos 7 dias.`,
          columnId: status,
          taskCount: tasksByStatus[status].length,
        });
      }
    }

    // 4. Overloaded assignee
    const assigneeTasks = new Map<string, { name: string; count: number }>();
    for (const task of tasks) {
      if (
        task.assigned_to &&
        (task.status === "in_progress" || task.status === "review")
      ) {
        const existing = assigneeTasks.get(task.assigned_to);
        if (existing) {
          existing.count++;
        } else {
          const name =
            (task as any).assigned_to_profile?.full_name ||
            (task as any).assigned_user?.full_name ||
            "Membro";
          assigneeTasks.set(task.assigned_to, { name, count: 1 });
        }
      }
    }

    for (const [assigneeId, { name, count }] of assigneeTasks) {
      if (count >= overloadThreshold) {
        bottlenecks.push({
          id: `overloaded_${assigneeId}`,
          type: "overloaded_assignee",
          severity: count >= overloadThreshold + 3 ? "critical" : "warning",
          title: `${name} sobrecarregado(a)`,
          description: `${count} tarefas em progresso/revisão simultaneamente (limite recomendado: ${overloadThreshold}).`,
          assigneeId,
          assigneeName: name,
          taskCount: count,
        });
      }
    }

    // Sort: critical first, then by type
    return bottlenecks.sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === "critical" ? -1 : 1;
      return a.type.localeCompare(b.type);
    });
  }, [tasks, wipLimits, stalledThresholdDays, overloadThreshold]);
}
