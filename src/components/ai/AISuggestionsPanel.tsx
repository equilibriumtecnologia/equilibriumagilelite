import { Check, X, ArrowUp, ArrowDown, Minus, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AISuggestion } from "@/hooks/useAIPrioritization";

interface AISuggestionsPanelProps {
  suggestions: AISuggestion[];
  summary: string;
  onAccept: () => void;
  onDismiss: () => void;
}

const priorityColors: Record<string, string> = {
  urgent: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500/20 text-orange-700 dark:text-orange-300",
  medium: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300",
  low: "bg-muted text-muted-foreground",
};

export function AISuggestionsPanel({ suggestions, summary, onAccept, onDismiss }: AISuggestionsPanelProps) {
  const sorted = [...suggestions].sort((a, b) => a.new_position - b.new_position);

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          Sugestões da IA
        </CardTitle>
        <p className="text-xs text-muted-foreground">{summary}</p>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
          {sorted.map((s, idx) => {
            const moved = s.new_position - s.task_index;
            return (
              <TooltipProvider key={s.task_id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 p-2 rounded-md bg-background border text-xs cursor-default hover:bg-accent/50 transition-colors">
                      <span className="font-mono text-muted-foreground w-5 text-center">
                        {idx + 1}
                      </span>
                      <span className="flex-1 truncate font-medium">{s.task_title}</span>
                      <Badge className={`text-[10px] ${priorityColors[s.suggested_priority] || ""}`}>
                        {s.suggested_priority}
                      </Badge>
                      {moved < 0 && <ArrowUp className="h-3 w-3 text-green-500" />}
                      {moved > 0 && <ArrowDown className="h-3 w-3 text-red-500" />}
                      {moved === 0 && <Minus className="h-3 w-3 text-muted-foreground" />}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[280px]">
                    <p className="text-xs">{s.reasoning}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </CardContent>
      <CardFooter className="gap-2 pt-2">
        <Button size="sm" onClick={onAccept} className="gap-1.5 flex-1">
          <Check className="h-3.5 w-3.5" /> Aceitar
        </Button>
        <Button size="sm" variant="outline" onClick={onDismiss} className="gap-1.5 flex-1">
          <X className="h-3.5 w-3.5" /> Descartar
        </Button>
      </CardFooter>
    </Card>
  );
}
