import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import type { Tables } from "@/integrations/supabase/types";
import type { BurndownDataPoint } from "@/hooks/useReportData";

interface BurndownChartProps {
  sprints: Tables<"sprints">[];
  getBurndownData: (sprintId: string) => BurndownDataPoint[];
}

export function BurndownChart({ sprints, getBurndownData }: BurndownChartProps) {
  const activeSprints = sprints.filter((s) => s.status === "active" || s.status === "completed");
  const [selectedSprint, setSelectedSprint] = useState<string>(activeSprints[0]?.id || "");

  const data = selectedSprint ? getBurndownData(selectedSprint) : [];

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-base sm:text-lg font-semibold">Burndown Chart</h3>
        <Select value={selectedSprint} onValueChange={setSelectedSprint}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Selecionar Sprint" />
          </SelectTrigger>
          <SelectContent>
            {activeSprints.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {data.length === 0 ? (
        <div className="h-[250px] sm:h-[300px] flex items-center justify-center text-muted-foreground text-sm">
          {activeSprints.length === 0
            ? "Nenhuma sprint ativa ou concluída encontrada."
            : "Selecione uma sprint para visualizar o burndown."}
        </div>
      ) : (
        <div className="h-[250px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
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
                labelFormatter={(v) => {
                  const d = new Date(v);
                  return d.toLocaleDateString("pt-BR");
                }}
                contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="ideal"
                name="Ideal"
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="actual"
                name="Real"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
