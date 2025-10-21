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
  const completionRate = member.task_count > 0 
    ? (member.completed_task_count / member.task_count) * 100 
    : 0;

  const primaryRole = member.roles[0]?.role || "user";

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="text-lg">
                {member.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{member.full_name}</h3>
              <Badge variant="outline" className={roleColors[primaryRole]}>
                {roleLabels[primaryRole]}
              </Badge>
            </div>
          </div>
          <ManageRoleDialog member={member} onSuccess={onUpdate} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{member.project_count}</p>
              <p className="text-xs text-muted-foreground">Projetos</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
              <ListTodo className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{member.task_count}</p>
              <p className="text-xs text-muted-foreground">Tarefas</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{member.completed_task_count}</p>
              <p className="text-xs text-muted-foreground">Concluídas</p>
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
