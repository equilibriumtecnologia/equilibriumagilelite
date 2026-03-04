import { useProjectTemplates, type ProjectTemplate } from "@/hooks/useProjectTemplates";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Code, Megaphone, LayoutGrid, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplateSelectorProps {
  selectedId: string | null;
  onSelect: (template: ProjectTemplate | null) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  development: <Code className="h-5 w-5" />,
  marketing: <Megaphone className="h-5 w-5" />,
  custom: <LayoutGrid className="h-5 w-5" />,
};

const categoryLabels: Record<string, string> = {
  development: "Desenvolvimento",
  marketing: "Marketing",
  custom: "Genérico",
};

export function TemplateSelector({ selectedId, onSelect }: TemplateSelectorProps) {
  const { templates, isLoading } = useProjectTemplates();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Option: No template */}
      <Card
        className={cn(
          "cursor-pointer border-2 transition-all hover:border-primary/50",
          selectedId === null ? "border-primary bg-primary/5" : "border-transparent"
        )}
        onClick={() => onSelect(null)}
      >
        <CardContent className="flex items-center gap-3 p-3">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            selectedId === null ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            {selectedId === null ? <Check className="h-5 w-5" /> : <LayoutGrid className="h-5 w-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Projeto em Branco</p>
            <p className="text-xs text-muted-foreground">Começar do zero, sem configurações pré-definidas</p>
          </div>
        </CardContent>
      </Card>

      {templates.map((template) => {
        const isSelected = selectedId === template.id;
        const cat = template.category || "custom";
        const config = template.config;

        return (
          <Card
            key={template.id}
            className={cn(
              "cursor-pointer border-2 transition-all hover:border-primary/50",
              isSelected ? "border-primary bg-primary/5" : "border-transparent"
            )}
            onClick={() => onSelect(template)}
          >
            <CardContent className="flex items-center gap-3 p-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {isSelected ? <Check className="h-5 w-5" /> : categoryIcons[cat] || <LayoutGrid className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{template.name}</p>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                    {categoryLabels[cat] || cat}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">{template.description}</p>
                {config.sample_tasks?.length > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {config.sample_tasks.length} tarefas exemplo • {Object.keys(config.wip_limits || {}).length > 0 ? "WIP limits" : "Sem WIP limits"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
