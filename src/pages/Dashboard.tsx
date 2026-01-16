import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  ChevronRight
} from "lucide-react";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { useProjects } from "@/hooks/useProjects";

const Dashboard = () => {
  const { projects, loading } = useProjects();
  const navigate = useNavigate();

  const totalProjects = projects.length;
  const completedTasks = projects.reduce((acc, p) => 
    acc + (p.tasks?.filter((t) => t.status === "completed").length || 0), 0
  );
  const inProgressTasks = projects.reduce((acc, p) => 
    acc + (p.tasks?.filter((t) => t.status === "in_progress").length || 0), 0
  );
  const upcomingDeadlines = projects.filter(p => {
    if (!p.deadline) return false;
    const deadline = new Date(p.deadline);
    const today = new Date();
    const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }).length;

  const recentProjects = projects.slice(0, 3);

  return (
    <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral dos seus projetos e atividades
            </p>
          </div>
          <CreateProjectDialog />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-card border-border hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <FolderKanban className="h-6 w-6 text-primary" />
              </div>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <h3 className="text-2xl font-bold mb-1">{loading ? "..." : totalProjects}</h3>
            <p className="text-sm text-muted-foreground">Projetos Ativos</p>
          </Card>

          <Card className="p-6 bg-gradient-card border-border hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-1">{loading ? "..." : completedTasks}</h3>
            <p className="text-sm text-muted-foreground">Tarefas Concluídas</p>
          </Card>

          <Card className="p-6 bg-gradient-card border-border hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-warning" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-1">{loading ? "..." : inProgressTasks}</h3>
            <p className="text-sm text-muted-foreground">Em Andamento</p>
          </Card>

          <Card className="p-6 bg-gradient-card border-border hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              {upcomingDeadlines > 0 && (
                <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded">!</span>
              )}
            </div>
            <h3 className="text-2xl font-bold mb-1">{loading ? "..." : upcomingDeadlines}</h3>
            <p className="text-sm text-muted-foreground">Próximas do Prazo</p>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Projects */}
          <Card className="p-6 border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5 text-primary" />
                Projetos Recentes
              </h2>
              <Link to="/projects">
                <Button variant="ghost" size="sm">Ver Todos</Button>
              </Link>
            </div>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : recentProjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum projeto ainda
                </div>
              ) : (
                recentProjects.map((project) => {
                  const completedTasks = project.tasks?.filter((t) => t.status === "completed").length || 0;
                  const totalTasks = project.tasks?.length || 0;
                  const statusLabels: Record<string, string> = {
                    planning: "Planejamento",
                    active: "Ativo",
                    on_hold: "Em Espera",
                    completed: "Concluído",
                    cancelled: "Cancelado",
                  };
                  
                  return (
                    <div 
                      key={project.id} 
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer group"
                      onClick={() => navigate(`/projects/${project.id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/projects/${project.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <div>
                          <p className="font-medium">{project.name}</p>
                          <p className="text-sm text-muted-foreground">{statusLabels[project.status]}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{completedTasks}/{totalTasks}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Upcoming Tasks */}
          <Card className="p-6 border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                Próximas Tarefas
              </h2>
              <Link to="/tasks">
                <Button variant="ghost" size="sm">Ver Todas</Button>
              </Link>
            </div>
            <div className="text-center py-8 text-muted-foreground">
              Visualize todas as tarefas na página de Atividades
            </div>
          </Card>
        </div>
      </div>
  );
};

export default Dashboard;
