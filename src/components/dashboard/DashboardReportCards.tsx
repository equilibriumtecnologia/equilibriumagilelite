import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3 } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useReportData } from "@/hooks/useReportData";
import { CompactVelocityChart } from "./CompactVelocityChart";
import { CompactCFDChart } from "./CompactCFDChart";
import { CompactCycleTimeChart } from "./CompactCycleTimeChart";
import { CompactTeamPerformance } from "./CompactTeamPerformance";

export function DashboardReportCards() {
  const { projects } = useProjects();
  const [selectedProject, setSelectedProject] = useState<string>("all");

  const projectId = selectedProject === "all" ? undefined : selectedProject;
  const { isLoading, getVelocityData, getCFDData, getCycleTimeData, getTeamPerformance } =
    useReportData(projectId);

  const velocityData = getVelocityData();
  const cfdData = getCFDData();
  const cycleTimeData = getCycleTimeData();
  const teamData = getTeamPerformance();

  const hasAnyData = velocityData.length > 0 || cfdData.length > 0 || cycleTimeData.length > 0 || teamData.length > 0;

  if (isLoading || !hasAnyData) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-base sm:text-xl font-semibold flex items-center gap-2">
          <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Métricas & Relatórios
        </h2>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-full sm:w-[200px] h-8 text-xs">
            <SelectValue placeholder="Filtrar por projeto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Projetos</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {velocityData.length > 0 && <CompactVelocityChart data={velocityData} />}
        {cfdData.length > 0 && <CompactCFDChart data={cfdData} />}
        {cycleTimeData.length > 0 && <CompactCycleTimeChart data={cycleTimeData} />}
        {teamData.length > 0 && <CompactTeamPerformance data={teamData} />}
      </div>
    </div>
  );
}
