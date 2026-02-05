import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ArrowLeft, Plus, Filter, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BacklogItem } from "@/components/backlog/BacklogItem";
import { MoveToSprintDialog } from "@/components/backlog/MoveToSprintDialog";
import { useTasks } from "@/hooks/useTasks";
import { useSprints } from "@/hooks/useSprints";
import { useProject } from "@/hooks/useProject";
import { Database } from "@/integrations/supabase/types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];

export default function Backlog() {
  const { id: projectId } = useParams<{ id: string }>();
  const { project, loading: projectLoading } = useProject(projectId!);
  const { tasks, isLoading: tasksLoading, updateTask } = useTasks(projectId);
  const { sprints, planningSprints, activeSprint } = useSprints(projectId);

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Backlog tasks = tasks without a sprint
  const backlogTasks = useMemo(() => {
    let filtered = tasks.filter((t) => !t.sprint_id);

    if (search) {
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((t) => t.priority === priorityFilter);
    }

    return filtered.sort((a, b) => (a.backlog_order || 0) - (b.backlog_order || 0));
  }, [tasks, search, priorityFilter]);

  const totalPoints = backlogTasks.reduce(
    (sum, t) => sum + (t.story_points || 0),
    0
  );

  const selectedPoints = backlogTasks
    .filter((t) => selectedTasks.includes(t.id))
    .reduce((sum, t) => sum + (t.story_points || 0), 0);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = backlogTasks.findIndex((t) => t.id === active.id);
      const newIndex = backlogTasks.findIndex((t) => t.id === over.id);

      // Update order in database
      const updatedTasks = [...backlogTasks];
      const [movedTask] = updatedTasks.splice(oldIndex, 1);
      updatedTasks.splice(newIndex, 0, movedTask);

      // Update backlog_order for affected tasks
      for (let i = 0; i < updatedTasks.length; i++) {
        if (updatedTasks[i].backlog_order !== i) {
          await updateTask.mutateAsync({
            id: updatedTasks[i].id,
            backlog_order: i,
          });
        }
      }
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const selectAll = () => {
    if (selectedTasks.length === backlogTasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(backlogTasks.map((t) => t.id));
    }
  };

  if (projectLoading || tasksLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20" />
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

  const availableSprints = [
    ...(activeSprint ? [activeSprint] : []),
    ...planningSprints,
  ];

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
            <h1 className="text-2xl font-bold">Backlog</h1>
            <p className="text-muted-foreground">{project.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {backlogTasks.length} itens · {totalPoints} pontos
          </Badge>
          {selectedTasks.length > 0 && (
            <>
              <Badge variant="secondary" className="text-sm">
                {selectedTasks.length} selecionados · {selectedPoints} pontos
              </Badge>
              <Button
                size="sm"
                onClick={() => setMoveDialogOpen(true)}
                disabled={availableSprints.length === 0}
              >
                Mover para Sprint
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Buscar no backlog..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={selectAll}>
          {selectedTasks.length === backlogTasks.length
            ? "Desmarcar Todos"
            : "Selecionar Todos"}
        </Button>
      </div>

      {backlogTasks.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <ListFilter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">
            {search || priorityFilter !== "all"
              ? "Nenhum item encontrado com os filtros aplicados."
              : "O backlog está vazio."}
          </p>
          <p className="text-sm text-muted-foreground">
            Tarefas sem sprint associada aparecem aqui.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={backlogTasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {backlogTasks.map((task, index) => (
                <BacklogItem
                  key={task.id}
                  task={task}
                  index={index + 1}
                  isSelected={selectedTasks.includes(task.id)}
                  onToggleSelect={() => toggleTaskSelection(task.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <MoveToSprintDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        taskIds={selectedTasks}
        sprints={availableSprints}
        onSuccess={() => setSelectedTasks([])}
      />
    </div>
  );
}
