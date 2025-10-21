import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("user");

  useEffect(() => {
    const fetchCurrentUserRole = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setCurrentUserRole(data.role);
      }
    };

    fetchCurrentUserRole();
  }, [user]);

  useEffect(() => {
    if (open && member.roles.length > 0) {
      setSelectedRole(member.roles[0].role);
    }
  }, [open, member.roles]);

  // Verificar se usuário atual pode gerenciar roles
  const canManageRoles = currentUserRole === "admin" || currentUserRole === "master";
  const isOwnProfile = user?.id === member.id;
  const isMaster = member.roles.some((r) => r.role === "master");

  // Master não pode ter role alterada por ninguém
  // Admin não pode alterar outro admin ou master
  const canEditThisMember = 
    canManageRoles && 
    !isOwnProfile && 
    !isMaster &&
    (currentUserRole === "master" || member.roles[0]?.role === "user");

  if (!canEditThisMember) {
    return null;
  }

  const handleSave = async () => {
    setLoading(true);

    try {
      // Remover role atual
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", member.id);

      if (deleteError) throw deleteError;

      // Adicionar nova role
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({
          user_id: member.id,
          role: selectedRole as any,
        });

      if (insertError) throw insertError;

      toast.success("Role atualizada com sucesso!");
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error("Erro ao atualizar role: " + error.message);
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
            Alterar nível de acesso de {member.full_name}
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
                <SelectItem value="user">
                  <div className="flex items-center gap-2">
                    <span>Usuário</span>
                    <span className="text-xs text-muted-foreground">
                      - Acesso padrão
                    </span>
                  </div>
                </SelectItem>
                {currentUserRole === "master" && (
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <span>Admin</span>
                      <span className="text-xs text-muted-foreground">
                        - Gerenciar projetos e usuários
                      </span>
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">Sobre Permissões</p>
                <ul className="text-muted-foreground text-xs space-y-1 mt-1">
                  <li>• <strong>Usuário:</strong> Acesso básico, gerencia próprias tarefas</li>
                  <li>• <strong>Admin:</strong> Gerencia projetos e pode promover usuários</li>
                  <li>• <strong>Master:</strong> Controle total do sistema</li>
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
