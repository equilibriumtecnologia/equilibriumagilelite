import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Download, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useDowngradeQueue } from "@/hooks/useDowngradeQueue";
import { toast } from "sonner";
import { useState } from "react";

export function DowngradeQueueBanner() {
  const { queueItems, hasGracePeriodItems, hasSuspendedItems, getGracePeriodEnd, exportWorkspace } = useDowngradeQueue();
  const [exporting, setExporting] = useState<string | null>(null);

  if (queueItems.length === 0) return null;

  const graceEnd = getGracePeriodEnd();
  const daysLeft = graceEnd 
    ? Math.max(0, Math.ceil((new Date(graceEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const ownedInGrace = queueItems.filter(i => i.item_type === "owned_workspace" && i.status === "grace_period");
  const guestInGrace = queueItems.filter(i => i.item_type === "guest_workspace" && i.status === "grace_period");
  const projectsInGrace = queueItems.filter(i => i.item_type === "exceeding_project" && i.status === "grace_period");
  const suspended = queueItems.filter(i => i.status === "suspended" || i.status === "exported");

  const handleExport = async (workspaceId: string) => {
    try {
      setExporting(workspaceId);
      const result = await exportWorkspace(workspaceId);
      if (result.download_url) {
        window.open(result.download_url, "_blank");
        toast.success("Export gerado com sucesso!");
      }
    } catch (err) {
      toast.error("Erro ao exportar dados");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-2">
      {hasGracePeriodItems && (
        <Alert variant="destructive" className="bg-warning/10 border-warning/30 text-foreground">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              <span className="font-semibold text-sm">
                Período de carência: {daysLeft} dia(s) restante(s)
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Seu plano foi alterado e alguns recursos excedem os limites. 
              Durante a carência, eles ficam em modo somente-leitura. 
              Faça upgrade para manter o acesso completo.
            </p>

            {ownedInGrace.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium mb-1">
                  Workspaces próprios em carência ({ownedInGrace.length}):
                </p>
                {ownedInGrace.map(item => (
                  <div key={item.id} className="flex items-center gap-2 text-xs ml-2">
                    <span>• WS ID: {item.workspace_id?.slice(0, 8)}...</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => item.workspace_id && handleExport(item.workspace_id)}
                      disabled={exporting === item.workspace_id}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      {exporting === item.workspace_id ? "Exportando..." : "Exportar"}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {guestInGrace.length > 0 && (
              <p className="text-xs mt-1">
                {guestInGrace.length} workspace(s) convidado(s) perderão acesso após a carência.
              </p>
            )}

            {projectsInGrace.length > 0 && (
              <p className="text-xs mt-1">
                {projectsInGrace.length} projeto(s) em modo somente-leitura.
              </p>
            )}

            <div className="flex gap-2 mt-2">
              <Link to="/pricing">
                <Button variant="outline" size="sm" className="text-xs h-7 border-warning/40 hover:bg-warning/10">
                  Fazer Upgrade
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {hasSuspendedItems && !hasGracePeriodItems && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/30 text-foreground">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription>
            <p className="text-sm font-medium">Recursos suspensos</p>
            <p className="text-xs text-muted-foreground mt-1">
              {suspended.length} recurso(s) foram suspensos por exceder os limites do plano. 
              Faça upgrade para restaurá-los. Os dados serão excluídos permanentemente após 60 dias.
            </p>
            <Link to="/pricing">
              <Button variant="outline" size="sm" className="text-xs h-7 mt-2 border-destructive/40 hover:bg-destructive/10">
                Fazer Upgrade
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
