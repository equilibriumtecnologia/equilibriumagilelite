import { format, differenceInDays, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  Target,
  Play,
  CheckCircle,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Pause,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Database } from "@/integrations/supabase/types";

type Sprint = Database["public"]["Tables"]["sprints"]["Row"];
type SprintStatus = Database["public"]["Enums"]["sprint_status"];

interface SprintCardProps {
  sprint: Sprint;
  taskCount?: number;
  completedTaskCount?: number;
  totalPoints?: number;
  completedPoints?: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onStart?: () => void;
  onComplete?: () => void;
  onSelect?: () => void;
}

const statusConfig: Record<
  SprintStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  planning: { label: "Planejamento", variant: "secondary" },
  active: { label: "Ativa", variant: "default" },
  completed: { label: "Concluída", variant: "outline" },
  cancelled: { label: "Cancelada", variant: "destructive" },
};

export function SprintCard({
  sprint,
  taskCount = 0,
  completedTaskCount = 0,
  totalPoints = 0,
  completedPoints = 0,
  onEdit,
  onDelete,
  onStart,
  onComplete,
  onSelect,
}: SprintCardProps) {
  const startDate = new Date(sprint.start_date);
  const endDate = new Date(sprint.end_date);
  const today = new Date();

  const daysRemaining = differenceInDays(endDate, today);
  const totalDays = differenceInDays(endDate, startDate);
  const daysPassed = differenceInDays(today, startDate);

  const timeProgress = sprint.status === "active" 
    ? Math.min(100, Math.max(0, (daysPassed / totalDays) * 100))
    : sprint.status === "completed" ? 100 : 0;

  const taskProgress = taskCount > 0 
    ? (completedTaskCount / taskCount) * 100 
    : 0;

  const isOverdue = sprint.status === "active" && isAfter(today, endDate);

  return (
    <Card 
      className={`transition-all hover:shadow-md ${
        sprint.status === "active" ? "border-primary" : ""
      } ${onSelect ? "cursor-pointer" : ""}`}
      onClick={onSelect}
    >
      <CardHeader className="pb-2 px-4 sm:px-6">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-sm sm:text-lg flex items-center gap-2 flex-wrap">
              <span className="truncate">{sprint.name}</span>
              <Badge variant={statusConfig[sprint.status].variant}>
                {statusConfig[sprint.status].label}
              </Badge>
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              {format(startDate, "dd MMM", { locale: ptBR })} -{" "}
              {format(endDate, "dd MMM yyyy", { locale: ptBR })}
            </CardDescription>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {sprint.status === "planning" && onStart && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStart(); }}>
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar Sprint
                </DropdownMenuItem>
              )}
              {sprint.status === "active" && onComplete && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onComplete(); }}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finalizar Sprint
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
        {sprint.goal && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Target className="h-4 w-4 mt-0.5 shrink-0" />
            <p className="line-clamp-2">{sprint.goal}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Tarefas</p>
            <p className="font-medium">
              {completedTaskCount}/{taskCount}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Story Points</p>
            <p className="font-medium">
              {completedPoints}/{totalPoints}
              {sprint.velocity !== null && sprint.status === "completed" && (
                <span className="text-muted-foreground ml-1">
                  (vel: {sprint.velocity})
                </span>
              )}
            </p>
          </div>
        </div>

        {sprint.status === "active" && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progresso das tarefas</span>
              <span>{Math.round(taskProgress)}%</span>
            </div>
            <Progress value={taskProgress} className="h-2" />
          </div>
        )}

        {sprint.status === "active" && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className={`h-4 w-4 ${isOverdue ? "text-destructive" : ""}`} />
            {isOverdue ? (
              <span className="text-destructive font-medium">
                Atrasada por {Math.abs(daysRemaining)} dias
              </span>
            ) : (
              <span>
                {daysRemaining} {daysRemaining === 1 ? "dia" : "dias"} restantes
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
