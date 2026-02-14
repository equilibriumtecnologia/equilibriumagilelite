import { InviteUserDialog } from "@/components/invitations/InviteUserDialog";
import { InvitationsList } from "@/components/invitations/InvitationsList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserRole } from "@/hooks/useUserRole";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const Invitations = () => {
  const { canManageInvitations, loading: roleLoading } = useUserRole();

  return (
    <div className="px-3 sm:px-4 md:px-8 py-4 sm:py-6 md:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Convites</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie convites para novos usuários
          </p>
        </div>
        {!roleLoading && canManageInvitations && <InviteUserDialog />}
      </div>

      {!roleLoading && !canManageInvitations && (
        <Alert variant="destructive" className="mb-4 sm:mb-6">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Apenas administradores e masters podem enviar convites.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="all" className="w-full">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-auto">
            <TabsTrigger value="all" className="text-xs sm:text-sm">Todos</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs sm:text-sm">Pendentes</TabsTrigger>
            <TabsTrigger value="accepted" className="text-xs sm:text-sm">Aceitos</TabsTrigger>
            <TabsTrigger value="expired" className="text-xs sm:text-sm">Expirados</TabsTrigger>
            <TabsTrigger value="cancelled" className="text-xs sm:text-sm">Cancelados</TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="all" className="mt-4 sm:mt-6"><InvitationsList statusFilter="all" /></TabsContent>
        <TabsContent value="pending" className="mt-4 sm:mt-6"><InvitationsList statusFilter="pending" /></TabsContent>
        <TabsContent value="accepted" className="mt-4 sm:mt-6"><InvitationsList statusFilter="accepted" /></TabsContent>
        <TabsContent value="expired" className="mt-4 sm:mt-6"><InvitationsList statusFilter="expired" /></TabsContent>
        <TabsContent value="cancelled" className="mt-4 sm:mt-6"><InvitationsList statusFilter="cancelled" /></TabsContent>
      </Tabs>
    </div>
  );
};

export default Invitations;
