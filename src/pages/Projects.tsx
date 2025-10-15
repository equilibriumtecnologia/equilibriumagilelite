import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  FolderKanban, 
  Users, 
  Calendar,
  MoreVertical,
  Filter
} from "lucide-react";

const Projects = () => {
  const projects = [
    {
      id: 1,
      name: "Website Redesign",
      description: "Complete overhaul of company website",
      category: "Execução",
      categoryColor: "bg-accent",
      team: 5,
      tasks: { completed: 8, total: 12 },
      deadline: "2025-02-15",
      progress: 67
    },
    {
      id: 2,
      name: "Mobile App Development",
      description: "iOS and Android native applications",
      category: "Revisão",
      categoryColor: "bg-warning",
      team: 8,
      tasks: { completed: 15, total: 20 },
      deadline: "2025-03-01",
      progress: 75
    },
    {
      id: 3,
      name: "Marketing Campaign Q1",
      description: "Q1 2025 marketing initiatives",
      category: "Planejamento",
      categoryColor: "bg-primary",
      team: 3,
      tasks: { completed: 3, total: 25 },
      deadline: "2025-03-31",
      progress: 12
    },
    {
      id: 4,
      name: "Infrastructure Upgrade",
      description: "Server and database optimization",
      category: "Execução",
      categoryColor: "bg-accent",
      team: 4,
      tasks: { completed: 6, total: 10 },
      deadline: "2025-02-20",
      progress: 60
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Projetos</h1>
            <p className="text-muted-foreground">
              Gerencie todos os seus projetos em um só lugar
            </p>
          </div>
          <Button variant="hero">
            <Plus className="mr-2 h-4 w-4" />
            Novo Projeto
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar projetos..." 
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
        </div>

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="p-6 border-border hover:shadow-lg transition-all cursor-pointer">
              {/* Project Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <FolderKanban className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-1">{project.name}</h3>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>

              {/* Category Badge */}
              <div className="mb-4">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${project.categoryColor} text-white`}>
                  {project.category}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-gradient-primary h-2 rounded-full transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {/* Project Info */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{project.team} membros</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(project.deadline).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <span className="text-sm font-medium">
                  {project.tasks.completed}/{project.tasks.total} tarefas
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
  );
};

export default Projects;
