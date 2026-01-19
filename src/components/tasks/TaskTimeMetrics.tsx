import { Clock, Timer, History, TrendingUp } from "lucide-react";
import { useTaskMetrics, formatDuration, getStatusLabel } from "@/hooks/useTaskMetrics";
import { useTaskHistory } from "@/hooks/useTaskHistory";
import type { Tables } from "@/integrations/supabase/types";
import { useEffect, useState } from "react";

interface TaskTimeMetricsProps {
  task: Tables<"tasks">;
  compact?: boolean;
}

export function TaskTimeMetrics({ task, compact = false }: TaskTimeMetricsProps) {
  const { history } = useTaskHistory(task.id);
  const metrics = useTaskMetrics(task, history);
  const [, setTick] = useState(0);

  // Update every minute to keep times current
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!metrics) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1" title="Tempo total">
          <Clock className="h-3 w-3" />
          <span>{formatDuration(metrics.totalTime)}</span>
        </div>
        <div className="flex items-center gap-1" title={`Tempo em "${getStatusLabel(metrics.currentStatus)}"`}>
          <Timer className="h-3 w-3" />
          <span>{formatDuration(metrics.currentStepTime)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2 text-sm font-medium">
        <TrendingUp className="h-4 w-4 text-primary" />
        <span>Métricas de Tempo</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>Tempo Total</span>
          </div>
          <p className="text-lg font-semibold">{formatDuration(metrics.totalTime)}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Timer className="h-3.5 w-3.5" />
            <span>Em "{getStatusLabel(metrics.currentStatus)}"</span>
          </div>
          <p className="text-lg font-semibold">{formatDuration(metrics.currentStepTime)}</p>
        </div>
      </div>

      {Object.keys(metrics.statusDurations).length > 1 && (
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <History className="h-3.5 w-3.5" />
            <span>Tempo por Status</span>
          </div>
          <div className="space-y-1.5">
            {Object.entries(metrics.statusDurations).map(([status, duration]) => {
              const percentage = Math.round((duration / metrics.totalTime) * 100);
              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{getStatusLabel(status)}</span>
                    <span className="font-medium">{formatDuration(duration)}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
