import { useTaskHistory } from "@/hooks/useTaskHistory";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  MessageSquare, 
  Clock, 
  User, 
  ArrowRight,
  Calendar,
  Tag,
  FileText,
  Send,
  Loader2
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { MentionTextarea } from "@/components/comments/MentionTextarea";
import { useMentions, notifyMentions } from "@/hooks/useMentions";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface TaskHistoryPanelProps {
  taskId: string;
  projectId?: string;
  taskTitle?: string;
}

const actionLabels: Record<string, string> = {
  created: "criou a tarefa",
  status_changed: "alterou o status",
  assigned: "atribuiu a tarefa",
  unassigned: "removeu atribuição",
  priority_changed: "alterou a prioridade",
  due_date_changed: "alterou a data limite",
  title_changed: "alterou o título",
  description_changed: "alterou a descrição",
  comment_added: "adicionou um comentário",
  deleted: "excluiu a tarefa",
};

const actionIcons: Record<string, React.ReactNode> = {
  created: <FileText className="h-4 w-4" />,
  status_changed: <ArrowRight className="h-4 w-4" />,
  assigned: <User className="h-4 w-4" />,
  unassigned: <User className="h-4 w-4" />,
  priority_changed: <Tag className="h-4 w-4" />,
  due_date_changed: <Calendar className="h-4 w-4" />,
  title_changed: <FileText className="h-4 w-4" />,
  description_changed: <FileText className="h-4 w-4" />,
  comment_added: <MessageSquare className="h-4 w-4" />,
  deleted: <FileText className="h-4 w-4" />,
};

const statusLabels: Record<string, string> = {
  todo: "A Fazer",
  in_progress: "Em Progresso",
  review: "Em Revisão",
  done: "Concluído",
};

const priorityLabels: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

/**
 * Render comment text with highlighted @mentions
 */
function renderCommentWithMentions(text: string) {
  const parts = text.split(/(@"[^"]+"|@\S+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      return (
        <span key={i} className="text-primary font-medium bg-primary/10 rounded px-0.5">
          {part}
        </span>
      );
    }
    return part;
  });
}

export function TaskHistoryPanel({ taskId, projectId, taskTitle }: TaskHistoryPanelProps) {
  const { user } = useAuth();
  const { history, isLoading, addComment, getStatusDurations } = useTaskHistory(taskId);
  const { mentionUsers, loadUsers } = useMentions(projectId);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;
    
    setIsSubmitting(true);
    try {
      await addComment.mutateAsync({ taskId, comment: newComment });
      
      // Send mention notifications
      if (mentionUsers.length > 0 && taskTitle) {
        await notifyMentions(newComment, mentionUsers, taskId, taskTitle, user.id);
      }
      
      setNewComment("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusDurations = getStatusDurations();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Time spent in each status */}
      {Object.keys(statusDurations).length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Tempo por Status
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(statusDurations).map(([status, duration]) => (
              <div 
                key={status} 
                className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm"
              >
                <span className="text-muted-foreground">
                  {statusLabels[status] || status}
                </span>
                <span className="font-medium">{formatDuration(duration)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Add comment with @mentions */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Adicionar Comentário
          <span className="text-xs text-muted-foreground font-normal">
            (use @ para mencionar)
          </span>
        </h4>
        <div className="flex gap-2">
          <div className="flex-1">
            <MentionTextarea
              value={newComment}
              onChange={setNewComment}
              placeholder="Digite seu comentário... Use @nome para mencionar"
              users={mentionUsers}
              onFocus={loadUsers}
            />
          </div>
          <Button 
            size="icon" 
            onClick={handleAddComment}
            disabled={!newComment.trim() || isSubmitting}
            className="self-end"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <Separator />

      {/* History timeline */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Histórico de Atividades</h4>
        <ScrollArea className="h-[300px] pr-4">
          {history && history.length > 0 ? (
            <div className="space-y-4">
              {history.map((entry) => (
                <div key={entry.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={entry.user?.avatar_url || ""} />
                    <AvatarFallback className="text-xs">
                      {entry.user?.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">
                        {entry.user?.full_name || "Usuário"}
                      </span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        {actionIcons[entry.action]}
                        {actionLabels[entry.action] || entry.action}
                      </span>
                    </div>
                    
                    {/* Show value changes */}
                    {entry.old_value && entry.new_value && (
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="line-through">
                          {entry.action === "status_changed" 
                            ? statusLabels[entry.old_value] 
                            : entry.action === "priority_changed"
                            ? priorityLabels[entry.old_value]
                            : entry.old_value}
                        </span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="font-medium text-foreground">
                          {entry.action === "status_changed" 
                            ? statusLabels[entry.new_value] 
                            : entry.action === "priority_changed"
                            ? priorityLabels[entry.new_value]
                            : entry.new_value}
                        </span>
                      </div>
                    )}

                    {/* Show comment with highlighted mentions */}
                    {entry.comment && (
                      <div className="p-2 rounded-md bg-muted/50 text-sm whitespace-pre-wrap">
                        {renderCommentWithMentions(entry.comment)}
                      </div>
                    )}

                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                      {" · "}
                      {format(new Date(entry.created_at), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum histórico disponível.
            </p>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
