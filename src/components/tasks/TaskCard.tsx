import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, User, MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditTaskDialog } from "./EditTaskDialog";
import { DeleteTaskDialog } from "./DeleteTaskDialog";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks"> & {
  assigned_user?: Tables<"profiles"> | null;
  assigned_to_profile?: Tables<"profiles"> | null;
  project?: Tables<"projects"> | null;
};

interface TaskCardProps {
  task: Task;
}

const statusConfig = {
  todo: { label: "A Fazer", variant: "secondary" as const },
  in_progress: { label: "Em Progresso", variant: "default" as const },
  review: { label: "Em Revisão", variant: "outline" as const },
  completed: { label: "Concluída", variant: "default" as const },
};

const priorityConfig = {
  low: { label: "Baixa", variant: "secondary" as const },
  medium: { label: "Média", variant: "default" as const },
  high: { label: "Alta", variant: "destructive" as const },
  urgent: { label: "Urgente", variant: "destructive" as const },
};

export const TaskCard = ({ task }: TaskCardProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Support both assigned_user and assigned_to_profile for compatibility
  const assignedUser = task.assigned_user || task.assigned_to_profile;

  return (
    <>
      <Card className="p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{task.title}</h3>
                {task.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsDeleteOpen(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={statusConfig[task.status].variant}>
                {statusConfig[task.status].label}
              </Badge>
              <Badge variant={priorityConfig[task.priority].variant}>
                {priorityConfig[task.priority].label}
              </Badge>

              {task.project && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <span>{task.project.name}</span>
                </div>
              )}

              {task.due_date && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {format(new Date(task.due_date), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
              )}

              {assignedUser ? (
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={assignedUser.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {(() => {
                        const names = assignedUser.full_name.split(" ");
                        const firstName = names[0]?.[0] || "";
                        const lastName = names[names.length - 1]?.[0] || "";
                        return (firstName + lastName).toUpperCase();
                      })()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    {assignedUser.full_name}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span>Não atribuída</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <EditTaskDialog
        task={task}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
      <DeleteTaskDialog
        taskId={task.id}
        taskTitle={task.title}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </>
  );
};
