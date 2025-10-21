import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

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
      // Buscar convite pelo token (sem autenticação)
      const { data, error } = await supabase
        .from("invitations")
        .select(`
          *,
          invited_by_profile:profiles!invitations_invited_by_fkey(full_name),
          project:projects(name)
        `)
        .eq("token", token)
        .single();

      if (error) throw error;

      // Verificar se convite é válido
      if (data.status !== "pending") {
        setError("Este convite já foi utilizado ou cancelado");
        setLoading(false);
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setError("Este convite expirou");
        setLoading(false);
        return;
      }

      setInvitation(data);
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
            <p className="font-medium">{invitation?.email}</p>
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
