import { AlertTriangle, AlertOctagon, Clock, TrendingDown, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Bottleneck } from "@/hooks/useBottleneckDetection";

interface BottleneckIndicatorProps {
  bottlenecks: Bottleneck[];
}

const typeIcons = {
  wip_exceeded: AlertTriangle,
  stalled_tasks: Clock,
  no_exit: TrendingDown,
  overloaded_assignee: UserX,
};

export function BottleneckIndicator({ bottlenecks }: BottleneckIndicatorProps) {
  if (bottlenecks.length === 0) return null;

  const hasCritical = bottlenecks.some((b) => b.severity === "critical");
  const Icon = hasCritical ? AlertOctagon : AlertTriangle;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "gap-1 cursor-help animate-pulse",
              hasCritical
                ? "border-destructive bg-destructive/10 text-destructive"
                : "border-warning bg-warning/10 text-warning"
            )}
          >
            <Icon className="h-3 w-3" />
            <span className="text-[10px]">{bottlenecks.length}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1.5">
            <p className="font-semibold text-xs">
              {hasCritical ? "⚠️ Gargalos Críticos" : "⚡ Alertas de Gargalo"}
            </p>
            {bottlenecks.map((b) => {
              const BIcon = typeIcons[b.type];
              return (
                <div key={b.id} className="flex items-start gap-1.5 text-xs">
                  <BIcon className={cn(
                    "h-3 w-3 mt-0.5 shrink-0",
                    b.severity === "critical" ? "text-destructive" : "text-warning"
                  )} />
                  <span>{b.description}</span>
                </div>
              );
            })}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
