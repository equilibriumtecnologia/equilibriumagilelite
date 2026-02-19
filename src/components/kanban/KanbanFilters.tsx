import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Sprint = Database["public"]["Tables"]["sprints"]["Row"];

interface KanbanFiltersProps {
  members: { user_id: string; profiles: Profile }[];
  sprints?: Sprint[];
  onFiltersChange: (filters: FilterState) => void;
}

export interface FilterState {
  assignee: string | null;
  priority: string | null;
  dueDate: string | null;
  sprint: string | null;
}

const priorityLabels: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

const dueDateLabels: Record<string, string> = {
  overdue: "Atrasado",
  today: "Hoje",
  week: "Esta semana",
  no_date: "Sem prazo",
};

export function KanbanFilters({ members, sprints = [], onFiltersChange }: KanbanFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    assignee: null,
    priority: null,
    dueDate: null,
    sprint: null,
  });

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const updateFilter = (key: keyof FilterState, value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "all" ? null : value,
    }));
  };

  const clearFilters = () => {
    setFilters({ assignee: null, priority: null, dueDate: null, sprint: null });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span className="hidden sm:inline">Filtros</span>
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="h-5 px-1.5">
            {activeFiltersCount}
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 flex-1">
        <Select
          value={filters.assignee || "all"}
          onValueChange={(v) => updateFilter("assignee", v)}
        >
          <SelectTrigger className="w-[130px] sm:w-[180px] h-9 text-xs sm:text-sm">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="unassigned">Não atribuído</SelectItem>
            {members.map((member) => (
              <SelectItem key={member.user_id} value={member.user_id}>
                {member.profiles.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.priority || "all"}
          onValueChange={(v) => updateFilter("priority", v)}
        >
          <SelectTrigger className="w-[110px] sm:w-[140px] h-9 text-xs sm:text-sm">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(priorityLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.dueDate || "all"}
          onValueChange={(v) => updateFilter("dueDate", v)}
        >
          <SelectTrigger className="w-[110px] sm:w-[150px] h-9 text-xs sm:text-sm">
            <SelectValue placeholder="Prazo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(dueDateLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {sprints.length > 0 && (
          <Select
            value={filters.sprint || "all"}
            onValueChange={(v) => updateFilter("sprint", v)}
          >
            <SelectTrigger className="w-[130px] sm:w-[180px] h-9 text-xs sm:text-sm">
              <SelectValue placeholder="Sprint" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as sprints</SelectItem>
              <SelectItem value="no_sprint">Sem sprint</SelectItem>
              {sprints.map((sprint) => (
                <SelectItem key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {activeFiltersCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-9"
        >
          <X className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Limpar</span>
        </Button>
      )}
    </div>
  );
}
