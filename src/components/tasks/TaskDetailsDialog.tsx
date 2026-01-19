import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  Timer, 
  User, 
  FileText, 
  CheckSquare,
  History 
} from "lucide-react";
import { SubTasksList } from "./SubTasksList";
import { TaskHistoryPanel } from "./TaskHistoryPanel";
import { TaskTimeMetrics } from "./TaskTimeMetrics";
import type { Database, Tables } from "@/integrations/supabase/types";
import { useSubTasks } from "@/hooks/useSubTasks";

type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
  assigned_to_profile?: Database["public"]["Tables"]["profiles"]["Row"] | null;
  created_by_profile?: Database["public"]["Tables"]["profiles"]["Row"];
};

interface TaskDetailsDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const priorityColors: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  urgent: "bg-red-500/10 text-red-500 border-red-500/20",
};

const priorityLabels: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

const statusLabels: Record<string, string> = {
  todo: "A Fazer",
  in_progress: "Em Progresso",
  review: "Em Revisão",
  completed: "Concluído",
};

const statusColors: Record<string, string> = {
  todo: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  review: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
};

export function TaskDetailsDialog({ task, open, onOpenChange }: TaskDetailsDialogProps) {
  const { totalCount, completedCount, progress } = useSubTasks(task?.id);

  if (!task) return null;

  const getInitials = (name: string) => {
    const names = name.split(" ");
    const firstName = names[0]?.[0] || "";
    const lastName = names[names.length - 1]?.[0] || "";
    return (firstName + lastName).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <DialogTitle className="text-xl mb-2">{task.title}</DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={statusColors[task.status]}>
                  {statusLabels[task.status]}
                </Badge>
                <Badge variant="outline" className={priorityColors[task.priority]}>
                  {priorityLabels[task.priority]}
                </Badge>
                {totalCount > 0 && (
                  <Badge variant="outline" className="bg-muted">
                    <CheckSquare className="h-3 w-3 mr-1" />
                    {completedCount}/{totalCount}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Detalhes
              </TabsTrigger>
              <TabsTrigger value="subtasks" className="flex items-center gap-1">
                <CheckSquare className="h-4 w-4" />
                Checklist
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-1">
                <History className="h-4 w-4" />
                Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4 space-y-4">
              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Descrição</h4>
                <p className="text-sm">
                  {task.description || "Sem descrição"}
                </p>
              </div>

              <Separator />

              {/* Time Metrics */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Métricas de Tempo</h4>
                <TaskTimeMetrics task={task as Tables<"tasks">} compact={false} />
              </div>

              <Separator />

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Assigned to */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Responsável</span>
                  </div>
                  {task.assigned_to_profile ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {getInitials(task.assigned_to_profile.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{task.assigned_to_profile.full_name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Não atribuído</span>
                  )}
                </div>

                {/* Due date */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Prazo</span>
                  </div>
                  <span className="text-sm">
                    {task.due_date
                      ? format(new Date(task.due_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                      : "Sem prazo definido"}
                  </span>
                </div>

                {/* Created at */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Criada em</span>
                  </div>
                  <span className="text-sm">
                    {format(new Date(task.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>

                {/* Updated at */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Timer className="h-4 w-4" />
                    <span>Atualizada em</span>
                  </div>
                  <span className="text-sm">
                    {format(new Date(task.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              </div>

              {/* Created by */}
              {task.created_by_profile && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Criada por</span>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {getInitials(task.created_by_profile.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{task.created_by_profile.full_name}</span>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="subtasks" className="mt-4">
              <SubTasksList taskId={task.id} />
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <TaskHistoryPanel taskId={task.id} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
