import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus,
  TrendingUp
} from "lucide-react";

const Dashboard = () => {
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
          <Button variant="hero">
            <Plus className="mr-2 h-4 w-4" />
            Novo Projeto
          </Button>
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
            <h3 className="text-2xl font-bold mb-1">8</h3>
            <p className="text-sm text-muted-foreground">Projetos Ativos</p>
          </Card>

          <Card className="p-6 bg-gradient-card border-border hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded">+12%</span>
            </div>
            <h3 className="text-2xl font-bold mb-1">42</h3>
            <p className="text-sm text-muted-foreground">Tarefas Concluídas</p>
          </Card>

          <Card className="p-6 bg-gradient-card border-border hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <span className="text-xs font-medium text-warning bg-warning/10 px-2 py-1 rounded">5</span>
            </div>
            <h3 className="text-2xl font-bold mb-1">18</h3>
            <p className="text-sm text-muted-foreground">Em Andamento</p>
          </Card>

          <Card className="p-6 bg-gradient-card border-border hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded">!</span>
            </div>
            <h3 className="text-2xl font-bold mb-1">3</h3>
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
              <Button variant="ghost" size="sm">Ver Todos</Button>
            </div>
            <div className="space-y-4">
              {[
                { name: "Website Redesign", status: "Em Andamento", tasks: "8/12", color: "bg-accent" },
                { name: "Mobile App Development", status: "Em Revisão", tasks: "15/20", color: "bg-warning" },
                { name: "Marketing Campaign Q1", status: "Planejamento", tasks: "3/25", color: "bg-primary" },
              ].map((project, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${project.color}`} />
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">{project.status}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium">{project.tasks}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Upcoming Tasks */}
          <Card className="p-6 border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                Próximas Tarefas
              </h2>
              <Button variant="ghost" size="sm">Ver Todas</Button>
            </div>
            <div className="space-y-4">
              {[
                { title: "Design review meeting", deadline: "Hoje, 14:00", priority: "high" },
                { title: "Update project documentation", deadline: "Amanhã, 10:00", priority: "medium" },
                { title: "Client presentation prep", deadline: "Sex, 15:00", priority: "high" },
              ].map((task, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                  <div className="mt-1">
                    <div className="w-5 h-5 border-2 border-primary rounded"></div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium mb-1">{task.title}</p>
                    <p className="text-sm text-muted-foreground">{task.deadline}</p>
                  </div>
                  {task.priority === "high" && (
                    <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded">
                      Alta
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
  );
};

export default Dashboard;
