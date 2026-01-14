import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface InvitationResponse {
  success: boolean;
  error?: string;
  data?: {
    id: string;
    email: string; // Masked email for display (e.g., "jo***@example.com")
    full_email: string; // Full email for validation
    project_id: string | null;
    role: string;
    status: string;
    expires_at: string;
    invited_by_name: string;
    project_name: string | null;
  };
}

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Token de convite não fornecido");
      setLoading(false);
      return;
    }

    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    try {
      // Buscar convite usando função RPC segura
      const { data, error } = await supabase.rpc("get_invitation_by_token", {
        _token: token,
      });

      if (error) throw error;

      const response = data as unknown as InvitationResponse;

      if (!response.success) {
        setError(response.error || "Convite não encontrado ou inválido");
        setLoading(false);
        return;
      }

      // Transformar dados para formato esperado
      const invitationData = {
        ...response.data,
        // Use full_email for validation, masked email for display
        displayEmail: response.data!.email, // Masked email for UI display
        email: response.data!.full_email, // Full email for validation
        invited_by_profile: { full_name: response.data!.invited_by_name },
        project: response.data!.project_name ? { name: response.data!.project_name } : null,
      };

      setInvitation(invitationData);
    } catch (err: any) {
      setError("Convite não encontrado ou inválido");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Redirecionar para signup com o email do convite
        navigate(`/signup?email=${encodeURIComponent(invitation.email)}&token=${token}`);
        return;
      }

      // Verificar se email do usuário corresponde ao convite
      if (user.email !== invitation.email) {
        toast.error("Este convite não é para o seu email");
        return;
      }

      // Aceitar convite via RPC
      const { data, error } = await supabase.rpc("accept_invitation", {
        _token: token,
        _user_id: user.id,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; project_id?: string };

      if (!result.success) {
        toast.error(result.error || "Erro ao aceitar convite");
        return;
      }

      toast.success("Convite aceito com sucesso!");

      // Redirecionar para projeto ou dashboard
      if (result.project_id) {
        navigate(`/projects/${result.project_id}`);
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error("Erro ao aceitar convite: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 max-w-md w-full text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-xl font-semibold mb-2">Carregando convite...</h2>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 max-w-md w-full text-center">
          <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Convite Inválido</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => navigate("/login")}>Ir para Login</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <CheckCircle className="mx-auto h-16 w-16 text-success mb-4" />
          <h1 className="text-2xl font-bold mb-2">Você foi convidado!</h1>
          <p className="text-muted-foreground">
            {invitation?.invited_by_profile?.full_name} convidou você para colaborar
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Email convidado</p>
            <p className="font-medium">{invitation?.displayEmail}</p>
          </div>

          {invitation?.project && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Projeto</p>
              <p className="font-medium">{invitation.project.name}</p>
            </div>
          )}

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Permissão</p>
            <p className="font-medium">
              {invitation?.role === "admin" ? "Administrador" : "Membro"}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button className="w-full" onClick={handleAccept}>
            Aceitar Convite
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/login")}
          >
            Cancelar
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AcceptInvitation;
