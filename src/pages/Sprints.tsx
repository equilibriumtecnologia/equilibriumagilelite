import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, ArrowLeft, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
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

    return {
      taskCount: sprintTasks.length,
      completedTaskCount: completedTasks.length,
      totalPoints,
      completedPoints,
    };
  };

  const handleEdit = (sprint: Sprint) => {
    setSelectedSprint(sprint);
    setEditDialogOpen(true);
  };

  const handleDelete = (sprint: Sprint) => {
    setSelectedSprint(sprint);
    setDeleteDialogOpen(true);
  };

  if (projectLoading || isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Projeto não encontrado</p>
        <Button asChild variant="link" className="mt-2">
          <Link to="/projects">Voltar para Projetos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/projects/${projectId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Sprints</h1>
            <p className="text-muted-foreground">{project.name}</p>
          </div>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Sprint
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todas ({sprints.length})</TabsTrigger>
          <TabsTrigger value="active">
            Ativa {activeSprint ? "(1)" : "(0)"}
          </TabsTrigger>
          <TabsTrigger value="planning">
            Planejamento ({planningSprints.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Concluídas ({completedSprints.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {sprints.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <p className="text-muted-foreground mb-4">
                Nenhuma sprint criada ainda.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Sprint
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sprints.map((sprint) => {
                const stats = getSprintStats(sprint.id);
                return (
                  <SprintCard
                    key={sprint.id}
                    sprint={sprint}
                    {...stats}
                    onEdit={() => handleEdit(sprint)}
                    onDelete={() => handleDelete(sprint)}
                    onStart={
                      sprint.status === "planning"
                        ? () => startSprint.mutate(sprint.id)
                        : undefined
                    }
                    onComplete={
                      sprint.status === "active"
                        ? () => completeSprint.mutate(sprint.id)
                        : undefined
                    }
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active">
          {activeSprint ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <SprintCard
                sprint={activeSprint}
                {...getSprintStats(activeSprint.id)}
                onEdit={() => handleEdit(activeSprint)}
                onComplete={() => completeSprint.mutate(activeSprint.id)}
              />
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <p className="text-muted-foreground">
                Nenhuma sprint ativa no momento.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="planning">
          {planningSprints.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <p className="text-muted-foreground mb-4">
                Nenhuma sprint em planejamento.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Sprint
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {planningSprints.map((sprint) => {
                const stats = getSprintStats(sprint.id);
                return (
                  <SprintCard
                    key={sprint.id}
                    sprint={sprint}
                    {...stats}
                    onEdit={() => handleEdit(sprint)}
                    onDelete={() => handleDelete(sprint)}
                    onStart={() => startSprint.mutate(sprint.id)}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedSprints.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <p className="text-muted-foreground">
                Nenhuma sprint concluída ainda.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedSprints.map((sprint) => {
                const stats = getSprintStats(sprint.id);
                return (
                  <SprintCard
                    key={sprint.id}
                    sprint={sprint}
                    {...stats}
                    onEdit={() => handleEdit(sprint)}
                    onDelete={() => handleDelete(sprint)}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateSprintDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectId={projectId!}
        sprintNumber={sprints.length + 1}
      />

      {selectedSprint && (
        <>
          <EditSprintDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            sprint={selectedSprint}
          />
          <DeleteSprintDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            sprint={selectedSprint}
          />
        </>
      )}
    </div>
  );
}
