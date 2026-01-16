import { InviteUserDialog } from "@/components/invitations/InviteUserDialog";
import { InvitationsList } from "@/components/invitations/InvitationsList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserRole } from "@/hooks/useUserRole";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

const Invitations = () => {
  const { canManageInvitations, loading: roleLoading } = useUserRole();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Convites</h1>
          <p className="text-muted-foreground">
            Gerencie convites para novos usuários
          </p>
        </div>
        {!roleLoading && canManageInvitations && <InviteUserDialog />}
      </div>

      {!roleLoading && !canManageInvitations && (
        <Alert variant="destructive" className="mb-6">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            Apenas administradores e masters podem enviar convites.
          </AlertDescription>
        </Alert>
      )}

      {/* Content */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="accepted">Aceitos</TabsTrigger>
          <TabsTrigger value="expired">Expirados</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelados</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <InvitationsList statusFilter="all" />
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <InvitationsList statusFilter="pending" />
        </TabsContent>

        <TabsContent value="accepted" className="mt-6">
          <InvitationsList statusFilter="accepted" />
        </TabsContent>

        <TabsContent value="expired" className="mt-6">
          <InvitationsList statusFilter="expired" />
        </TabsContent>

        <TabsContent value="cancelled" className="mt-6">
          <InvitationsList statusFilter="cancelled" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Invitations;
