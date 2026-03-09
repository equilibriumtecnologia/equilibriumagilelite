import { Card } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { useReportData } from "@/hooks/useReportData";
import { CompactVelocityChart } from "@/components/dashboard/CompactVelocityChart";
import { CompactCFDChart } from "@/components/dashboard/CompactCFDChart";
import { CompactCycleTimeChart } from "@/components/dashboard/CompactCycleTimeChart";
import { CompactTeamPerformance } from "@/components/dashboard/CompactTeamPerformance";

interface ProjectReportCardsProps {
  projectId: string;
}

export function ProjectReportCards({ projectId }: ProjectReportCardsProps) {
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
      <h2 className="text-base sm:text-xl font-semibold flex items-center gap-2">
        <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        Métricas & Relatórios
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {velocityData.length > 0 && <CompactVelocityChart data={velocityData} />}
        {cfdData.length > 0 && <CompactCFDChart data={cfdData} />}
        {cycleTimeData.length > 0 && <CompactCycleTimeChart data={cycleTimeData} />}
        {teamData.length > 0 && <CompactTeamPerformance data={teamData} />}
      </div>
    </div>
  );
}
