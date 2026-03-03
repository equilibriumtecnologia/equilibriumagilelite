import { AlertTriangle, AlertOctagon, Clock, TrendingDown, UserX, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Bottleneck } from "@/hooks/useBottleneckDetection";

interface BottleneckAlertsProps {
  bottlenecks: Bottleneck[];
  projectName?: string;
}

const typeIcons = {
  wip_exceeded: AlertTriangle,
  stalled_tasks: Clock,
  no_exit: TrendingDown,
  overloaded_assignee: UserX,
};

const typeLabels = {
  wip_exceeded: "WIP Excedido",
  stalled_tasks: "Tarefas Paradas",
  no_exit: "Sem Saída",
  overloaded_assignee: "Sobrecarga",
};

export function BottleneckAlerts({ bottlenecks, projectName }: BottleneckAlertsProps) {
  const [expanded, setExpanded] = useState(false);

  if (bottlenecks.length === 0) return null;

  const criticalCount = bottlenecks.filter((b) => b.severity === "critical").length;
  const warningCount = bottlenecks.filter((b) => b.severity === "warning").length;
  const shown = expanded ? bottlenecks : bottlenecks.slice(0, 3);

  return (
    <Card className={cn(
      "p-4 sm:p-5 border-l-4",
      criticalCount > 0 ? "border-l-destructive" : "border-l-warning"
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {criticalCount > 0 ? (
            <AlertOctagon className="h-5 w-5 text-destructive" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-warning" />
          )}
          <h3 className="font-semibold text-sm sm:text-base">
            Gargalos Detectados
            {projectName && <span className="text-muted-foreground font-normal"> · {projectName}</span>}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          {criticalCount > 0 && (
            <Badge variant="destructive" className="text-[10px] h-5">
              {criticalCount} crítico{criticalCount > 1 ? "s" : ""}
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="outline" className="text-[10px] h-5 border-warning text-warning">
              {warningCount} alerta{warningCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {shown.map((b) => {
          const Icon = typeIcons[b.type];
          return (
            <div
              key={b.id}
              className={cn(
                "flex items-start gap-3 p-2.5 rounded-lg text-sm",
                b.severity === "critical"
                  ? "bg-destructive/5 border border-destructive/20"
                  : "bg-warning/5 border border-warning/20"
              )}
            >
              <Icon className={cn(
                "h-4 w-4 mt-0.5 shrink-0",
                b.severity === "critical" ? "text-destructive" : "text-warning"
              )} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-xs sm:text-sm">{b.title}</span>
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                    {typeLabels[b.type]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{b.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {bottlenecks.length > 3 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="mt-2 w-full text-xs text-muted-foreground"
        >
          {expanded ? (
            <>Mostrar menos <ChevronUp className="h-3 w-3 ml-1" /></>
          ) : (
            <>Ver {bottlenecks.length - 3} mais <ChevronDown className="h-3 w-3 ml-1" /></>
          )}
        </Button>
      )}
    </Card>
  );
}
