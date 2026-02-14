import { Bell, Check, CheckCheck, Trash2, MessageSquare, UserPlus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const typeIcons: Record<string, React.ReactNode> = {
  mention: <MessageSquare className="h-4 w-4 text-blue-500" />,
  comment: <MessageSquare className="h-4 w-4 text-green-500" />,
  assignment: <UserPlus className="h-4 w-4 text-purple-500" />,
  status_change: <ArrowRight className="h-4 w-4 text-orange-500" />,
  general: <Bell className="h-4 w-4 text-muted-foreground" />,
};

function NotificationItem({
  notification,
  onRead,
  onDelete,
  onNavigate,
}: {
  notification: Notification;
  onRead: () => void;
  onDelete: () => void;
  onNavigate: () => void;
}) {
  return (
    <div
      className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
        notification.is_read
          ? "bg-background hover:bg-muted/50"
          : "bg-primary/5 hover:bg-primary/10 border-l-2 border-primary"
      }`}
      onClick={() => {
        if (!notification.is_read) onRead();
        onNavigate();
      }}
    >
      <div className="flex-shrink-0 mt-0.5">
        {notification.triggered_by_profile ? (
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {notification.triggered_by_profile.full_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            {typeIcons[notification.type] || typeIcons.general}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{notification.title}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
            locale: ptBR,
          })}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function NotificationsPopover() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const navigate = useNavigate();

  const handleNavigate = (notification: Notification) => {
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
              variant="destructive"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] sm:w-[380px] p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">Notificações</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => markAllAsRead.mutate()}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <ScrollArea className="h-[360px]">
          {notifications.length > 0 ? (
            <div className="p-2 space-y-1">
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={() => markAsRead.mutate(n.id)}
                  onDelete={() => deleteNotification.mutate(n.id)}
                  onNavigate={() => handleNavigate(n)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
