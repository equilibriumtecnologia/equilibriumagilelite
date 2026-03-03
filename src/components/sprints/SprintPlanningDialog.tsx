import { useState, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Search, ArrowRight, Zap, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { StoryPointsBadge } from "@/components/tasks/StoryPointsBadge";
import type { Database } from "@/integrations/supabase/types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];
type Sprint = Database["public"]["Tables"]["sprints"]["Row"];

interface SprintPlanningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprint: Sprint;
  tasks: Task[];
  averageVelocity: number;
}

function DroppablePanel({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[200px] rounded-lg border-2 border-dashed transition-colors p-2",
        isOver ? "border-primary bg-primary/5" : "border-border",
        className,
      )}
    >
      {children}
    </div>
  );
}

function PlanningTaskItem({ task }: { task: Task }) {
  const priorityColors: Record<string, string> = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    high: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
    urgent: "bg-destructive/10 text-destructive",
  };

  return (
    <Card className="p-2.5 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
      <p className="text-sm font-medium truncate">{task.title}</p>
      <div className="flex items-center gap-1.5 mt-1.5">
        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", priorityColors[task.priority])}>
          {task.priority}
        </Badge>
        {task.story_points && <StoryPointsBadge points={task.story_points} size="sm" />}
      </div>
    </Card>
  );
}

export function SprintPlanningDialog({ open, onOpenChange, sprint, tasks, averageVelocity }: SprintPlanningDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const backlogTasks = useMemo(
    () =>
      tasks
        .filter((t) => !t.sprint_id && t.status !== "completed")
        .filter((t) => t.title.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => (a.backlog_order || 0) - (b.backlog_order || 0)),
    [tasks, searchTerm]
  );

  const sprintTasks = useMemo(
    () => tasks.filter((t) => t.sprint_id === sprint.id),
    [tasks, sprint.id]
  );

  const sprintPoints = sprintTasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
  const capacityPercent = averageVelocity > 0 ? Math.min((sprintPoints / averageVelocity) * 100, 100) : 0;

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const target = over.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newSprintId = target === "sprint-panel" ? sprint.id : null;
    if (task.sprint_id === newSprintId) return;

    const { error } = await supabase
      .from("tasks")
      .update({ sprint_id: newSprintId })
      .eq("id", taskId);

    if (error) {
      toast.error("Erro ao mover tarefa: " + error.message);
    } else {
      toast.success(newSprintId ? "Tarefa adicionada à sprint" : "Tarefa removida da sprint");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Planejar Sprint: {sprint.name}
          </DialogTitle>
        </DialogHeader>

        {/* Capacity bar */}
        {averageVelocity > 0 && (
          <div className="space-y-1.5 px-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Capacity: {sprintPoints} / {averageVelocity} pts (média)
              </span>
              <span>{Math.round(capacityPercent)}%</span>
            </div>
            <Progress
              value={capacityPercent}
              className={cn("h-2", capacityPercent > 100 && "[&>div]:bg-destructive")}
            />
          </div>
        )}

        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
            {/* Backlog Panel */}
            <div className="flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold">Backlog ({backlogTasks.length})</h4>
              </div>
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar no backlog..."
                  className="h-8 text-xs pl-8"
                />
              </div>
              <ScrollArea className="flex-1">
                <DroppablePanel id="backlog-panel">
                  {backlogTasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">Nenhuma tarefa no backlog</p>
                  ) : (
                    <div className="space-y-2">
                      {backlogTasks.map((task) => (
                        <div key={task.id} id={task.id} draggable data-id={task.id}>
                          <DraggableTask task={task} />
                        </div>
                      ))}
                    </div>
                  )}
                </DroppablePanel>
              </ScrollArea>
            </div>

            {/* Sprint Panel */}
            <div className="flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <ArrowRight className="h-3.5 w-3.5" />
                  Sprint ({sprintTasks.length})
                  {sprintPoints > 0 && (
                    <Badge variant="secondary" className="text-[10px]">{sprintPoints} pts</Badge>
                  )}
                </h4>
              </div>
              <div className="h-8 mb-2" /> {/* spacer to align with search */}
              <ScrollArea className="flex-1">
                <DroppablePanel id="sprint-panel">
                  {sprintTasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">
                      Arraste tarefas do backlog para cá
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {sprintTasks.map((task) => (
                        <div key={task.id}>
                          <DraggableTask task={task} />
                        </div>
                      ))}
                    </div>
                  )}
                </DroppablePanel>
              </ScrollArea>
            </div>
          </div>

          <DragOverlay>
            {activeTask ? (
              <Card className="p-2.5 opacity-80 shadow-lg w-[280px]">
                <p className="text-sm font-medium truncate">{activeTask.title}</p>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      </DialogContent>
    </Dialog>
  );
}

// Draggable wrapper using dnd-kit
import { useDraggable } from "@dnd-kit/core";

function DraggableTask({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={cn(isDragging && "opacity-30")}>
      <PlanningTaskItem task={task} />
    </div>
  );
}
