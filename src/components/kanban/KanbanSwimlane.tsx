import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { KanbanColumn } from "./KanbanColumn";
import type { Database } from "@/integrations/supabase/types";

type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
  assigned_to_profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
  created_by_profile: Database["public"]["Tables"]["profiles"]["Row"];
};

type TaskStatus = "todo" | "in_progress" | "review" | "completed";

interface KanbanSwimlaneProps {
  title: string;
  sprintStatus?: string | null;
  tasks: Task[];
  columns: { id: TaskStatus; title: string; color: string }[];
  getWipLimit: (columnId: string) => number | null;
  getWipStatus: (columnId: string, count: number) => "normal" | "warning" | "exceeded";
  getColumnLabel: (columnId: string) => string | null;
  getColumnColor: (columnId: string) => string | null;
  defaultExpanded?: boolean;
}

export function KanbanSwimlane({
  title,
  sprintStatus,
  tasks,
  columns,
  getWipLimit,
  getWipStatus,
  getColumnLabel,
  getColumnColor,
  defaultExpanded = true,
}: KanbanSwimlaneProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const tasksByStatus = columns.reduce((acc, column) => {
    acc[column.id] = tasks.filter((task) => task.status === column.id);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  const totalTasks = tasks.length;
  const completedTasks = tasksByStatus["completed"]?.length || 0;
  const totalPoints = tasks.reduce((sum, t) => sum + (t.story_points || 0), 0);

  const statusColor = sprintStatus === "active"
    ? "bg-green-500/10 text-green-700 border-green-500/30"
    : sprintStatus === "completed"
    ? "bg-muted text-muted-foreground"
    : sprintStatus === "planning"
    ? "bg-blue-500/10 text-blue-700 border-blue-500/30"
    : "bg-muted text-muted-foreground";

  return (
    <div className="border rounded-lg bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-4 py-3 hover:bg-muted/50 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-semibold text-sm">{title}</span>
          {sprintStatus && (
            <Badge variant="outline" className={cn("text-xs capitalize", statusColor)}>
              {sprintStatus === "active" ? "Ativa" : sprintStatus === "completed" ? "Concluída" : sprintStatus === "planning" ? "Planejamento" : sprintStatus}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{completedTasks}/{totalTasks} tarefas</span>
          {totalPoints > 0 && <span>{totalPoints} pts</span>}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {columns.map((column) => {
              const count = tasksByStatus[column.id].length;
              const wipLimit = getWipLimit(column.id);
              const wipStatus = getWipStatus(column.id, count);

              return (
                <KanbanColumn
                  key={column.id}
                  id={column.id}
                  title={getColumnLabel(column.id) || column.title}
                  color={getColumnColor(column.id) || column.color}
                  tasks={tasksByStatus[column.id]}
                  count={count}
                  wipLimit={wipLimit}
                  wipStatus={wipStatus}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
