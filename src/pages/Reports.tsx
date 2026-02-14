import { useState } from "react";
import { BarChart3, TrendingUp, Layers, Clock, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useProjects } from "@/hooks/useProjects";
import { useReportData } from "@/hooks/useReportData";
import { BurndownChart } from "@/components/reports/BurndownChart";
import { VelocityChart } from "@/components/reports/VelocityChart";
import { CumulativeFlowChart } from "@/components/reports/CumulativeFlowChart";
import { CycleTimeChart } from "@/components/reports/CycleTimeChart";
import { TeamPerformance } from "@/components/reports/TeamPerformance";

const Reports = () => {
  const { projects } = useProjects();
  const [selectedProject, setSelectedProject] = useState<string>("all");

  const projectId = selectedProject === "all" ? undefined : selectedProject;
  const { sprints, isLoading, getBurndownData, getVelocityData, getCFDData, getCycleTimeData, getTeamPerformance } =
    useReportData(projectId);

  const velocityData = getVelocityData();
  const cfdData = getCFDData();
  const cycleTimeData = getCycleTimeData();
  const teamData = getTeamPerformance();

  return (
    <div className="px-3 sm:px-4 md:px-8 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Relatórios
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Analytics e métricas de performance
          </p>
        </div>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-full sm:w-[220px]">
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

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando dados...</div>
      ) : (
        <Tabs defaultValue="burndown" className="space-y-4">
          <ScrollArea className="w-full">
            <TabsList className="inline-flex w-auto">
              <TabsTrigger value="burndown" className="gap-1.5 text-xs sm:text-sm">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Burndown</span>
                <span className="sm:hidden">Burn</span>
              </TabsTrigger>
              <TabsTrigger value="velocity" className="gap-1.5 text-xs sm:text-sm">
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Velocity</span>
                <span className="sm:hidden">Vel</span>
              </TabsTrigger>
              <TabsTrigger value="cfd" className="gap-1.5 text-xs sm:text-sm">
                <Layers className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Fluxo Cumulativo</span>
                <span className="sm:hidden">CFD</span>
              </TabsTrigger>
              <TabsTrigger value="cycletime" className="gap-1.5 text-xs sm:text-sm">
                <Clock className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Cycle Time</span>
                <span className="sm:hidden">Cycle</span>
              </TabsTrigger>
              <TabsTrigger value="team" className="gap-1.5 text-xs sm:text-sm">
                <Users className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Equipe</span>
                <span className="sm:hidden">Team</span>
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="burndown">
            <BurndownChart sprints={sprints} getBurndownData={getBurndownData} />
          </TabsContent>

          <TabsContent value="velocity">
            <VelocityChart data={velocityData} />
          </TabsContent>

          <TabsContent value="cfd">
            <CumulativeFlowChart data={cfdData} />
          </TabsContent>

          <TabsContent value="cycletime">
            <CycleTimeChart data={cycleTimeData} />
          </TabsContent>

          <TabsContent value="team">
            <TeamPerformance data={teamData} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Reports;
