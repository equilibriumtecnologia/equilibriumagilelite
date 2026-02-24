import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, Zap } from "lucide-react";
import type { TeamMemberPerformance } from "@/hooks/useReportData";

interface Props {
  data: TeamMemberPerformance[];
}

export function CompactTeamPerformance({ data }: Props) {
  // Show top 3 members in compact view
  const topMembers = data.slice(0, 3);

  return (
    <Card className="p-3 sm:p-4">
      <h3 className="text-sm font-semibold mb-2">Performance da Equipe</h3>
      <div className="space-y-2">
        {topMembers.map((member, index) => (
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
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-warning" />
                {member.storyPointsDelivered} pts
              </span>
            </div>
            <Progress value={member.completionRate} className="h-1" />
          </div>
        ))}
      </div>
    </Card>
  );
}
