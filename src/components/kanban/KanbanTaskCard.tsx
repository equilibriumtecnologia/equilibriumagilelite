import { useDraggable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, GripVertical } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";

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

export function KanbanTaskCard({
  task,
  isDragging = false,
}: KanbanTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-4 cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-50" : ""
      } hover:shadow-md transition-shadow`}
      {...listeners}
      {...attributes}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium line-clamp-2 flex-1">{task.title}</h4>
          <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </div>

        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-2">
          <Badge variant="outline" className={priorityColors[task.priority]}>
            {priorityLabels[task.priority]}
          </Badge>
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
  );
}
