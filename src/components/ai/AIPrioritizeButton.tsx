import { Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AIPrioritizeButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
  taskCount: number;
}

export function AIPrioritizeButton({ onClick, isLoading, disabled, taskCount }: AIPrioritizeButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={onClick}
            disabled={disabled || isLoading || taskCount === 0}
            className="gap-1.5 text-xs sm:text-sm"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
            {isLoading ? "Analisando..." : "🤖 Sugerir Prioridades"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>IA analisa prazos, prioridades e padrões para sugerir reordenação ({taskCount} tarefas)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
