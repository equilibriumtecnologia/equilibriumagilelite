import { useDraggable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, GripVertical, Clock, Timer, CheckSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";
import { useMemo, useEffect, useState } from "react";
import { TaskDetailsDialog } from "@/components/tasks/TaskDetailsDialog";
import { useSubTasks } from "@/hooks/useSubTasks";
import { StoryPointsBadge } from "@/components/tasks/StoryPointsBadge";

type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
  assigned_to_profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
  created_by_profile: Database["public"]["Tables"]["profiles"]["Row"];
};

interface KanbanTaskCardProps {
  task: Task;
  isDragging?: boolean;
}

const priorityColors: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  urgent: "bg-red-500/10 text-red-500 border-red-500/20",
};

const priorityLabels: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

// Format duration to human readable string
const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `<1m`;
};

export function KanbanTaskCard({
  task,
  isDragging = false,
}: KanbanTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });
  const [, setTick] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const { totalCount, completedCount } = useSubTasks(task.id);

  // Update every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  // Calculate time metrics
  const timeMetrics = useMemo(() => {
    const now = Date.now();
    const createdAt = new Date(task.created_at).getTime();
    const updatedAt = new Date(task.updated_at).getTime();
    
    return {
      totalTime: now - createdAt,
      currentStepTime: now - updatedAt, // Using updated_at as proxy for last status change
    };
  }, [task.created_at, task.updated_at]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Only open details if not starting a drag
    if (!(e.target as HTMLElement).closest('[data-drag-handle]')) {
      setShowDetails(true);
    }
  };

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        className={`p-4 cursor-pointer ${
          isDragging ? "opacity-50" : ""
        } hover:shadow-md hover:border-primary/30 transition-all`}
        onClick={handleCardClick}
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium line-clamp-2 flex-1">{task.title}</h4>
            <div 
              data-drag-handle
              className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted"
              {...listeners}
              {...attributes}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </div>
          </div>

          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={priorityColors[task.priority]}>
              {priorityLabels[task.priority]}
            </Badge>
            
            {/* Story Points */}
            <StoryPointsBadge points={task.story_points} />
            
            {/* Sub-tasks progress */}
            {totalCount > 0 && (
              <Badge variant="outline" className="bg-muted text-xs">
                <CheckSquare className="h-3 w-3 mr-1" />
                {completedCount}/{totalCount}
              </Badge>
            )}
            
            {/* Time metrics */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground ml-auto">
              <div className="flex items-center gap-0.5" title="Tempo total">
                <Clock className="h-3 w-3" />
                <span>{formatDuration(timeMetrics.totalTime)}</span>
              </div>
              <div className="flex items-center gap-0.5" title="Tempo no status atual">
                <Timer className="h-3 w-3" />
                <span>{formatDuration(timeMetrics.currentStepTime)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t">
            {task.assigned_to_profile ? (
              <div className="flex items-center gap-2 min-w-0">
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarFallback className="text-xs">
                    {(() => {
                      const names = task.assigned_to_profile.full_name.split(" ");
                      const firstName = names[0]?.[0] || "";
                      const lastName = names[names.length - 1]?.[0] || "";
                      return (firstName + lastName).toUpperCase();
                    })()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate">
                  {task.assigned_to_profile.full_name.split(" ")[0]}
                </span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Não atribuído</span>
            )}

            {task.due_date && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      <TaskDetailsDialog 
        task={task} 
        open={showDetails} 
        onOpenChange={setShowDetails} 
      />
    </>
  );
}
