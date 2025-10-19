import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";
import { EditProjectDialog } from "./EditProjectDialog";
import { DeleteProjectDialog } from "./DeleteProjectDialog";

type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  category: Database["public"]["Tables"]["categories"]["Row"] | null;
  project_members: Array<{
    user_id: string;
    role: string;
    profiles: Database["public"]["Tables"]["profiles"]["Row"];
  }>;
  tasks: Database["public"]["Tables"]["tasks"]["Row"][];
};

interface ProjectCardProps {
  project: Project;
  onUpdate?: () => void;
}

const statusLabels: Record<string, string> = {
  planning: "Planejamento",
  active: "Ativo",
  on_hold: "Em Espera",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const statusColors: Record<string, string> = {
  planning: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  on_hold: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  completed: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

export function ProjectCard({ project, onUpdate }: ProjectCardProps) {
  const completedTasks = project.tasks?.filter((t) => t.status === "completed").length || 0;
  const totalTasks = project.tasks?.length || 0;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-lg">{project.name}</h3>
              <div className="flex items-center gap-1">
                <EditProjectDialog project={project} onSuccess={onUpdate} />
                <DeleteProjectDialog 
                  projectId={project.id} 
                  projectName={project.name}
                  onSuccess={onUpdate}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {project.description || "Sem descrição"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {project.category && (
            <Badge variant="outline" className="border">
              {project.category.name}
            </Badge>
          )}
          <Badge variant="outline" className={statusColors[project.status]}>
            {statusLabels[project.status]}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">
              {completedTasks}/{totalTasks} tarefas
            </span>
          </div>
          <Progress value={progress} />
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{project.project_members?.length || 0}</span>
          </div>

          {project.deadline && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(project.deadline), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </span>
            </div>
          )}
        </div>

        <div className="flex -space-x-2">
          {project.project_members?.slice(0, 3).map((member) => (
            <Avatar key={member.user_id} className="h-8 w-8 border-2 border-background">
              <AvatarFallback className="text-xs">
                {member.profiles.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
          {project.project_members && project.project_members.length > 3 && (
            <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center">
              <span className="text-xs font-medium">
                +{project.project_members.length - 3}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
