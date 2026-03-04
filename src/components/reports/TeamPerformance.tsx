import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, Clock, Zap, Hammer, Eye } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ExportButton } from "./ExportButton";
import type { TeamMemberPerformance } from "@/hooks/useReportData";

interface TeamPerformanceProps {
  data: TeamMemberPerformance[];
}

export function TeamPerformance({ data }: TeamPerformanceProps) {
  if (data.length === 0) {
    return (
      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4">Performance da Equipe</h3>
        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
          Nenhum dado de performance disponível.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-semibold">Performance da Equipe</h3>
        <ExportButton
          data={data.map(m => ({ nome: m.name, tarefas_concluidas: m.tasksCompleted, pontos_total: m.storyPointsDelivered, pontos_executor: m.executorPoints, pontos_revisor: m.reviewerPoints, cycle_time_medio: m.avgCycleTime, taxa_conclusao: m.completionRate }))}
          filename="performance-equipe"
          headers={{ nome: "Nome", tarefas_concluidas: "Tarefas Concluídas", pontos_total: "Pontos Total", pontos_executor: "Pontos Executor", pontos_revisor: "Pontos Revisor", cycle_time_medio: "Cycle Time Médio (dias)", taxa_conclusao: "Taxa Conclusão (%)" }}
        />
      </div>
      <div className="space-y-4">
        {data.map((member, index) => {
          const hasBreakdown = member.executorPoints > 0 || member.reviewerPoints > 0;
          const totalPts = member.executorPoints + member.reviewerPoints;
          const execPercent = totalPts > 0 ? Math.round((member.executorPoints / totalPts) * 100) : 0;

          return (
            <div key={member.id} className="p-3 sm:p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                {index === 0 && <Trophy className="h-4 w-4 text-warning flex-shrink-0" />}
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm truncate">{member.name}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <Target className="h-3 w-3 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">Concluídas:</span>
                  <strong>{member.tasksCompleted}</strong>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 text-xs cursor-help">
                        <Zap className="h-3 w-3 text-warning flex-shrink-0" />
                        <span className="text-muted-foreground">Pontos:</span>
                        <strong>{member.storyPointsDelivered}</strong>
                      </div>
                    </TooltipTrigger>
                    {hasBreakdown && (
                      <TooltipContent>
                        <div className="text-xs space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Hammer className="h-3 w-3 text-primary" />
                            Executor: {member.executorPoints} pts
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Eye className="h-3 w-3 text-muted-foreground" />
                            Revisor: {member.reviewerPoints} pts
                          </div>
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                <div className="flex items-center gap-1.5 text-xs">
                  <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Cycle:</span>
                  <strong>{member.avgCycleTime}d</strong>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground">Taxa:</span>
                  <strong>{member.completionRate}%</strong>
                </div>
              </div>

              {/* Executor/Reviewer visual bar */}
              {hasBreakdown && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Hammer className="h-2.5 w-2.5" /> Executor {execPercent}%</span>
                    <span className="flex items-center gap-1"><Eye className="h-2.5 w-2.5" /> Revisor {100 - execPercent}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden flex">
                    <div className="bg-primary rounded-l-full transition-all" style={{ width: `${execPercent}%` }} />
                    <div className="bg-muted-foreground/30 rounded-r-full flex-1" />
                  </div>
                </div>
              )}

              <Progress value={member.completionRate} className="h-1.5" />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
