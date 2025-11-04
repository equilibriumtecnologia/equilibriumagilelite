import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserWithRole {
  id: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
  role: "admin" | "master" | "user";
}

export function UsersManagement() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<"admin" | "master" | "user">("user");
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Buscar perfis
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url");

      if (profilesError) throw profilesError;

      // Buscar roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Buscar emails usando o endpoint de metadados do usuário
      const usersWithRoles: UserWithRole[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          const userRole = roles?.find((r) => r.user_id === profile.id);
          
          // Buscar email do usuário via auth
          const { data: { user: authUser } } = await supabase.auth.admin.getUserById(profile.id);
          
          return {
            id: profile.id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            email: authUser?.email || "",
            role: (userRole?.role as "admin" | "master" | "user") || "user",
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error("Erro ao carregar usuários:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) return;

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", selectedUser.id);

      if (error) throw error;

      toast.success("Role atualizado com sucesso!");
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      await fetchUsers();
    } catch (error: any) {
      console.error("Erro ao atualizar role:", error);
      toast.error("Erro ao atualizar role: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsEditDialogOpen(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "master":
        return "destructive";
      case "admin":
        return "default";
      default:
        return "secondary";
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Gerencie os usuários e suas permissões no sistema
      </p>

      <div className="grid gap-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex items-center gap-4 flex-1">
              <Avatar>
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback>
                  {user.full_name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold">{user.full_name}</h4>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getRoleBadgeVariant(user.role)}>
                {user.role}
              </Badge>
              <Button
                variant="outline"
                size="icon"
                onClick={() => openEditDialog(user)}
              >
                <Shield className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Role do Usuário</DialogTitle>
            <DialogDescription>
              Atualize as permissões de {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Role Atual</Label>
              <Badge variant={getRoleBadgeVariant(selectedUser?.role || "user")}>
                {selectedUser?.role}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Nova Role</Label>
              <Select value={newRole} onValueChange={(value) => setNewRole(value as "admin" | "master" | "user")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="master">Master</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>User:</strong> Acesso básico ao sistema</p>
              <p><strong>Admin:</strong> Pode gerenciar categorias e projetos</p>
              <p><strong>Master:</strong> Acesso total ao sistema</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateRole} disabled={saving || newRole === selectedUser?.role}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Atualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
