import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Loader2 } from "lucide-react";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { useProjects } from "@/hooks/useProjects";

export default function Projects() {
  const { projects, loading, refetch } = useProjects();
  const [search, setSearch] = useState("");

  // Ordenação inteligente por criticidade e data
  const sortedProjects = [...projects].sort((a, b) => {
    const today = new Date();
    const aDeadline = a.deadline ? new Date(a.deadline) : null;
    const bDeadline = b.deadline ? new Date(b.deadline) : null;
    
    const aCriticality = (a as any).criticality_level ?? 3;
    const bCriticality = (b as any).criticality_level ?? 3;
    
    const aDaysLeft = aDeadline ? Math.ceil((aDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : Infinity;
    const bDaysLeft = bDeadline ? Math.ceil((bDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : Infinity;
    
    const aIsUrgent = aDaysLeft >= 0 && aDaysLeft < 5;
    const bIsUrgent = bDaysLeft >= 0 && bDaysLeft < 5;
    
    const aEffectiveCriticality = aIsUrgent ? Math.max(aCriticality, 5) : aCriticality;
    const bEffectiveCriticality = bIsUrgent ? Math.max(bCriticality, 5) : bCriticality;
    
    if (aEffectiveCriticality !== bEffectiveCriticality) {
      return bEffectiveCriticality - aEffectiveCriticality;
    }
    
    if (aDaysLeft !== bDaysLeft) {
      return aDaysLeft - bDaysLeft;
    }
    
    return a.name.localeCompare(b.name);
  });

  const filteredProjects = sortedProjects.filter((project) =>
    project.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="px-3 sm:px-4 md:px-8 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Projetos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie todos os seus projetos em um só lugar
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      <div className="flex gap-2 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar projetos..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" className="sm:w-auto sm:px-4">
          <Filter className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Filtros</span>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm sm:text-base">
            {search
              ? "Nenhum projeto encontrado com esse termo"
              : "Nenhum projeto cadastrado. Crie seu primeiro projeto!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} onUpdate={refetch} />
          ))}
        </div>
      )}
    </div>
  );
}
