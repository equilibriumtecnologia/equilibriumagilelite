import { useState } from "react";
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

type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
  assigned_to_profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
  created_by_profile: Database["public"]["Tables"]["profiles"]["Row"];
};

type TaskStatus = "todo" | "in_progress" | "review" | "completed";

interface KanbanBoardProps {
  tasks: Task[];
  onUpdate?: () => void;
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

export function KanbanBoard({ tasks, onUpdate }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [pendingChange, setPendingChange] = useState<PendingStatusChange | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const tasksByStatus = columns.reduce((acc, column) => {
    acc[column.id] = tasks.filter((task) => task.status === column.id);
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

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              tasks={tasksByStatus[column.id]}
              count={tasksByStatus[column.id].length}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <Card className="p-4 cursor-grabbing opacity-50">
              <KanbanTaskCard task={activeTask} isDragging />
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

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
