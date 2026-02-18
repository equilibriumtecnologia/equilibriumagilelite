import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, CheckCircle, Building2, FolderKanban } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PendingInvitation {
  id: string;
  token: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
  invited_by_name: string;
  project_name: string | null;
  project_id: string | null;
  workspace_name: string;
  workspace_id: string;
}

export function PendingInvitations() {
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase.rpc("get_my_pending_invitations");
      if (error) throw error;
      setInvitations((data as unknown as PendingInvitation[]) || []);
    } catch (err: any) {
      console.error("Erro ao carregar convites:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleAccept = async (invitation: PendingInvitation) => {
    try {
      setAccepting(invitation.id);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc("accept_invitation", {
        _token: invitation.token,
        _user_id: user.id,
      });

      if (error) throw error;

      const result = data as unknown as { success: boolean; error?: string; project_id?: string };

      if (!result.success) {
        toast.error(result.error || "Erro ao aceitar convite");
        return;
      }

      toast.success("Convite aceito com sucesso!");
      await fetchInvitations();

      if (result.project_id) {
        navigate(`/projects/${result.project_id}`);
      }
    } catch (err: any) {
      toast.error("Erro ao aceitar convite: " + err.message);
    } finally {
      setAccepting(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="px-4 sm:px-6 pb-3">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg sm:text-xl">Convites Pendentes</CardTitle>
        </div>
        <CardDescription className="text-xs sm:text-sm">
          Você possui {invitations.length} convite{invitations.length > 1 ? "s" : ""} pendente{invitations.length > 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-4 sm:px-6">
        {invitations.map((inv) => (
          <div
            key={inv.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-background rounded-lg border"
          >
            <div className="space-y-1">
              <p className="font-medium text-sm">
                Convite de <span className="text-primary">{inv.invited_by_name}</span>
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {inv.workspace_name}
                </span>
                {inv.project_name && (
                  <span className="flex items-center gap-1">
                    <FolderKanban className="h-3 w-3" />
                    {inv.project_name}
                  </span>
                )}
                <Badge variant="outline" className="text-xs">
                  {inv.role === "admin" ? "Administrador" : "Membro"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Enviado {formatDistanceToNow(new Date(inv.created_at), { addSuffix: true, locale: ptBR })}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => handleAccept(inv)}
              disabled={accepting === inv.id}
            >
              {accepting === inv.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-1" />
              )}
              Aceitar
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
