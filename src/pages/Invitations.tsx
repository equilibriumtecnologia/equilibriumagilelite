import { InviteUserDialog } from "@/components/invitations/InviteUserDialog";
import { InvitationsList } from "@/components/invitations/InvitationsList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Invitations = () => {
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
        <InviteUserDialog />
      </div>

      {/* Content */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="accepted">Aceitos</TabsTrigger>
          <TabsTrigger value="expired">Expirados</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <InvitationsList />
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <InvitationsList />
        </TabsContent>

        <TabsContent value="accepted" className="mt-6">
          <InvitationsList />
        </TabsContent>

        <TabsContent value="expired" className="mt-6">
          <InvitationsList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Invitations;
