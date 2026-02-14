import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";
import { Card } from "@/components/ui/card";
import type { VelocityDataPoint } from "@/hooks/useReportData";

interface VelocityChartProps {
  data: VelocityDataPoint[];
}

export function VelocityChart({ data }: VelocityChartProps) {
  if (data.length === 0) {
    return (
      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4">Velocity Chart</h3>
        <div className="h-[250px] sm:h-[300px] flex items-center justify-center text-muted-foreground text-sm">
          Nenhuma sprint concluída com velocity registrada.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold mb-4">Velocity Chart</h3>
      <div className="h-[250px] sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis dataKey="sprint" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="velocity" name="Velocity" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Line
              type="monotone"
              dataKey="average"
              name="Média"
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
