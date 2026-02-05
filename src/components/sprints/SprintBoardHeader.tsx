import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Target, Clock, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Database } from "@/integrations/supabase/types";

type Sprint = Database["public"]["Tables"]["sprints"]["Row"];

interface SprintBoardHeaderProps {
  sprint: Sprint;
  taskCount: number;
  completedTaskCount: number;
  totalPoints: number;
  completedPoints: number;
}

export function SprintBoardHeader({
  sprint,
  taskCount,
  completedTaskCount,
  totalPoints,
  completedPoints,
}: SprintBoardHeaderProps) {
  const endDate = new Date(sprint.end_date);
  const today = new Date();
  const daysRemaining = differenceInDays(endDate, today);
  const isOverdue = daysRemaining < 0;

  const taskProgress = taskCount > 0 ? (completedTaskCount / taskCount) * 100 : 0;
  const pointsProgress = totalPoints > 0 ? (completedPoints / totalPoints) * 100 : 0;

  return (
    <div className="bg-card border rounded-lg p-4 mb-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{sprint.name}</h2>
            <Badge variant="default">Ativa</Badge>
          </div>
          {sprint.goal && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Target className="h-3 w-3" />
              {sprint.goal}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold">{completedTaskCount}/{taskCount}</p>
            <p className="text-xs text-muted-foreground">Tarefas</p>
          </div>

          <div className="text-center">
            <p className="text-2xl font-bold">{completedPoints}/{totalPoints}</p>
            <p className="text-xs text-muted-foreground">Story Points</p>
          </div>

          <div className="text-center">
            <p className={`text-2xl font-bold ${isOverdue ? "text-destructive" : ""}`}>
              {isOverdue ? Math.abs(daysRemaining) : daysRemaining}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {isOverdue ? "dias atrasado" : "dias restantes"}
            </p>
          </div>

          <div className="w-32">
            <div className="flex justify-between text-xs mb-1">
              <span>Progresso</span>
              <span>{Math.round(taskProgress)}%</span>
            </div>
            <Progress value={taskProgress} className="h-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
