import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { GripVertical, Calendar, User } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { StoryPointsBadge } from "@/components/tasks/StoryPointsBadge";
import { Database } from "@/integrations/supabase/types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];

const priorityConfig = {
  low: { label: "Baixa", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  medium: { label: "Média", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
  high: { label: "Alta", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" },
  urgent: { label: "Urgente", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
};

interface BacklogItemProps {
  task: Task;
  index: number;
  isSelected: boolean;
  onToggleSelect: () => void;
}

export function BacklogItem({
  task,
  index,
  isSelected,
  onToggleSelect,
}: BacklogItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priority = priorityConfig[task.priority];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 border rounded-lg bg-card transition-all ${
        isDragging ? "opacity-50 shadow-lg" : "hover:shadow-sm"
      } ${isSelected ? "border-primary bg-primary/5" : ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggleSelect}
        onClick={(e) => e.stopPropagation()}
      />

      <span className="text-sm text-muted-foreground w-8">#{index}</span>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{task.title}</p>
        {task.description && (
          <p className="text-sm text-muted-foreground truncate">
            {task.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {task.story_points && (
          <StoryPointsBadge points={task.story_points} />
        )}

        <Badge variant="outline" className={priority.className}>
          {priority.label}
        </Badge>

        {task.due_date && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {format(new Date(task.due_date), "dd/MM", { locale: ptBR })}
          </div>
        )}
      </div>
    </div>
  );
}
