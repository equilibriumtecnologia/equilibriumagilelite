import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { useBoardSettings } from "@/hooks/useBoardSettings";

interface Column {
  id: string;
  title: string;
  color: string;
}

interface WIPLimitSettingsProps {
  projectId: string;
  columns: Column[];
}

export function WIPLimitSettings({ projectId, columns }: WIPLimitSettingsProps) {
  const [open, setOpen] = useState(false);
  const { settings, upsertSetting, getWipLimit } = useBoardSettings(projectId);
  const [localLimits, setLocalLimits] = useState<Record<string, string>>({});

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      // Initialize local limits from settings
      const limits: Record<string, string> = {};
      columns.forEach((col) => {
        const limit = getWipLimit(col.id);
        limits[col.id] = limit?.toString() || "";
      });
      setLocalLimits(limits);
    }
  };

  const handleSave = async () => {
    for (const column of columns) {
      const value = localLimits[column.id];
      const limit = value === "" ? null : parseInt(value, 10);
      
      if (value !== "" && (isNaN(limit!) || limit! < 1)) {
        continue; // Skip invalid values
      }

      const currentLimit = getWipLimit(column.id);
      if (limit !== currentLimit) {
        await upsertSetting.mutateAsync({
          columnId: column.id,
          wipLimit: limit,
        });
      }
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          WIP Limits
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurar Limites WIP</DialogTitle>
          <DialogDescription>
            Defina o número máximo de tarefas por coluna. Deixe vazio para sem limite.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {columns.map((column) => (
            <div key={column.id} className="flex items-center gap-4">
              <div className="flex items-center gap-2 flex-1">
                <div className={`w-3 h-3 rounded-full ${column.color}`} />
                <Label htmlFor={`wip-${column.id}`} className="flex-1">
                  {column.title}
                </Label>
              </div>
              <Input
                id={`wip-${column.id}`}
                type="number"
                min="1"
                placeholder="∞"
                className="w-20"
                value={localLimits[column.id] || ""}
                onChange={(e) =>
                  setLocalLimits((prev) => ({
                    ...prev,
                    [column.id]: e.target.value,
                  }))
                }
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={upsertSetting.isPending}>
            {upsertSetting.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
