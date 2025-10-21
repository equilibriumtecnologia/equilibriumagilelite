import { useInvitations } from "@/hooks/useInvitations";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, RefreshCw, X, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig = {
  pending: {
    label: "Pendente",
    icon: Clock,
    variant: "secondary" as const,
  },
  accepted: {
    label: "Aceito",
    icon: CheckCircle,
    variant: "default" as const,
  },
  expired: {
    label: "Expirado",
    icon: XCircle,
    variant: "destructive" as const,
  },
  cancelled: {
    label: "Cancelado",
    icon: XCircle,
    variant: "outline" as const,
  },
};

export function InvitationsList() {
  const { invitations, loading, cancelInvitation, resendInvitation } = useInvitations();

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Carregando convites...
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Mail className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum convite enviado</h3>
        <p className="text-muted-foreground">
          Convide novos usuários para colaborar nos seus projetos
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {invitations.map((invitation) => {
        const config = statusConfig[invitation.status as keyof typeof statusConfig];
        const StatusIcon = config.icon;
        const isExpired = new Date(invitation.expires_at) < new Date();
        const isPending = invitation.status === "pending" && !isExpired;

        return (
          <Card key={invitation.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{invitation.email}</p>
                    {invitation.project && (
                      <p className="text-sm text-muted-foreground">
                        Projeto: {invitation.project.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={config.variant}>
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {config.label}
                  </Badge>
                  <Badge variant="outline">
                    {invitation.role === "admin" ? "Admin" : "Membro"}
                  </Badge>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>
                    Enviado em:{" "}
                    {format(new Date(invitation.created_at), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                  <p>
                    Expira em:{" "}
                    {format(new Date(invitation.expires_at), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                  {invitation.accepted_at && (
                    <p className="text-success">
                      Aceito em:{" "}
                      {format(new Date(invitation.accepted_at), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  )}
                </div>
              </div>

              {isPending && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resendInvitation(invitation.id)}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => cancelInvitation(invitation.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
