import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, Clock, Zap } from "lucide-react";
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
      <h3 className="text-base sm:text-lg font-semibold mb-4">Performance da Equipe</h3>
      <div className="space-y-4">
        {data.map((member, index) => (
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
              <div className="flex items-center gap-1.5 text-xs">
                <Zap className="h-3 w-3 text-warning flex-shrink-0" />
                <span className="text-muted-foreground">Pontos:</span>
                <strong>{member.storyPointsDelivered}</strong>
              </div>
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

            <Progress value={member.completionRate} className="h-1.5" />
          </div>
        ))}
      </div>
    </Card>
  );
}
