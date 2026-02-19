import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import type { CycleTimeDataPoint } from "@/hooks/useReportData";

interface CycleTimeChartProps {
  data: CycleTimeDataPoint[];
}

export function CycleTimeChart({ data }: CycleTimeChartProps) {
  if (data.length === 0) {
    return (
      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4">Cycle Time & Lead Time</h3>
        <div className="h-[250px] sm:h-[300px] flex items-center justify-center text-muted-foreground text-sm">
          Nenhuma tarefa concluída para análise.
        </div>
      </Card>
    );
  }

  const avgLeadTime = Math.round((data.reduce((s, d) => s + d.leadTime, 0) / data.length) * 10) / 10;
  const avgCycleTime = Math.round((data.reduce((s, d) => s + d.cycleTime, 0) / data.length) * 10) / 10;

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <h3 className="text-base sm:text-lg font-semibold">Cycle Time & Lead Time</h3>
        <div className="flex gap-3 text-xs">
          <span className="text-muted-foreground">
            Média Lead: <strong className="text-foreground">{avgLeadTime}d</strong>
          </span>
          <span className="text-muted-foreground">
            Média Cycle: <strong className="text-foreground">{avgCycleTime}d</strong>
          </span>
        </div>
      </div>
      <div className="h-[250px] sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis dataKey="task" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 11 }} label={{ value: "Dias", angle: -90, position: "insideLeft", style: { fontSize: 11 } }} />
            <Tooltip
              contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              formatter={(value: number) => `${value} dias`}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="leadTime" name="Lead Time" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="cycleTime" name="Cycle Time" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
