import { Badge } from "@/components/ui/badge";
import { FileText, Code, FileCode } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { InfoBlock } from "./InfoBlocksEditor";

interface InfoBlocksViewerProps {
  blocks: InfoBlock[];
}

const typeConfig: Record<
  InfoBlock["type"],
  { label: string; icon: React.ReactNode; className: string }
> = {
  text: {
    label: "Texto",
    icon: <FileText className="h-3 w-3" />,
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  markdown: {
    label: "Markdown",
    icon: <FileCode className="h-3 w-3" />,
    className: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  },
  code: {
    label: "Código",
    icon: <Code className="h-3 w-3" />,
    className: "bg-green-500/10 text-green-500 border-green-500/20",
  },
};

export function InfoBlocksViewer({ blocks }: InfoBlocksViewerProps) {
  if (!blocks || blocks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Nenhuma informação adicional adicionada.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {blocks.map((block) => {
        const config = typeConfig[block.type] || typeConfig.text;
        return (
          <div
            key={block.id}
            className="rounded-lg border border-border overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border">
              <Badge variant="outline" className={config.className}>
                {config.icon}
                <span className="ml-1">{config.label}</span>
              </Badge>
              <span className="text-sm font-medium">{block.title}</span>
            </div>
            <div className="p-3">
              {block.type === "code" ? (
                <pre className="text-sm font-mono bg-muted/50 rounded p-3 overflow-x-auto whitespace-pre-wrap break-words">
                  <code>{block.content}</code>
                </pre>
              ) : block.type === "markdown" ? (
                <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{block.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{block.content}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
