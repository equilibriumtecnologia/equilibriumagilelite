import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CalendarClock, TrendingUp, Target, Gauge, ArrowRight } from "lucide-react";
import { useDeliveryForecast } from "@/hooks/useDeliveryForecast";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface Props {
  projectId?: string;
}

export function DeliveryForecastReport({ projectId }: Props) {
  const { forecast, isLoading } = useDeliveryForecast(projectId);

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Carregando dados...</div>;
  }

  if (forecast.totalPoints === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhuma tarefa com story points encontrada. Atribua pontos às tarefas para gerar previsões.
        </CardContent>
      </Card>
    );
  }

  if (!forecast.hasEnoughData) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          São necessárias pelo menos 2 sprints concluídas com velocity registrada para gerar previsões de entrega.
        </CardContent>
      </Card>
    );
  }

  if (forecast.remainingPoints <= 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-lg font-medium text-success">✅ Todas as tarefas com pontos foram concluídas!</p>
          <p className="text-sm text-muted-foreground mt-2">
            {forecast.completedPoints} story points entregues no total.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (d: Date | null) =>
    d ? format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "—";

  const formatShortDate = (d: Date | null) =>
    d ? format(d, "dd MMM", { locale: ptBR }) : "—";

  const today = new Date();
  const daysUntil = (d: Date | null) => (d ? differenceInDays(d, today) : 0);

  // Build projection chart data
  const buildProjectionData = () => {
    const data: { sprint: string; optimistic: number; realistic: number; pessimistic: number }[] = [];
    const maxSprints = forecast.sprintsRemaining.pessimistic + 1;
    const remaining = forecast.remainingPoints;

    for (let i = 0; i <= maxSprints; i++) {
      const label = i === 0 ? "Agora" : `Sprint +${i}`;
      data.push({
        sprint: label,
        optimistic: Math.max(0, remaining - forecast.maxVelocity * i),
        realistic: Math.max(0, remaining - forecast.avgVelocity * i),
        pessimistic: Math.max(0, remaining - forecast.minVelocity * i),
      });
    }
    return data;
  };

  const chartData = buildProjectionData();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
            <Target className="h-3.5 w-3.5" />
            Total de Pontos
          </div>
          <p className="text-2xl font-bold">{forecast.totalPoints}</p>
          <div className="mt-2">
            <Progress value={forecast.progressPercent} className="h-1.5" />
            <p className="text-xs text-muted-foreground mt-1">{forecast.progressPercent}% concluído</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
            <ArrowRight className="h-3.5 w-3.5" />
            Pontos Restantes
          </div>
          <p className="text-2xl font-bold">{forecast.remainingPoints}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {forecast.completedPoints} entregues
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
            <Gauge className="h-3.5 w-3.5" />
            Velocity Média
          </div>
          <p className="text-2xl font-bold">{forecast.avgVelocity}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Min: {forecast.minVelocity} | Max: {forecast.maxVelocity}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
            <CalendarClock className="h-3.5 w-3.5" />
            Duração Média Sprint
          </div>
          <p className="text-2xl font-bold">{forecast.avgSprintDays} dias</p>
          <p className="text-xs text-muted-foreground mt-1">
            ~{forecast.sprintsRemaining.realistic} sprint(s) restante(s)
          </p>
        </Card>
      </div>

      {/* Projection Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Projeção de Burn-down
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] sm:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="sprint" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={40} label={{ value: "Story Points", angle: -90, position: "insideLeft", style: { fontSize: 11 } }} />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="pessimistic"
                  name="Pessimista"
                  stroke="hsl(var(--destructive))"
                  fill="hsl(var(--destructive))"
                  fillOpacity={0.1}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
                <Area
                  type="monotone"
                  dataKey="realistic"
                  name="Realista"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="optimistic"
                  name="Otimista"
                  stroke="hsl(var(--success))"
                  fill="hsl(var(--success))"
                  fillOpacity={0.1}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Date Estimates */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-success/30 bg-success/5">
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider text-success font-semibold mb-2">🟢 Cenário Otimista</p>
            <p className="text-lg font-bold">{formatDate(forecast.estimatedOptimistic)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {daysUntil(forecast.estimatedOptimistic)} dias · {forecast.sprintsRemaining.optimistic} sprint(s)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Velocity: {forecast.maxVelocity} pts/sprint
            </p>
          </div>
        </Card>

        <Card className="p-5 border-primary/30 bg-primary/5">
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-2">🔵 Cenário Realista</p>
            <p className="text-lg font-bold">{formatDate(forecast.estimatedRealistic)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {daysUntil(forecast.estimatedRealistic)} dias · {forecast.sprintsRemaining.realistic} sprint(s)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Velocity: {forecast.avgVelocity} pts/sprint
            </p>
          </div>
        </Card>

        <Card className="p-5 border-destructive/30 bg-destructive/5">
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider text-destructive font-semibold mb-2">🔴 Cenário Pessimista</p>
            <p className="text-lg font-bold">{formatDate(forecast.estimatedPessimistic)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {daysUntil(forecast.estimatedPessimistic)} dias · {forecast.sprintsRemaining.pessimistic} sprint(s)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Velocity: {forecast.minVelocity} pts/sprint
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
