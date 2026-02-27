import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, FileText, Code, FileCode } from "lucide-react";

export interface InfoBlock {
  id: string;
  title: string;
  type: "text" | "markdown" | "code";
  content: string;
}

interface InfoBlocksEditorProps {
  blocks: InfoBlock[];
  onChange: (blocks: InfoBlock[]) => void;
}

const typeLabels: Record<InfoBlock["type"], string> = {
  text: "Texto",
  markdown: "Markdown",
  code: "Código",
};

const typeIcons: Record<InfoBlock["type"], React.ReactNode> = {
  text: <FileText className="h-4 w-4" />,
  markdown: <FileCode className="h-4 w-4" />,
  code: <Code className="h-4 w-4" />,
};

const MAX_BLOCKS = 5;

export function InfoBlocksEditor({ blocks, onChange }: InfoBlocksEditorProps) {
  const addBlock = () => {
    if (blocks.length >= MAX_BLOCKS) return;
    const newBlock: InfoBlock = {
      id: crypto.randomUUID(),
      title: "",
      type: "text",
      content: "",
    };
    onChange([...blocks, newBlock]);
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter((b) => b.id !== id));
  };

  const updateBlock = (id: string, field: keyof InfoBlock, value: string) => {
    onChange(
      blocks.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Informações Adicionais</Label>
        <span className="text-xs text-muted-foreground">
          {blocks.length}/{MAX_BLOCKS}
        </span>
      </div>

      {blocks.map((block, index) => (
        <div
          key={block.id}
          className="space-y-2 rounded-lg border border-border bg-muted/30 p-3"
        >
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                placeholder="Título do bloco (obrigatório)"
                value={block.title}
                onChange={(e) => updateBlock(block.id, "title", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <Select
              value={block.type}
              onValueChange={(v) =>
                updateBlock(block.id, "type", v as InfoBlock["type"])
              }
            >
              <SelectTrigger className="w-[130px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3 w-3" /> Texto
                  </span>
                </SelectItem>
                <SelectItem value="markdown">
                  <span className="flex items-center gap-1.5">
                    <FileCode className="h-3 w-3" /> Markdown
                  </span>
                </SelectItem>
                <SelectItem value="code">
                  <span className="flex items-center gap-1.5">
                    <Code className="h-3 w-3" /> Código
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => removeBlock(block.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            placeholder={
              block.type === "code"
                ? "Cole seu código aqui..."
                : block.type === "markdown"
                ? "Escreva em markdown..."
                : "Digite o conteúdo..."
            }
            value={block.content}
            onChange={(e) => updateBlock(block.id, "content", e.target.value)}
            className={`min-h-[80px] text-sm ${
              block.type === "code" ? "font-mono" : ""
            }`}
          />
        </div>
      ))}

      {blocks.length < MAX_BLOCKS && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={addBlock}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Adicionar Informação
        </Button>
      )}
    </div>
  );
}
