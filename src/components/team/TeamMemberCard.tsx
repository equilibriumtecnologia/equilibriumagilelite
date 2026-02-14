import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Briefcase, CheckCircle2, ListTodo } from "lucide-react";
import type { TeamMember } from "@/hooks/useTeam";
import { ManageRoleDialog } from "./ManageRoleDialog";

interface TeamMemberCardProps {
  member: TeamMember;
  onUpdate?: () => void;
}

const roleLabels: Record<string, string> = {
  master: "Master",
  admin: "Admin",
  user: "Usuário",
};

const roleColors: Record<string, string> = {
  master: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  admin: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  user: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

export function TeamMemberCard({ member, onUpdate }: TeamMemberCardProps) {
  const completionRate =
    member.task_count > 0
      ? (member.completed_task_count / member.task_count) * 100
      : 0;

  const primaryRole = member.roles[0]?.role || "user";

  return (
    <Card className="p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
              <AvatarFallback className="text-sm sm:text-lg">
                {(() => {
                  const names = member.full_name.split(" ");
                  const firstName = names[0]?.[0] || "";
                  const lastName = names[names.length - 1]?.[0] || "";
                  return (firstName + lastName).toUpperCase();
                })()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-lg truncate">{member.full_name}</h3>
              <Badge variant="outline" className={roleColors[primaryRole]}>
                {roleLabels[primaryRole]}
              </Badge>
            </div>
          </div>
          <ManageRoleDialog member={member} onSuccess={onUpdate} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold">{member.project_count}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Projetos</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <ListTodo className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold">{member.task_count}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Tarefas</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-success" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold">
                {member.completed_task_count}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Concluídas</p>
            </div>
          </div>
        </div>

        {/* Completion Rate */}
        {member.task_count > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Taxa de Conclusão</span>
              <span className="font-medium">{Math.round(completionRate)}%</span>
            </div>
            <Progress value={completionRate} />
          </div>
        )}
      </div>
    </Card>
  );
}
