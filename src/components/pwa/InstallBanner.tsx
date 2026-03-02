import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useNavigate } from "react-router-dom";

const DISMISS_KEY = "pwa-install-banner-dismissed";

export function InstallBanner() {
  const { canInstall, isStandalone, isIOS, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const wasDismissed = localStorage.getItem(DISMISS_KEY);
    setDismissed(!!wasDismissed);
  }, []);

  if (isStandalone || dismissed) return null;
  if (!canInstall && !isIOS) return null;

  const handleInstall = async () => {
    if (canInstall) {
      await promptInstall();
    } else if (isIOS) {
      navigate("/install");
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg mx-3 sm:mx-4 md:mx-8 mt-3 p-3 flex items-center gap-3">
      <Smartphone className="h-5 w-5 text-primary shrink-0" />
      <p className="text-sm flex-1 text-foreground">
        Instale o <strong>Agile Lite</strong> para acesso rápido e notificações push.
      </p>
      <Button size="sm" variant="default" onClick={handleInstall} className="shrink-0 gap-1.5">
        <Download className="h-3.5 w-3.5" />
        Instalar
      </Button>
      <button
        onClick={handleDismiss}
        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        aria-label="Fechar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
