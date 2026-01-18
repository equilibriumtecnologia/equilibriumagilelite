import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

/**
 * AuthCallback - Página dedicada para processar callbacks de autenticação
 * 
 * Handles:
 * - Email verification (signup confirmation)
 * - Password recovery
 * - Magic links
 * 
 * O Supabase redireciona para cá com tokens no hash ou query params.
 * Esta página processa silenciosamente e redireciona para o destino apropriado.
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Processando autenticação...");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for error in URL params (Supabase auth errors)
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        if (error) {
          console.error("Auth callback error:", error, errorDescription);
          setStatus("error");
          setMessage("Erro na verificação");
          setErrorDetails(errorDescription || error);
          return;
        }

        // Check for auth tokens in hash fragment
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");

        // Also check query params (some auth flows use query instead of hash)
        const tokenHash = searchParams.get("token_hash");
        const queryType = searchParams.get("type");

        console.log("Auth callback params:", { 
          hasAccessToken: !!accessToken, 
          type, 
          tokenHash: !!tokenHash, 
          queryType 
        });

        if (accessToken && refreshToken) {
          // Token-based callback (email verification, magic link)
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error("Error setting session:", sessionError);
            setStatus("error");
            setMessage("Erro ao processar verificação");
            setErrorDetails(sessionError.message);
            return;
          }

          console.log("Session set successfully:", data.user?.email);
          
          // Determine success message based on type
          if (type === "signup" || type === "email") {
            setMessage("Email verificado com sucesso!");
          } else if (type === "recovery") {
            setMessage("Autenticação realizada!");
          } else {
            setMessage("Autenticação realizada com sucesso!");
          }

          setStatus("success");

          // Redirect after brief delay to show success
          setTimeout(() => {
            navigate("/dashboard", { replace: true });
          }, 1500);

        } else if (tokenHash && queryType) {
          // PKCE flow or other token hash based auth
          // Let Supabase handle this automatically via onAuthStateChange
          const { data: { session }, error: getSessionError } = await supabase.auth.getSession();
          
          if (getSessionError) {
            console.error("Error getting session:", getSessionError);
            setStatus("error");
            setMessage("Erro ao processar verificação");
            setErrorDetails(getSessionError.message);
            return;
          }

          if (session) {
            setStatus("success");
            setMessage("Email verificado com sucesso!");
            setTimeout(() => {
              navigate("/dashboard", { replace: true });
            }, 1500);
          } else {
            // Session might not be ready yet, wait for onAuthStateChange
            const timeout = setTimeout(() => {
              // If no session after 5 seconds, show error
              setStatus("error");
              setMessage("Não foi possível completar a verificação");
              setErrorDetails("Sessão não encontrada. Tente fazer login novamente.");
            }, 5000);

            // Listen for auth state change
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
              if (event === "SIGNED_IN" && session) {
                clearTimeout(timeout);
                setStatus("success");
                setMessage("Email verificado com sucesso!");
                setTimeout(() => {
                  navigate("/dashboard", { replace: true });
                }, 1500);
                subscription.unsubscribe();
              }
            });

            return () => {
              clearTimeout(timeout);
              subscription.unsubscribe();
            };
          }
        } else {
          // No tokens found - check if user is already logged in
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            setStatus("success");
            setMessage("Você já está autenticado!");
            setTimeout(() => {
              navigate("/dashboard", { replace: true });
            }, 1500);
          } else {
            // No tokens and no session - redirect to login
            setStatus("error");
            setMessage("Link inválido ou expirado");
            setErrorDetails("Por favor, faça login ou solicite um novo link de verificação.");
          }
        }
      } catch (err: any) {
        console.error("Auth callback exception:", err);
        setStatus("error");
        setMessage("Erro inesperado");
        setErrorDetails(err.message);
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="p-8 max-w-md w-full text-center">
        {status === "processing" && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">{message}</h2>
            <p className="text-muted-foreground">Por favor, aguarde...</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">{message}</h2>
            <p className="text-muted-foreground">Redirecionando...</p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">{message}</h2>
            {errorDetails && (
              <p className="text-muted-foreground mb-6 text-sm">{errorDetails}</p>
            )}
            <div className="space-y-3">
              <Button 
                onClick={() => navigate("/login")} 
                className="w-full"
              >
                Ir para Login
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate("/")} 
                className="w-full"
              >
                Página Inicial
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default AuthCallback;
