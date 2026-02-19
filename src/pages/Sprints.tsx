import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { SprintCard } from "@/components/sprints/SprintCard";
import { CreateSprintDialog } from "@/components/sprints/CreateSprintDialog";
import { EditSprintDialog } from "@/components/sprints/EditSprintDialog";
import { DeleteSprintDialog } from "@/components/sprints/DeleteSprintDialog";
import { useSprints } from "@/hooks/useSprints";
import { useTasks } from "@/hooks/useTasks";
import { useProject } from "@/hooks/useProject";
import { Database } from "@/integrations/supabase/types";

type Sprint = Database["public"]["Tables"]["sprints"]["Row"];

export default function Sprints() {
  const { id: projectId } = useParams<{ id: string }>();
  const { project, loading: projectLoading } = useProject(projectId!);
  const { 
    sprints, 
    activeSprint, 
    planningSprints, 
    completedSprints, 
    isLoading,
    startSprint,
    completeSprint,
  } = useSprints(projectId);
  const { tasks } = useTasks(projectId);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);

  const getSprintStats = (sprintId: string) => {
    const sprintTasks = tasks.filter((t) => t.sprint_id === sprintId);
    const completedTasks = sprintTasks.filter((t) => t.status === "completed");
    const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
    const completedPoints = completedTasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
    return { taskCount: sprintTasks.length, completedTaskCount: completedTasks.length, totalPoints, completedPoints };
  };

  const handleEdit = (sprint: Sprint) => { setSelectedSprint(sprint); setEditDialogOpen(true); };
  const handleDelete = (sprint: Sprint) => { setSelectedSprint(sprint); setDeleteDialogOpen(true); };

  if (projectLoading || isLoading) {
    return (
      <div className="px-3 sm:px-4 md:px-8 py-4 sm:py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (<Skeleton key={i} className="h-48" />))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Projeto não encontrado</p>
        <Button asChild variant="link" className="mt-2"><Link to="/projects">Voltar para Projetos</Link></Button>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 md:px-8 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Button variant="ghost" size="icon" asChild className="flex-shrink-0">
            <Link to={`/projects/${projectId}`}><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">Sprints</h1>
            <p className="text-sm text-muted-foreground truncate">{project.name}</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setCreateDialogOpen(true)} className="flex-shrink-0">
          <Plus className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">Nova Sprint</span>
          <span className="sm:hidden">Nova</span>
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-auto">
            <TabsTrigger value="all" className="text-xs sm:text-sm whitespace-nowrap">Todas ({sprints.length})</TabsTrigger>
            <TabsTrigger value="active" className="text-xs sm:text-sm whitespace-nowrap">Ativa {activeSprint ? "(1)" : "(0)"}</TabsTrigger>
            <TabsTrigger value="planning" className="text-xs sm:text-sm whitespace-nowrap">Planej. ({planningSprints.length})</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs sm:text-sm whitespace-nowrap">Concluídas ({completedSprints.length})</TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="all" className="space-y-4">
          {sprints.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <p className="text-muted-foreground mb-4">Nenhuma sprint criada ainda.</p>
              <Button onClick={() => setCreateDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Criar Primeira Sprint</Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {sprints.map((sprint) => {
                const stats = getSprintStats(sprint.id);
                return (
                  <SprintCard key={sprint.id} sprint={sprint} {...stats}
                    onEdit={() => handleEdit(sprint)} onDelete={() => handleDelete(sprint)}
                    onStart={sprint.status === "planning" ? () => startSprint.mutate(sprint.id) : undefined}
                    onComplete={sprint.status === "active" ? () => completeSprint.mutate(sprint.id) : undefined}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active">
          {activeSprint ? (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <SprintCard sprint={activeSprint} {...getSprintStats(activeSprint.id)}
                onEdit={() => handleEdit(activeSprint)} onComplete={() => completeSprint.mutate(activeSprint.id)} />
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <p className="text-muted-foreground">Nenhuma sprint ativa no momento.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="planning">
          {planningSprints.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <p className="text-muted-foreground mb-4">Nenhuma sprint em planejamento.</p>
              <Button onClick={() => setCreateDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Nova Sprint</Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {planningSprints.map((sprint) => {
                const stats = getSprintStats(sprint.id);
                return (
                  <SprintCard key={sprint.id} sprint={sprint} {...stats}
                    onEdit={() => handleEdit(sprint)} onDelete={() => handleDelete(sprint)}
                    onStart={() => startSprint.mutate(sprint.id)} />
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedSprints.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <p className="text-muted-foreground">Nenhuma sprint concluída ainda.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {completedSprints.map((sprint) => {
                const stats = getSprintStats(sprint.id);
                return (
                  <SprintCard key={sprint.id} sprint={sprint} {...stats}
                    onEdit={() => handleEdit(sprint)} onDelete={() => handleDelete(sprint)} />
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateSprintDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} projectId={projectId!} sprintNumber={sprints.length + 1} />
      {selectedSprint && (
        <>
          <EditSprintDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} sprint={selectedSprint} />
          <DeleteSprintDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} sprint={selectedSprint} />
        </>
      )}
    </div>
  );
}
