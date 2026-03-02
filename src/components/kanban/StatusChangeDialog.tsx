import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, MessageSquare, UserPlus } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type TaskStatus = "todo" | "in_progress" | "review" | "completed";

interface StatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  oldStatus: TaskStatus;
  newStatus: TaskStatus;
  onConfirm: (comment: string, newAssignee?: string | null) => void;
  isPending?: boolean;
  members?: { user_id: string; profiles: Database["public"]["Tables"]["profiles"]["Row"] }[];
  currentAssignee?: string | null;
}

const statusLabels: Record<TaskStatus, { label: string; color: string }> = {
  todo: { label: "A Fazer", color: "bg-blue-500" },
  in_progress: { label: "Em Progresso", color: "bg-yellow-500" },
  review: { label: "Em Revisão", color: "bg-purple-500" },
  completed: { label: "Concluído", color: "bg-green-500" },
};

export function StatusChangeDialog({
  open,
  onOpenChange,
  taskTitle,
  oldStatus,
  newStatus,
  onConfirm,
  isPending = false,
  members = [],
  currentAssignee,
}: StatusChangeDialogProps) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("keep");

  const handleConfirm = () => {
    if (!comment.trim()) {
      setError("Comentário é obrigatório ao alterar o status");
      return;
    }
    if (comment.trim().length < 10) {
      setError("Comentário deve ter pelo menos 10 caracteres");
      return;
    }
    const newAssignee = selectedAssignee === "keep" 
      ? undefined 
      : selectedAssignee === "unassigned" 
        ? null 
        : selectedAssignee;
    onConfirm(comment.trim(), newAssignee);
    setComment("");
    setError("");
    setSelectedAssignee("keep");
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setComment("");
      setError("");
      setSelectedAssignee("keep");
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Confirmar Mudança de Status
          </DialogTitle>
          <DialogDescription>
            Descreva o motivo da alteração de status para manter o histórico da
            tarefa atualizado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-sm text-muted-foreground">Tarefa</Label>
            <p className="font-medium">{taskTitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={`${statusLabels[oldStatus].color} text-white`}
            >
              {statusLabels[oldStatus].label}
            </Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Badge
              variant="secondary"
              className={`${statusLabels[newStatus].color} text-white`}
            >
              {statusLabels[newStatus].label}
            </Badge>
          </div>

          {/* Optional assignee change */}
          {members.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                <Label>Reatribuir tarefa (opcional)</Label>
              </div>
              <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="Manter responsável atual" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keep">Manter responsável atual</SelectItem>
                  <SelectItem value="unassigned">Remover atribuição</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.profiles.full_name}
                      {member.user_id === currentAssignee ? " (atual)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="comment">
              Comentário <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="comment"
              placeholder="Ex: Tarefa concluída após revisão do cliente, todos os requisitos foram atendidos..."
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                if (error) setError("");
              }}
              className={error ? "border-destructive" : ""}
              rows={3}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground">
              Mínimo de 10 caracteres
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Atualizando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
