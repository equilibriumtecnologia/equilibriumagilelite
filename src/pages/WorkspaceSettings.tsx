import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useWorkspaceMembers } from "@/hooks/useWorkspaceMembers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkspaceGeneralSettings } from "@/components/workspace/WorkspaceGeneralSettings";
import { WorkspaceMembersTable } from "@/components/workspace/WorkspaceMembersTable";
import { Building2, Loader2 } from "lucide-react";

export default function WorkspaceSettings() {
  const { user } = useAuth();
  const { currentWorkspace, loading: wsLoading } = useWorkspace();
  const { members, loading: membersLoading } = useWorkspaceMembers();

  const currentMember = members.find((m) => m.user_id === user?.id);
  const isOwnerOrAdmin = currentMember?.role === "owner" || currentMember?.role === "admin";

  if (wsLoading || membersLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
        <Building2 className="h-12 w-12" />
        <p>Nenhum workspace selecionado</p>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 md:px-8 py-4 sm:py-6 max-w-4xl mx-auto">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Workspace</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Gerencie <strong>{currentWorkspace.name}</strong>
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4 sm:space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="text-xs sm:text-sm">Geral</TabsTrigger>
          <TabsTrigger value="members" className="text-xs sm:text-sm">Membros ({members.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          {isOwnerOrAdmin ? (
            <WorkspaceGeneralSettings />
          ) : (
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl">Informações do Workspace</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Detalhes do workspace atual</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm px-4 sm:px-6">
                <p><strong>Nome:</strong> {currentWorkspace.name}</p>
                <p><strong>Slug:</strong> {currentWorkspace.slug}</p>
                {currentWorkspace.description && (
                  <p><strong>Descrição:</strong> {currentWorkspace.description}</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-lg sm:text-xl">Membros do Workspace</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Gerencie membros e seus papéis</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <WorkspaceMembersTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
