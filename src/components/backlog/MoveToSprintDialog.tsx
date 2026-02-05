import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTasks } from "@/hooks/useTasks";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type Sprint = Database["public"]["Tables"]["sprints"]["Row"];

interface MoveToSprintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskIds: string[];
  sprints: Sprint[];
  onSuccess?: () => void;
}

export function MoveToSprintDialog({
  open,
  onOpenChange,
  taskIds,
  sprints,
  onSuccess,
}: MoveToSprintDialogProps) {
  const [selectedSprintId, setSelectedSprintId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateTask } = useTasks();
  const { toast } = useToast();

  const handleMove = async () => {
    if (!selectedSprintId) return;

    setIsSubmitting(true);
    try {
      await Promise.all(
        taskIds.map((taskId) =>
          updateTask.mutateAsync({
            id: taskId,
            sprint_id: selectedSprintId,
          })
        )
      );

      toast({
        title: "Tarefas movidas",
        description: `${taskIds.length} tarefa(s) movida(s) para a sprint.`,
      });

      onOpenChange(false);
      setSelectedSprintId("");
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Erro ao mover tarefas",
        description: "Não foi possível mover as tarefas. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Mover para Sprint</DialogTitle>
          <DialogDescription>
            Selecione a sprint para mover {taskIds.length} tarefa(s).
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Select value={selectedSprintId} onValueChange={setSelectedSprintId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma sprint" />
            </SelectTrigger>
            <SelectContent>
              {sprints.map((sprint) => (
                <SelectItem key={sprint.id} value={sprint.id}>
                  <div className="flex items-center gap-2">
                    <span>{sprint.name}</span>
                    <Badge
                      variant={sprint.status === "active" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {sprint.status === "active" ? "Ativa" : "Planejamento"}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedSprintId && (
            <p className="text-sm text-muted-foreground mt-2">
              {(() => {
                const sprint = sprints.find((s) => s.id === selectedSprintId);
                if (!sprint) return null;
                return `${format(new Date(sprint.start_date), "dd/MM", { locale: ptBR })} - ${format(new Date(sprint.end_date), "dd/MM/yyyy", { locale: ptBR })}`;
              })()}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleMove}
            disabled={!selectedSprintId || isSubmitting}
          >
            {isSubmitting ? "Movendo..." : "Mover Tarefas"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
