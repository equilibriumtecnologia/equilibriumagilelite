import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings2 } from "lucide-react";
import { useBoardSettings } from "@/hooks/useBoardSettings";

interface ColumnConfig {
  id: string;
  defaultTitle: string;
  defaultColor: string;
}

interface ColumnCustomizeDialogProps {
  projectId: string;
  columns: ColumnConfig[];
}

const presetColors = [
  "bg-blue-500", "bg-yellow-500", "bg-purple-500", "bg-green-500",
  "bg-red-500", "bg-orange-500", "bg-pink-500", "bg-cyan-500",
  "bg-indigo-500", "bg-emerald-500", "bg-rose-500", "bg-teal-500",
];

export function ColumnCustomizeDialog({ projectId, columns }: ColumnCustomizeDialogProps) {
  const { getColumnLabel, getColumnColor, upsertSetting } = useBoardSettings(projectId);
  const [open, setOpen] = useState(false);
  const [localValues, setLocalValues] = useState<Record<string, { label: string; color: string }>>({});

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      // Initialize with current values
      const values: Record<string, { label: string; color: string }> = {};
      columns.forEach((col) => {
        values[col.id] = {
          label: getColumnLabel(col.id) || col.defaultTitle,
          color: getColumnColor(col.id) || col.defaultColor,
        };
      });
      setLocalValues(values);
    }
    setOpen(isOpen);
  };

  const handleSave = async () => {
    for (const col of columns) {
      const local = localValues[col.id];
      if (!local) continue;
      const currentLabel = getColumnLabel(col.id);
      const currentColor = getColumnColor(col.id);
      const newLabel = local.label === col.defaultTitle ? null : local.label;
      const newColor = local.color === col.defaultColor ? null : local.color;
      if (newLabel !== currentLabel || newColor !== currentColor) {
        await upsertSetting.mutateAsync({ columnId: col.id, label: newLabel, color: newColor });
      }
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Settings2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Customizar Colunas</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Customizar Colunas do Kanban</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          {columns.map((col) => {
            const local = localValues[col.id] || { label: col.defaultTitle, color: col.defaultColor };
            return (
              <div key={col.id} className="space-y-2">
                <Label className="text-xs text-muted-foreground">{col.defaultTitle}</Label>
                <Input
                  value={local.label}
                  onChange={(e) =>
                    setLocalValues((prev) => ({
                      ...prev,
                      [col.id]: { ...prev[col.id], label: e.target.value },
                    }))
                  }
                  placeholder={col.defaultTitle}
                  className="h-8 text-sm"
                />
                <div className="flex gap-1.5 flex-wrap">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      className={`w-6 h-6 rounded-full ${color} transition-all ${
                        local.color === color ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110" : "hover:scale-110"
                      }`}
                      onClick={() =>
                        setLocalValues((prev) => ({
                          ...prev,
                          [col.id]: { ...prev[col.id], color },
                        }))
                      }
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={upsertSetting.isPending}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
