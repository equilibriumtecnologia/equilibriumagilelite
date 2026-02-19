import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import type { CumulativeFlowDataPoint } from "@/hooks/useReportData";

interface CumulativeFlowChartProps {
  data: CumulativeFlowDataPoint[];
}

const statusColors = {
  completed: "hsl(142, 71%, 45%)",
  review: "hsl(262, 83%, 58%)",
  in_progress: "hsl(38, 92%, 50%)",
  todo: "hsl(215, 20%, 65%)",
};

const statusLabels = {
  completed: "Concluído",
  review: "Em Revisão",
  in_progress: "Em Andamento",
  todo: "A Fazer",
};

export function CumulativeFlowChart({ data }: CumulativeFlowChartProps) {
  if (data.length === 0) {
    return (
      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4">Fluxo Cumulativo</h3>
        <div className="h-[250px] sm:h-[300px] flex items-center justify-center text-muted-foreground text-sm">
          Sem dados suficientes para exibir o diagrama.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold mb-4">Fluxo Cumulativo (CFD)</h3>
      <div className="h-[250px] sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getDate()}/${d.getMonth() + 1}`;
              }}
            />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              labelFormatter={(v) => new Date(v).toLocaleDateString("pt-BR")}
              contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="completed" name={statusLabels.completed} stackId="1" fill={statusColors.completed} stroke={statusColors.completed} />
            <Area type="monotone" dataKey="review" name={statusLabels.review} stackId="1" fill={statusColors.review} stroke={statusColors.review} />
            <Area type="monotone" dataKey="in_progress" name={statusLabels.in_progress} stackId="1" fill={statusColors.in_progress} stroke={statusColors.in_progress} />
            <Area type="monotone" dataKey="todo" name={statusLabels.todo} stackId="1" fill={statusColors.todo} stroke={statusColors.todo} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
