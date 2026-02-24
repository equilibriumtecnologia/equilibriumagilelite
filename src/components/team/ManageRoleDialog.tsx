import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspaceMembers } from "@/hooks/useWorkspaceMembers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Lock } from "lucide-react";
import type { TeamMember } from "@/hooks/useTeam";

interface ManageRoleDialogProps {
  member: TeamMember;
  onSuccess?: () => void;
}

export function ManageRoleDialog({ member, onSuccess }: ManageRoleDialogProps) {
  const { user } = useAuth();
  const { members, updateRole } = useWorkspaceMembers();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Find the workspace member record for this team member
  const workspaceMember = members.find((m) => m.user_id === member.id);
  const currentUserWsMember = members.find((m) => m.user_id === user?.id);

  const currentWsRole = workspaceMember?.role || "member";
  const [selectedRole, setSelectedRole] = useState<string>(currentWsRole);

  useEffect(() => {
    if (open && workspaceMember) {
      setSelectedRole(workspaceMember.role);
    }
  }, [open, workspaceMember]);

  const isOwner = currentUserWsMember?.role === "owner";
  const isAdmin = currentUserWsMember?.role === "admin";
  const isSelf = user?.id === member.id;
  const targetIsOwner = workspaceMember?.role === "owner";

  // Owner can edit non-owner, non-self members
  // Admin cannot edit roles (only owner can in workspace-settings)
  const canEditThisMember = isOwner && !isSelf && !targetIsOwner && !!workspaceMember;

  if (!canEditThisMember) {
    return null;
  }

  const handleSave = async () => {
    if (!workspaceMember) return;
    setLoading(true);
    try {
      const success = await updateRole(workspaceMember.id, selectedRole);
      if (success) {
        setOpen(false);
        onSuccess?.();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Shield className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar Permissões</DialogTitle>
          <DialogDescription>
            Alterar nível de acesso de {member.full_name} no workspace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nível de Acesso</label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <span>Admin</span>
                    <span className="text-xs text-muted-foreground">
                      - Gerenciar projetos e membros
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="member">
                  <div className="flex items-center gap-2">
                    <span>Membro</span>
                    <span className="text-xs text-muted-foreground">
                      - Acesso padrão
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="viewer">
                  <div className="flex items-center gap-2">
                    <span>Viewer</span>
                    <span className="text-xs text-muted-foreground">
                      - Somente visualização
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">Sobre Permissões</p>
                <ul className="text-muted-foreground text-xs space-y-1 mt-1">
                  <li>• <strong>Admin:</strong> Gerencia projetos, membros e configurações</li>
                  <li>• <strong>Membro:</strong> Acesso padrão, cria e gerencia próprias tarefas</li>
                  <li>• <strong>Viewer:</strong> Somente visualização, sem criação de conteúdo</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || !selectedRole}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
