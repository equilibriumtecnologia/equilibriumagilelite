import { Bot, Loader2, Lock } from "lucide-react";
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
  isAIAvailable?: boolean;
}

export function AIPrioritizeButton({ onClick, isLoading, disabled, taskCount, isAIAvailable = true }: AIPrioritizeButtonProps) {
  const isBlocked = !isAIAvailable;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={isBlocked ? undefined : onClick}
            disabled={isBlocked || disabled || isLoading || taskCount === 0}
            className="gap-1.5 text-xs sm:text-sm"
          >
            {isBlocked ? (
              <Lock className="h-4 w-4" />
            ) : isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
            {isBlocked ? "🤖 IA (Standard+)" : isLoading ? "Analisando..." : "🤖 Sugerir Prioridades"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isBlocked ? (
            <p>Funcionalidade disponível a partir do plano Standard. Faça upgrade para utilizar.</p>
          ) : (
            <p>IA analisa prazos, prioridades e padrões para sugerir reordenação ({taskCount} tarefas)</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
