import { ActivityItem } from "./ActivityItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Activity } from "lucide-react";
import type { ActivityEntry } from "@/hooks/useActivityFeed";

interface ActivityFeedProps {
  activities: ActivityEntry[];
  isLoading: boolean;
  maxHeight?: string;
}

export function ActivityFeed({ activities, isLoading, maxHeight = "600px" }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
        <Activity className="h-8 w-8" />
        <p className="text-sm">Nenhuma atividade registrada ainda.</p>
      </div>
    );
  }

  return (
    <ScrollArea style={{ maxHeight }} className="pr-2">
      <div className="space-y-0">
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </ScrollArea>
  );
}
