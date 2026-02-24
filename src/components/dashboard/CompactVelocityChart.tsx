import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";
import { Card } from "@/components/ui/card";
import type { VelocityDataPoint } from "@/hooks/useReportData";

interface Props {
  data: VelocityDataPoint[];
}

export function CompactVelocityChart({ data }: Props) {
  return (
    <Card className="p-3 sm:p-4">
      <h3 className="text-sm font-semibold mb-2">Velocity</h3>
      <div className="h-[180px] sm:h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis dataKey="sprint" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} width={30} />
            <Tooltip
              contentStyle={{ fontSize: 11, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
            />
            <Bar dataKey="velocity" name="Velocity" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
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
