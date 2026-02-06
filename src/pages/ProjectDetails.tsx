import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  LayoutGrid,
  List,
  Zap,
  ListTodo,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useProject } from "@/hooks/useProject";
import { useSprints } from "@/hooks/useSprints";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { AddMemberDialog } from "@/components/projects/AddMemberDialog";
import { RemoveMemberDialog } from "@/components/projects/RemoveMemberDialog";
import { EditProjectDialog } from "@/components/projects/EditProjectDialog";
import { DeleteProjectDialog } from "@/components/projects/DeleteProjectDialog";
import { TaskCard } from "@/components/tasks/TaskCard";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { SprintBoardHeader } from "@/components/sprints/SprintBoardHeader";

const statusLabels: Record<string, string> = {
  planning: "Planejamento",
  active: "Ativo",
  on_hold: "Em Espera",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const statusColors: Record<string, string> = {
  planning: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  on_hold: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  completed: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { project, loading, refetch } = useProject(id);
  const { activeSprint, sprints } = useSprints(id);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12 text-muted-foreground">
          Carregando projeto...
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Projeto não encontrado</p>
          <Link to="/projects">
            <Button variant="outline">Voltar para Projetos</Button>
          </Link>
        </div>
      </div>
    );
  }

  const completedTasks =
    project.tasks?.filter((t) => t.status === "completed").length || 0;
  const totalTasks = project.tasks?.length || 0;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link to="/projects">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Projetos
          </Button>
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <EditProjectDialog project={project} onSuccess={refetch} />
              <DeleteProjectDialog
                projectId={project.id}
                projectName={project.name}
                onSuccess={() => (window.location.href = "/projects")}
              />
            </div>
            <p className="text-muted-foreground">
              {project.description || "Sem descrição"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to={`/projects/${project.id}/sprints`}>
                <Zap className="mr-2 h-4 w-4" />
                Sprints
                {sprints.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {sprints.length}
                  </Badge>
                )}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/projects/${project.id}/backlog`}>
                <ListTodo className="mr-2 h-4 w-4" />
                Backlog
              </Link>
            </Button>
            <CreateTaskDialog projectId={project.id}>
              <Button variant="hero">Nova Tarefa</Button>
            </CreateTaskDialog>
          </div>
        </div>
      </div>

      {/* Active Sprint Header */}
      {activeSprint && (
        <SprintBoardHeader
          sprint={activeSprint}
          taskCount={project.tasks?.filter((t) => t.sprint_id === activeSprint.id).length || 0}
          completedTaskCount={project.tasks?.filter((t) => t.sprint_id === activeSprint.id && t.status === "completed").length || 0}
          totalPoints={project.tasks?.filter((t) => t.sprint_id === activeSprint.id).reduce((sum, t) => sum + (t.story_points || 0), 0) || 0}
          completedPoints={project.tasks?.filter((t) => t.sprint_id === activeSprint.id && t.status === "completed").reduce((sum, t) => sum + (t.story_points || 0), 0) || 0}
        />
      )}

      {/* Project Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {completedTasks}/{totalTasks}
              </p>
              <p className="text-sm text-muted-foreground">Tarefas</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {project.project_members?.length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Membros</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={statusColors[project.status]}>
              {statusLabels[project.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-2">Status</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-semibold">
                {project.deadline
                  ? format(new Date(project.deadline), "dd/MM/yyyy", {
                      locale: ptBR,
                    })
                  : "Sem prazo"}
              </p>
              <p className="text-sm text-muted-foreground">Prazo</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Progress */}
      <Card className="p-6 mb-8">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Progresso do Projeto</h3>
            <span className="text-sm font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
      </Card>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Tasks Section */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="kanban" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="kanban">
                <LayoutGrid className="mr-2 h-4 w-4" />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="mr-2 h-4 w-4" />
                Lista
              </TabsTrigger>
            </TabsList>

            <TabsContent value="kanban" className="mt-6">
              <KanbanBoard 
                tasks={project.tasks || []} 
                onUpdate={refetch} 
                projectId={project.id}
                members={project.project_members || []}
                sprints={sprints}
              />
            </TabsContent>

            <TabsContent value="list" className="mt-6">
              <div className="space-y-4">
                {project.tasks && project.tasks.length > 0 ? (
                  project.tasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhuma tarefa ainda
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Team Section */}
        <div>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Equipe do Projeto
              </h3>
              <AddMemberDialog
                projectId={project.id}
                currentMembers={
                  project.project_members?.map((m) => m.user_id) || []
                }
                onSuccess={refetch}
              />
            </div>

            <div className="space-y-3">
              {project.project_members?.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {(() => {
                          const names = member.profiles.full_name.split(" ");
                          const firstName = names[0]?.[0] || "";
                          const lastName = names[names.length - 1]?.[0] || "";
                          return (firstName + lastName).toUpperCase();
                        })()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.profiles.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.role === "owner" ? "Proprietário" : "Membro"}
                      </p>
                    </div>
                  </div>
                  {member.role !== "owner" && (
                    <RemoveMemberDialog
                      projectId={project.id}
                      userId={member.user_id}
                      userName={member.profiles.full_name}
                      onSuccess={refetch}
                    />
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
