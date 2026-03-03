import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCsv } from "@/lib/exportCsv";
import { useToast } from "@/hooks/use-toast";

interface ExportButtonProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  filename: string;
  headers?: Record<string, string>;
  label?: string;
}

export function ExportButton({ data, filename, headers, label = "Exportar CSV" }: ExportButtonProps) {
  const { toast } = useToast();

  const handleExport = () => {
    if (data.length === 0) {
      toast({ title: "Sem dados", description: "Não há dados para exportar.", variant: "destructive" });
      return;
    }
    exportToCsv(filename, data, headers);
    toast({ title: "Exportado!", description: `${filename}.csv baixado com sucesso.` });
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
      <Download className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
