import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ThankYou() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate("/"), 10000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <meta name="robots" content="noindex, nofollow" />
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-3">Obrigado!</h1>
        <p className="text-muted-foreground mb-6">
          Recebemos sua solicitação e nossa equipe entrará em contato em breve com uma proposta personalizada.
        </p>
        <Link to="/">
          <Button>
            Ir para o início <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <p className="text-xs text-muted-foreground mt-4">
          Você será redirecionado automaticamente em 10 segundos.
        </p>
      </div>
    </div>
  );
}
