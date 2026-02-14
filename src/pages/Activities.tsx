import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { TaskCard } from "@/components/tasks/TaskCard";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const Activities = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const { tasks, isLoading } = useTasks(projectId || undefined);

  const filteredTasks = tasks?.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const tasksByStatus = {
    todo: filteredTasks?.filter(t => t.status === "todo") || [],
    in_progress: filteredTasks?.filter(t => t.status === "in_progress") || [],
    review: filteredTasks?.filter(t => t.status === "review") || [],
    completed: filteredTasks?.filter(t => t.status === "completed") || [],
  };

  return (
    <div className="px-3 sm:px-4 md:px-8 py-4 sm:py-6 md:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-8 gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Atividades</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie suas tarefas e acompanhe o progresso
          </p>
        </div>
        <CreateTaskDialog projectId={projectId}>
          <Button variant="hero" size="sm" className="sm:size-default">
            <Plus className="mr-1.5 h-4 w-4" />
            Nova Atividade
          </Button>
        </CreateTaskDialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar atividades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Prioridades</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks by Status */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-5">
            <TabsTrigger value="all" className="text-xs sm:text-sm whitespace-nowrap">Todas ({filteredTasks?.length || 0})</TabsTrigger>
            <TabsTrigger value="todo" className="text-xs sm:text-sm whitespace-nowrap">A Fazer ({tasksByStatus.todo.length})</TabsTrigger>
            <TabsTrigger value="in_progress" className="text-xs sm:text-sm whitespace-nowrap">Em Progresso ({tasksByStatus.in_progress.length})</TabsTrigger>
            <TabsTrigger value="review" className="text-xs sm:text-sm whitespace-nowrap">Revisão ({tasksByStatus.review.length})</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs sm:text-sm whitespace-nowrap">Concluídas ({tasksByStatus.completed.length})</TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="all" className="mt-4 sm:mt-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Carregando atividades...</div>
          ) : filteredTasks && filteredTasks.length > 0 ? (
            <div className="grid gap-3 sm:gap-4">
              {filteredTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma atividade encontrada
            </div>
          )}
        </TabsContent>

        {(["todo", "in_progress", "review", "completed"] as const).map((status) => (
          <TabsContent key={status} value={status} className="mt-4 sm:mt-6">
            {tasksByStatus[status].length > 0 ? (
              <div className="grid gap-3 sm:gap-4">
                {tasksByStatus[status].map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma atividade nesta categoria
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Activities;
