import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, Zap, Hammer, Eye } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { TeamMemberPerformance } from "@/hooks/useReportData";

interface Props {
  data: TeamMemberPerformance[];
}

export function CompactTeamPerformance({ data }: Props) {
  const topMembers = data.slice(0, 3);

  return (
    <Card className="p-3 sm:p-4">
      <h3 className="text-sm font-semibold mb-2">Performance da Equipe</h3>
      <div className="space-y-2">
        {topMembers.map((member, index) => {
          const hasBreakdown = member.executorPoints > 0 || member.reviewerPoints > 0;
          const totalPts = member.executorPoints + member.reviewerPoints;
          const execPercent = totalPts > 0 ? Math.round((member.executorPoints / totalPts) * 100) : 0;

          return (
            <div key={member.id} className="p-2 sm:p-3 bg-muted/50 rounded-lg space-y-1.5">
              <div className="flex items-center gap-2">
                {index === 0 && <Trophy className="h-3.5 w-3.5 text-warning flex-shrink-0" />}
                <Avatar className="h-6 w-6">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-xs truncate flex-1">{member.name}</span>
                <span className="text-[10px] text-muted-foreground">{member.completionRate}%</span>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3 text-primary" />
                  {member.tasksCompleted} concluídas
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-1 cursor-help">
                        <Zap className="h-3 w-3 text-warning" />
                        {member.storyPointsDelivered} pts
                      </span>
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
              </div>
              {hasBreakdown && (
                <div className="h-1 bg-muted rounded-full overflow-hidden flex">
                  <div className="bg-primary rounded-l-full" style={{ width: `${execPercent}%` }} />
                  <div className="bg-muted-foreground/30 rounded-r-full flex-1" />
                </div>
              )}
              <Progress value={member.completionRate} className="h-1" />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
