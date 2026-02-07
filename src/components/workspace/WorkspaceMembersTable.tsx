import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useWorkspaceMembers, WorkspaceMember } from "@/hooks/useWorkspaceMembers";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Crown, Shield, UserMinus, ArrowRightLeft } from "lucide-react";
import { Loader2 } from "lucide-react";

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: typeof Crown }> = {
  owner: { label: "Owner", color: "bg-amber-500/15 text-amber-700 border-amber-500/30", icon: Crown },
  admin: { label: "Admin", color: "bg-blue-500/15 text-blue-700 border-blue-500/30", icon: Shield },
  member: { label: "Membro", color: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30", icon: Shield },
  viewer: { label: "Viewer", color: "bg-muted text-muted-foreground border-border", icon: Shield },
};

export function WorkspaceMembersTable() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { members, loading, updateRole, removeMember, transferOwnership } = useWorkspaceMembers();
  const [transferTarget, setTransferTarget] = useState<WorkspaceMember | null>(null);

  const currentUserMember = members.find((m) => m.user_id === user?.id);
  const isOwner = currentUserMember?.role === "owner";
  const isAdmin = currentUserMember?.role === "admin";
  const canManage = isOwner || isAdmin;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getInitials = (name: string) =>
    name?.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() || "?";

  const handleTransfer = async () => {
    if (!transferTarget) return;
    await transferOwnership(transferTarget.user_id);
    setTransferTarget(null);
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Membro</TableHead>
            <TableHead>Role</TableHead>
            {canManage && <TableHead className="text-right">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const profile = member.profile;
            const isSelf = member.user_id === user?.id;
            const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
            const canEditRole = isOwner && !isSelf && member.role !== "owner";
            const canRemove = canManage && !isSelf && member.role !== "owner";
            const canTransfer = isOwner && !isSelf;

            return (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback className="text-xs">
                        {getInitials(profile?.full_name || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {profile?.full_name || "Sem nome"}
                        {isSelf && <span className="text-muted-foreground ml-1">(você)</span>}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {canEditRole ? (
                    <Select
                      value={member.role}
                      onValueChange={(value) => updateRole(member.id, value)}
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Membro</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline" className={roleConfig.color}>
                      {roleConfig.label}
                    </Badge>
                  )}
                </TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canTransfer && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Transferir propriedade"
                          onClick={() => setTransferTarget(member)}
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                        </Button>
                      )}
                      {canRemove && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover membro</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover <strong>{profile?.full_name}</strong> do workspace?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => removeMember(member.id)}>
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Transfer Ownership Dialog */}
      <AlertDialog open={!!transferTarget} onOpenChange={(open) => !open && setTransferTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transferir propriedade</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a transferir a propriedade do workspace{" "}
              <strong>{currentWorkspace?.name}</strong> para{" "}
              <strong>{transferTarget?.profile?.full_name}</strong>. Você será rebaixado para Admin.
              Esta ação não pode ser desfeita facilmente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleTransfer}>Transferir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
