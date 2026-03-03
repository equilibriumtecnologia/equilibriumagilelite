import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle, ArrowRight, UserPlus, UserMinus, AlertTriangle,
  Calendar, Pencil, FileText, MessageSquare, Plus, Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ActivityEntry } from "@/hooks/useActivityFeed";

const actionConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  created: { label: "criou", icon: Plus, color: "text-green-500" },
  status_changed: { label: "alterou status", icon: ArrowRight, color: "text-blue-500" },
  assigned: { label: "atribuiu", icon: UserPlus, color: "text-violet-500" },
  unassigned: { label: "removeu atribuição", icon: UserMinus, color: "text-orange-500" },
  priority_changed: { label: "alterou prioridade", icon: AlertTriangle, color: "text-yellow-500" },
  due_date_changed: { label: "alterou prazo", icon: Calendar, color: "text-cyan-500" },
  title_changed: { label: "renomeou", icon: Pencil, color: "text-muted-foreground" },
  description_changed: { label: "editou descrição", icon: FileText, color: "text-muted-foreground" },
  comment_added: { label: "comentou em", icon: MessageSquare, color: "text-primary" },
  deleted: { label: "excluiu", icon: Trash2, color: "text-destructive" },
};

const statusLabels: Record<string, string> = {
  todo: "A Fazer",
  in_progress: "Em Progresso",
  review: "Revisão",
  completed: "Concluída",
};

interface ActivityItemProps {
  activity: ActivityEntry;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const config = actionConfig[activity.action] || actionConfig.created;
  const Icon = config.icon;
  const userName = activity.user?.full_name || "Usuário";
  const taskTitle = activity.task?.title || "tarefa";
  const timeAgo = formatDistanceToNow(new Date(activity.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  const renderDetail = () => {
    if (activity.action === "status_changed") {
      return (
        <span className="text-xs text-muted-foreground">
          {statusLabels[activity.old_value || ""] || activity.old_value} →{" "}
          <strong className="text-foreground">{statusLabels[activity.new_value || ""] || activity.new_value}</strong>
        </span>
      );
    }
    if (activity.action === "comment_added" && activity.comment) {
      return (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 italic">
          "{activity.comment}"
        </p>
      );
    }
    if (activity.action === "priority_changed") {
      return (
        <span className="text-xs text-muted-foreground">
          {activity.old_value} → <strong className="text-foreground">{activity.new_value}</strong>
        </span>
      );
    }
    return null;
  };

  return (
    <div className="flex gap-3 py-3 border-b border-border/50 last:border-0">
      <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
        <AvatarImage src={activity.user?.avatar_url || undefined} />
        <AvatarFallback className="text-[10px]">
          {userName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-1.5 flex-wrap">
          <Icon className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${config.color}`} />
          <p className="text-sm">
            <strong className="font-medium">{userName}</strong>{" "}
            <span className="text-muted-foreground">{config.label}</span>{" "}
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal max-w-[200px] truncate inline">
              {taskTitle}
            </Badge>
          </p>
        </div>
        {renderDetail()}
        <span className="text-[11px] text-muted-foreground mt-0.5 block">{timeAgo}</span>
      </div>
    </div>
  );
}
