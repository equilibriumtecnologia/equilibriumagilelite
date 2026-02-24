import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import type { CycleTimeDataPoint } from "@/hooks/useReportData";

interface Props {
  data: CycleTimeDataPoint[];
}

export function CompactCycleTimeChart({ data }: Props) {
  const avgLeadTime = Math.round((data.reduce((s, d) => s + d.leadTime, 0) / data.length) * 10) / 10;
  const avgCycleTime = Math.round((data.reduce((s, d) => s + d.cycleTime, 0) / data.length) * 10) / 10;

  return (
    <Card className="p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold">Cycle Time & Lead Time</h3>
        <div className="flex gap-2 text-[10px]">
          <span className="text-muted-foreground">
            Lead: <strong className="text-foreground">{avgLeadTime}d</strong>
          </span>
          <span className="text-muted-foreground">
            Cycle: <strong className="text-foreground">{avgCycleTime}d</strong>
          </span>
        </div>
      </div>
      <div className="h-[180px] sm:h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis dataKey="task" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" height={40} />
            <YAxis tick={{ fontSize: 10 }} width={30} />
            <Tooltip
              contentStyle={{ fontSize: 11, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              formatter={(value: number) => `${value} dias`}
            />
            <Bar dataKey="leadTime" name="Lead Time" fill="hsl(var(--muted-foreground))" radius={[3, 3, 0, 0]} />
            <Bar dataKey="cycleTime" name="Cycle Time" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
