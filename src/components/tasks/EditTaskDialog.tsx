import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import type { Tables } from "@/integrations/supabase/types";
import { useProject } from "@/hooks/useProject";
import { Label } from "@/components/ui/label";
import { StoryPointsSelector } from "./StoryPointsSelector";

const taskSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(200),
  description: z.string().max(1000).optional(),
  project_id: z.string().min(1, "Projeto é obrigatório"),
  status: z.enum(["todo", "in_progress", "review", "completed"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  due_date: z.date().optional(),
  assigned_to: z.string().optional(),
  status_comment: z.string().optional(),
  story_points: z.number().nullable().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface EditTaskDialogProps {
  task: Tables<"tasks">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditTaskDialog = ({
  task,
  open,
  onOpenChange,
}: EditTaskDialogProps) => {
  const { updateTask } = useTasks();
  const { projects } = useProjects();
  const [statusChanged, setStatusChanged] = useState(false);
  const [commentError, setCommentError] = useState("");

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task.title,
      description: task.description || "",
      project_id: task.project_id,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ? new Date(task.due_date) : undefined,
      assigned_to: task.assigned_to || "",
      status_comment: "",
      story_points: task.story_points,
    },
  });

  // Get selected project to fetch members
  const selectedProjectId = form.watch("project_id");
  const currentStatus = form.watch("status");
  const { project } = useProject(selectedProjectId || undefined);

  // Track if status changed
  useEffect(() => {
    const hasChanged = currentStatus !== task.status;
    setStatusChanged(hasChanged);
    if (!hasChanged) {
      setCommentError("");
    }
  }, [currentStatus, task.status]);

  useEffect(() => {
    if (open) {
      form.reset({
        title: task.title,
        description: task.description || "",
        project_id: task.project_id,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date ? new Date(task.due_date) : undefined,
        assigned_to: task.assigned_to || "",
        status_comment: "",
        story_points: task.story_points,
      });
      setStatusChanged(false);
      setCommentError("");
    }
  }, [open, task, form]);

  const onSubmit = async (data: TaskFormValues) => {
    // Validate comment if status changed
    if (statusChanged) {
      if (!data.status_comment?.trim()) {
        setCommentError("Comentário é obrigatório ao alterar o status");
        return;
      }
      if (data.status_comment.trim().length < 10) {
        setCommentError("Comentário deve ter pelo menos 10 caracteres");
        return;
      }
    }

    const updateData = {
      id: task.id,
      title: data.title,
      description: data.description || null,
      project_id: data.project_id,
      status: data.status,
      priority: data.priority,
      due_date: data.due_date ? format(data.due_date, "yyyy-MM-dd") : null,
      assigned_to: data.assigned_to || null,
      story_points: data.story_points ?? null,
      historyComment: statusChanged ? data.status_comment?.trim() : undefined,
    };

    await updateTask.mutateAsync(updateData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Atividade</DialogTitle>
          <DialogDescription>
            Atualize as informações da atividade
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da atividade" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a atividade"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Projeto</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um projeto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="todo">A Fazer</SelectItem>
                        <SelectItem value="in_progress">
                          Em Progresso
                        </SelectItem>
                        <SelectItem value="review">Em Revisão</SelectItem>
                        <SelectItem value="completed">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="assigned_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Atribuir para</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === "unassigned" ? "" : value)
                    }
                    value={field.value || "unassigned"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um membro (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unassigned">Não atribuído</SelectItem>
                      {project?.project_members?.map((member) => (
                        <SelectItem key={member.user_id} value={member.user_id}>
                          {member.profiles.full_name} (
                          {member.role === "owner" ? "Proprietário" : "Membro"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Vencimento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label>Story Points</Label>
              <div className="flex items-center gap-2">
                <StoryPointsSelector
                  value={form.watch("story_points") ?? null}
                  onChange={(value) => form.setValue("story_points", value)}
                />
                <span className="text-sm text-muted-foreground">
                  {form.watch("story_points") ? `${form.watch("story_points")} pontos` : "Não estimado"}
                </span>
              </div>
            </div>

            {statusChanged && (
              <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <Label htmlFor="status_comment" className="font-medium">
                    Comentário sobre a mudança de status{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                </div>
                <FormField
                  control={form.control}
                  name="status_comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          id="status_comment"
                          placeholder="Ex: Tarefa concluída após revisão do cliente..."
                          className={commentError ? "border-destructive" : ""}
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            if (commentError) setCommentError("");
                          }}
                        />
                      </FormControl>
                      {commentError && (
                        <p className="text-sm text-destructive">{commentError}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Mínimo de 10 caracteres - obrigatório ao alterar status
                      </p>
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateTask.isPending}>
                {updateTask.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
