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
import { useSprints } from "@/hooks/useSprints";
import { Database } from "@/integrations/supabase/types";

type Sprint = Database["public"]["Tables"]["sprints"]["Row"];

interface DeleteSprintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprint: Sprint;
}

export function DeleteSprintDialog({
  open,
  onOpenChange,
  sprint,
}: DeleteSprintDialogProps) {
  const { deleteSprint } = useSprints(sprint.project_id);

  const handleDelete = async () => {
    await deleteSprint.mutateAsync(sprint.id);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Sprint</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a sprint "{sprint.name}"? 
            As tarefas associadas não serão excluídas, mas perderão a associação com esta sprint.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
