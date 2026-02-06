import { useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanTaskCard } from "./KanbanTaskCard";
import { StatusChangeDialog } from "./StatusChangeDialog";
import { WIPLimitSettings } from "./WIPLimitSettings";
import { KanbanFilters, FilterState } from "./KanbanFilters";
import { useBoardSettings } from "@/hooks/useBoardSettings";
import { isToday, isThisWeek, isBefore, startOfDay } from "date-fns";

type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
  assigned_to_profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
  created_by_profile: Database["public"]["Tables"]["profiles"]["Row"];
};

type TaskStatus = "todo" | "in_progress" | "review" | "completed";

interface KanbanBoardProps {
  tasks: Task[];
  onUpdate?: () => void;
  projectId?: string;
  members?: { user_id: string; profiles: Database["public"]["Tables"]["profiles"]["Row"] }[];
  sprints?: Database["public"]["Tables"]["sprints"]["Row"][];
}

interface PendingStatusChange {
  taskId: string;
  taskTitle: string;
  oldStatus: TaskStatus;
  newStatus: TaskStatus;
}

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: "todo", title: "A Fazer", color: "bg-blue-500" },
  { id: "in_progress", title: "Em Progresso", color: "bg-yellow-500" },
  { id: "review", title: "Em Revisão", color: "bg-purple-500" },
  { id: "completed", title: "Concluído", color: "bg-green-500" },
];

export function KanbanBoard({ tasks, onUpdate, projectId, members = [], sprints = [] }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [pendingChange, setPendingChange] = useState<PendingStatusChange | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    assignee: null,
    priority: null,
    dueDate: null,
    sprint: null,
  });

  const { getWipLimit, getWipStatus } = useBoardSettings(projectId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Apply filters to tasks
  const filteredTasks = tasks.filter((task) => {
    // Assignee filter
    if (filters.assignee) {
      if (filters.assignee === "unassigned" && task.assigned_to) return false;
      if (filters.assignee !== "unassigned" && task.assigned_to !== filters.assignee) return false;
    }

    // Priority filter
    if (filters.priority && task.priority !== filters.priority) return false;

    // Due date filter
    if (filters.dueDate) {
      const dueDate = task.due_date ? new Date(task.due_date) : null;
      const today = startOfDay(new Date());

      switch (filters.dueDate) {
        case "overdue":
          if (!dueDate || !isBefore(dueDate, today)) return false;
          break;
        case "today":
          if (!dueDate || !isToday(dueDate)) return false;
          break;
        case "week":
          if (!dueDate || !isThisWeek(dueDate)) return false;
          break;
        case "no_date":
          if (dueDate) return false;
          break;
      }
    }

    // Sprint filter
    if (filters.sprint) {
      if (filters.sprint === "no_sprint" && task.sprint_id) return false;
      if (filters.sprint !== "no_sprint" && task.sprint_id !== filters.sprint) return false;
    }

    return true;
  });

  const tasksByStatus = columns.reduce((acc, column) => {
    acc[column.id] = filteredTasks.filter((task) => task.status === column.id);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Check WIP limit before allowing drop
    const newColumnCount = tasksByStatus[newStatus].length;
    const wipLimit = getWipLimit(newStatus);
    if (wipLimit && newColumnCount >= wipLimit) {
      toast.error(`Limite WIP atingido para "${columns.find(c => c.id === newStatus)?.title}"`);
      return;
    }

    // Open dialog to require comment
    setPendingChange({
      taskId,
      taskTitle: task.title,
      oldStatus: task.status as TaskStatus,
      newStatus,
    });
  };

  const handleConfirmStatusChange = async (comment: string) => {
    if (!pendingChange) return;

    setIsUpdating(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      // Update task status
      const { error: updateError } = await supabase
        .from("tasks")
        .update({ status: pendingChange.newStatus })
        .eq("id", pendingChange.taskId);

      if (updateError) throw updateError;

      // Add history entry with comment
      const { error: historyError } = await supabase
        .from("task_history")
        .insert({
          task_id: pendingChange.taskId,
          user_id: user.id,
          action: "status_changed",
          old_value: pendingChange.oldStatus,
          new_value: pendingChange.newStatus,
          comment: comment,
        });

      if (historyError) {
        console.error("Error adding history:", historyError);
      }

      toast.success("Status da tarefa atualizado!");
      onUpdate?.();
      setPendingChange(null);
    } catch (error: any) {
      toast.error("Erro ao atualizar tarefa: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  return (
    <>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <KanbanFilters members={members} sprints={sprints} onFiltersChange={handleFiltersChange} />
          {projectId && <WIPLimitSettings projectId={projectId} columns={columns} />}
        </div>

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {columns.map((column) => {
              const count = tasksByStatus[column.id].length;
              const wipLimit = getWipLimit(column.id);
              const wipStatus = getWipStatus(column.id, count);

              return (
                <KanbanColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  color={column.color}
                  tasks={tasksByStatus[column.id]}
                  count={count}
                  wipLimit={wipLimit}
                  wipStatus={wipStatus}
                />
              );
            })}
          </div>

          <DragOverlay>
            {activeTask ? (
              <Card className="p-4 cursor-grabbing opacity-50">
                <KanbanTaskCard task={activeTask} isDragging />
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <StatusChangeDialog
        open={!!pendingChange}
        onOpenChange={(open) => !open && setPendingChange(null)}
        taskTitle={pendingChange?.taskTitle || ""}
        oldStatus={pendingChange?.oldStatus || "todo"}
        newStatus={pendingChange?.newStatus || "todo"}
        onConfirm={handleConfirmStatusChange}
        isPending={isUpdating}
      />
    </>
  );
}
