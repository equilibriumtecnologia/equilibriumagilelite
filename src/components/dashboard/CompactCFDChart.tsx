import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import type { CumulativeFlowDataPoint } from "@/hooks/useReportData";

const statusColors = {
  completed: "hsl(142, 71%, 45%)",
  review: "hsl(262, 83%, 58%)",
  in_progress: "hsl(38, 92%, 50%)",
  todo: "hsl(215, 20%, 65%)",
};

const statusLabels = {
  completed: "Concluído",
  review: "Revisão",
  in_progress: "Em Andamento",
  todo: "A Fazer",
};

interface Props {
  data: CumulativeFlowDataPoint[];
}

export function CompactCFDChart({ data }: Props) {
  return (
    <Card className="p-3 sm:p-4">
      <h3 className="text-sm font-semibold mb-2">Fluxo Cumulativo</h3>
      <div className="h-[180px] sm:h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getDate()}/${d.getMonth() + 1}`;
              }}
            />
            <YAxis tick={{ fontSize: 10 }} width={30} />
            <Tooltip
              labelFormatter={(v) => new Date(v).toLocaleDateString("pt-BR")}
              contentStyle={{ fontSize: 11, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
            />
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
