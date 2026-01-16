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
    
    // Calcular dias até o prazo
    const aDaysLeft = aDeadline ? Math.ceil((aDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : Infinity;
    const bDaysLeft = bDeadline ? Math.ceil((bDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : Infinity;
    
    // Regra: projeto com nível inferior mas prazo < 5 dias à frente do nível superior
    // Ex: projeto nível 4 com 3 dias < projeto nível 5 com 10 dias
    const aIsUrgent = aDaysLeft >= 0 && aDaysLeft < 5;
    const bIsUrgent = bDaysLeft >= 0 && bDaysLeft < 5;
    
    // Ajustar criticidade efetiva baseada na urgência
    const aEffectiveCriticality = aIsUrgent ? Math.max(aCriticality, 5) : aCriticality;
    const bEffectiveCriticality = bIsUrgent ? Math.max(bCriticality, 5) : bCriticality;
    
    // Se ambos são urgentes ou ambos não são, ordenar por criticidade, depois por prazo
    if (aEffectiveCriticality !== bEffectiveCriticality) {
      return bEffectiveCriticality - aEffectiveCriticality; // Maior criticidade primeiro
    }
    
    // Mesma criticidade efetiva: ordenar por prazo (mais próximo primeiro)
    if (aDaysLeft !== bDaysLeft) {
      return aDaysLeft - bDaysLeft;
    }
    
    // Se tudo igual, ordenar por nome
    return a.name.localeCompare(b.name);
  });

  const filteredProjects = sortedProjects.filter((project) =>
    project.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Projetos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os seus projetos em um só lugar
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar projetos..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filtros
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {search
              ? "Nenhum projeto encontrado com esse termo"
              : "Nenhum projeto cadastrado. Crie seu primeiro projeto!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} onUpdate={refetch} />
          ))}
        </div>
      )}
    </div>
  );
}
