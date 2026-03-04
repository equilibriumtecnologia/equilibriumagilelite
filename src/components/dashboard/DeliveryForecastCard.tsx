import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarClock, TrendingUp, Target, Gauge } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useDeliveryForecast } from "@/hooks/useDeliveryForecast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function DeliveryForecastCard() {
  const { projects } = useProjects();
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const projectId = selectedProject === "all" ? undefined : selectedProject;
  const { forecast, isLoading } = useDeliveryForecast(projectId);

  if (isLoading) return null;
  if (forecast.totalPoints === 0) return null;

  const formatDate = (d: Date | null) =>
    d ? format(d, "dd MMM yyyy", { locale: ptBR }) : "—";

  return (
    <Card className="p-4 sm:p-6 border-border">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-base sm:text-xl font-semibold flex items-center gap-2">
          <CalendarClock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Previsão de Entrega
        </h2>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-full sm:w-[180px] h-8 text-xs">
            <SelectValue placeholder="Projeto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Projetos</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>{forecast.completedPoints} / {forecast.totalPoints} pontos</span>
          <span className="font-medium text-foreground">{forecast.progressPercent}%</span>
        </div>
        <Progress value={forecast.progressPercent} className="h-2.5" />
      </div>

      {!forecast.hasEnoughData ? (
        <p className="text-xs text-muted-foreground text-center py-3">
          São necessárias pelo menos 2 sprints concluídas com velocity para gerar previsões.
        </p>
      ) : forecast.remainingPoints <= 0 ? (
        <div className="text-center py-3">
          <p className="text-sm font-medium text-success">✅ Todas as tarefas com pontos foram concluídas!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Velocity info */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5" />
              <span>Velocity média: <strong className="text-foreground">{forecast.avgVelocity}</strong> pts/sprint</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-3.5 w-3.5" />
              <span>Restam: <strong className="text-foreground">{forecast.remainingPoints}</strong> pts</span>
            </div>
          </div>

          {/* Date estimates */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-success/10 rounded-lg p-2.5 text-center">
              <p className="text-[10px] uppercase tracking-wider text-success font-medium mb-1">Otimista</p>
              <p className="text-xs font-semibold">{formatDate(forecast.estimatedOptimistic)}</p>
              <p className="text-[10px] text-muted-foreground">{forecast.sprintsRemaining.optimistic} sprint(s)</p>
            </div>
            <div className="bg-primary/10 rounded-lg p-2.5 text-center">
              <p className="text-[10px] uppercase tracking-wider text-primary font-medium mb-1">Realista</p>
              <p className="text-xs font-semibold">{formatDate(forecast.estimatedRealistic)}</p>
              <p className="text-[10px] text-muted-foreground">{forecast.sprintsRemaining.realistic} sprint(s)</p>
            </div>
            <div className="bg-destructive/10 rounded-lg p-2.5 text-center">
              <p className="text-[10px] uppercase tracking-wider text-destructive font-medium mb-1">Pessimista</p>
              <p className="text-xs font-semibold">{formatDate(forecast.estimatedPessimistic)}</p>
              <p className="text-[10px] text-muted-foreground">{forecast.sprintsRemaining.pessimistic} sprint(s)</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
