import { useState } from "react";
import { useSubTasks } from "@/hooks/useSubTasks";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SubTasksListProps {
  taskId: string;
}

export function SubTasksList({ taskId }: SubTasksListProps) {
  const {
    subTasks,
    isLoading,
    createSubTask,
    toggleSubTask,
    deleteSubTask,
    completedCount,
    totalCount,
    progress,
  } = useSubTasks(taskId);

  const [newSubTaskTitle, setNewSubTaskTitle] = useState("");
  const [confirmingToggle, setConfirmingToggle] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  const handleAddSubTask = () => {
    if (!newSubTaskTitle.trim()) return;
    createSubTask.mutate({ title: newSubTaskTitle.trim() });
    setNewSubTaskTitle("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddSubTask();
    }
  };

  const handleToggleConfirm = () => {
    if (confirmingToggle) {
      const subTask = subTasks.find((st) => st.id === confirmingToggle);
      if (subTask) {
        toggleSubTask.mutate({
          subTaskId: confirmingToggle,
          isCompleted: !subTask.is_completed,
        });
      }
      setConfirmingToggle(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (confirmingDelete) {
      deleteSubTask.mutate(confirmingDelete);
      setConfirmingDelete(null);
    }
  };

  const getSubTaskToToggle = () => {
    return subTasks.find((st) => st.id === confirmingToggle);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-muted animate-pulse rounded" />
        <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress header */}
      {totalCount > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso do checklist</span>
            <span className="font-medium">
              {completedCount}/{totalCount} ({progress}%)
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Sub-tasks list */}
      <div className="space-y-2">
        {subTasks.map((subTask) => (
          <div
            key={subTask.id}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
              subTask.is_completed
                ? "bg-muted/50 border-muted"
                : "bg-background border-border hover:border-primary/30"
            }`}
          >
            <Checkbox
              checked={subTask.is_completed}
              onCheckedChange={() => setConfirmingToggle(subTask.id)}
              className="h-5 w-5"
            />
            <span
              className={`flex-1 text-sm ${
                subTask.is_completed
                  ? "line-through text-muted-foreground"
                  : "text-foreground"
              }`}
            >
              {subTask.title}
            </span>
            {subTask.is_completed && (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => setConfirmingDelete(subTask.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add new sub-task */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Nova sub-tarefa..."
          value={newSubTaskTitle}
          onChange={(e) => setNewSubTaskTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button
          onClick={handleAddSubTask}
          disabled={!newSubTaskTitle.trim() || createSubTask.isPending}
          size="icon"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Toggle confirmation dialog */}
      <AlertDialog open={!!confirmingToggle} onOpenChange={() => setConfirmingToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {getSubTaskToToggle()?.is_completed
                ? "Reabrir sub-tarefa?"
                : "Confirmar conclusão"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {getSubTaskToToggle()?.is_completed
                ? "Deseja marcar esta sub-tarefa como pendente novamente?"
                : "Você confirma que esta sub-tarefa foi concluída? Esta ação será registrada."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleConfirm}>
              {getSubTaskToToggle()?.is_completed ? "Reabrir" : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!confirmingDelete} onOpenChange={() => setConfirmingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover sub-tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A sub-tarefa será permanentemente removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
