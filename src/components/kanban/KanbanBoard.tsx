import { useState, useCallback, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Layers, LayoutGrid } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanTaskCard } from "./KanbanTaskCard";
import { KanbanSwimlane } from "./KanbanSwimlane";
import { StatusChangeDialog } from "./StatusChangeDialog";
import { WIPLimitSettings } from "./WIPLimitSettings";
import { ColumnCustomizeDialog } from "./ColumnCustomizeDialog";
import { KanbanFilters, FilterState } from "./KanbanFilters";
import { useBoardSettings } from "@/hooks/useBoardSettings";
import { useProjectRole } from "@/hooks/useProjectRole";
import { isToday, isThisWeek, isBefore, startOfDay } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

const SWIMLANE_STORAGE_KEY = "kanban-swimlane-mode";

export function KanbanBoard({ tasks, onUpdate, projectId, members = [], sprints = [] }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [pendingChange, setPendingChange] = useState<PendingStatusChange | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [swimlaneMode, setSwimlaneMode] = useState(() => {
    try {
      return localStorage.getItem(SWIMLANE_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [filters, setFilters] = useState<FilterState>({
    assignee: null,
    priority: null,
    dueDate: null,
    sprint: null,
  });

  const { getWipLimit, getWipStatus, getColumnLabel, getColumnColor } = useBoardSettings(projectId);
  const { canCreateTasks } = useProjectRole(projectId);

  useEffect(() => {
    try {
      localStorage.setItem(SWIMLANE_STORAGE_KEY, String(swimlaneMode));
    } catch {}
  }, [swimlaneMode]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Apply filters to tasks
  const filteredTasks = tasks.filter((task) => {
    if (filters.assignee) {
      if (filters.assignee === "unassigned" && task.assigned_to) return false;
      if (filters.assignee !== "unassigned" && task.assigned_to !== filters.assignee) return false;
    }
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.dueDate) {
      const dueDate = task.due_date ? new Date(task.due_date + "T12:00:00") : null;
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

  // Group tasks by sprint for swimlane mode
  const swimlaneGroups = (() => {
    if (!swimlaneMode) return [];

    const sprintMap = new Map<string | null, { sprint: Database["public"]["Tables"]["sprints"]["Row"] | null; tasks: Task[] }>();

    // Active sprints first, then planning, then completed, then no-sprint
    const sortedSprints = [...sprints].sort((a, b) => {
      const order = { active: 0, planning: 1, completed: 2, cancelled: 3 };
      return (order[a.status as keyof typeof order] ?? 4) - (order[b.status as keyof typeof order] ?? 4);
    });

    for (const sprint of sortedSprints) {
      sprintMap.set(sprint.id, { sprint, tasks: [] });
    }
    sprintMap.set(null, { sprint: null, tasks: [] });

    for (const task of filteredTasks) {
      const group = sprintMap.get(task.sprint_id);
      if (group) {
        group.tasks.push(task);
      } else {
        // Task references a sprint not in the list — put in "no sprint"
        sprintMap.get(null)!.tasks.push(task);
      }
    }

    return Array.from(sprintMap.values());
  })();

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
    if (!task || task.status === newStatus || !canCreateTasks) return;

    const newColumnCount = tasksByStatus[newStatus].length;
    const wipLimit = getWipLimit(newStatus);
    if (wipLimit && newColumnCount >= wipLimit) {
      toast.error(`Limite WIP atingido para "${columns.find(c => c.id === newStatus)?.title}"`);
      return;
    }

    setPendingChange({
      taskId,
      taskTitle: task.title,
      oldStatus: task.status as TaskStatus,
      newStatus,
    });
  };

  const handleConfirmStatusChange = async (comment: string, newAssignee?: string | null) => {
    if (!pendingChange) return;

    setIsUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      const updatePayload: Record<string, any> = { status: pendingChange.newStatus };
      if (newAssignee !== undefined) {
        updatePayload.assigned_to = newAssignee;
      }

      const { error: updateError } = await supabase
        .from("tasks")
        .update(updatePayload)
        .eq("id", pendingChange.taskId);

      if (updateError) throw updateError;

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

      const currentTask = tasks.find(t => t.id === pendingChange.taskId);
      if (newAssignee !== undefined && newAssignee !== currentTask?.assigned_to) {
        await supabase.from("task_history").insert({
          task_id: pendingChange.taskId,
          user_id: user.id,
          action: newAssignee ? "assigned" : "unassigned",
          old_value: currentTask?.assigned_to || null,
          new_value: newAssignee,
        });
      }

      const { data: changerProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (currentTask?.assigned_to && currentTask.assigned_to !== user.id) {
        const { data: assigneeProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", currentTask.assigned_to)
          .single();

        if (assigneeProfile) {
          try {
            await supabase.functions.invoke("send-task-notification", {
              body: {
                taskId: pendingChange.taskId,
                taskTitle: pendingChange.taskTitle,
                projectName: "",
                notificationType: "status_changed",
                recipientUserId: currentTask.assigned_to,
                recipientName: assigneeProfile.full_name,
                changedByName: changerProfile?.full_name || "Um usuário",
                oldStatus: pendingChange.oldStatus,
                newStatus: pendingChange.newStatus,
              },
            });
          } catch (e) {
            console.error("Failed to send status notification:", e);
          }
        }
      }

      if (currentTask?.created_by && currentTask.created_by !== user.id && currentTask.created_by !== currentTask?.assigned_to) {
        const { data: creatorProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", currentTask.created_by)
          .single();

        if (creatorProfile) {
          try {
            await supabase.functions.invoke("send-task-notification", {
              body: {
                taskId: pendingChange.taskId,
                taskTitle: pendingChange.taskTitle,
                projectName: "",
                notificationType: "status_changed",
                recipientUserId: currentTask.created_by,
                recipientName: creatorProfile.full_name,
                changedByName: changerProfile?.full_name || "Um usuário",
                oldStatus: pendingChange.oldStatus,
                newStatus: pendingChange.newStatus,
              },
            });
          } catch (e) {
            console.error("Failed to send creator notification:", e);
          }
        }
      }

      if (newAssignee && newAssignee !== user.id && newAssignee !== currentTask?.assigned_to) {
        const { data: newAssigneeProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", newAssignee)
          .single();

        if (newAssigneeProfile) {
          try {
            await supabase.functions.invoke("send-task-notification", {
              body: {
                taskId: pendingChange.taskId,
                taskTitle: pendingChange.taskTitle,
                projectName: "",
                notificationType: "assigned",
                recipientUserId: newAssignee,
                recipientName: newAssigneeProfile.full_name,
                changedByName: changerProfile?.full_name || "Um usuário",
              },
            });
          } catch (e) {
            console.error("Failed to send assignment notification:", e);
          }
        }
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
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={swimlaneMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSwimlaneMode(!swimlaneMode)}
                    className="gap-2"
                  >
                    {swimlaneMode ? <Layers className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                    <span className="hidden sm:inline">{swimlaneMode ? "Swimlanes" : "Flat"}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {swimlaneMode ? "Desativar agrupamento por Sprint" : "Agrupar por Sprint"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {projectId && <ColumnCustomizeDialog projectId={projectId} columns={columns.map(c => ({ id: c.id, defaultTitle: c.title, defaultColor: c.color }))} />}
            {projectId && <WIPLimitSettings projectId={projectId} columns={columns} />}
          </div>
        </div>

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {swimlaneMode ? (
            <div className="space-y-4">
              {swimlaneGroups.map(({ sprint, tasks: groupTasks }) => (
                <KanbanSwimlane
                  key={sprint?.id || "no-sprint"}
                  title={sprint?.name || "Sem Sprint"}
                  sprintStatus={sprint?.status}
                  tasks={groupTasks}
                  columns={columns}
                  getWipLimit={getWipLimit}
                  getWipStatus={getWipStatus}
                  getColumnLabel={getColumnLabel}
                  getColumnColor={getColumnColor}
                  defaultExpanded={sprint?.status === "active" || !sprint}
                />
              ))}
              {swimlaneGroups.length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                  Nenhuma tarefa encontrada
                </div>
              )}
            </div>
          ) : (
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
          )}

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
        members={members}
        currentAssignee={pendingChange ? tasks.find(t => t.id === pendingChange.taskId)?.assigned_to : null}
      />
    </>
  );
}
