import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { KanbanTaskCard } from "./KanbanTaskCard";
import { WIPLimitBadge } from "./WIPLimitBadge";
import type { Database } from "@/integrations/supabase/types";

type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
  assigned_to_profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
  created_by_profile: Database["public"]["Tables"]["profiles"]["Row"];
};

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
  count: number;
  wipLimit: number | null;
  wipStatus: "normal" | "warning" | "exceeded";
}

export function KanbanColumn({
  id,
  title,
  color,
  tasks,
  count,
  wipLimit,
  wipStatus,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color}`} />
          <h3 className="font-semibold">{title}</h3>
        </div>
        <WIPLimitBadge count={count} limit={wipLimit} status={wipStatus} />
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-col gap-3 min-h-[400px] p-3 rounded-lg border-2 border-dashed transition-colors",
          isOver ? "border-primary bg-primary/5" : "border-border bg-muted/20",
          wipStatus === "warning" && "border-yellow-500/50 bg-yellow-500/5",
          wipStatus === "exceeded" && "border-destructive/50 bg-destructive/5"
        )}
      >
        {tasks.map((task) => (
          <KanbanTaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Nenhuma tarefa
          </div>
        )}
      </div>
    </div>
  );
}
