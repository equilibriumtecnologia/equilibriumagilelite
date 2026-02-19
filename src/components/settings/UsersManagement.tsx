import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UserWithRole {
  id: string;
  full_name: string;
  role: string;
}

const roleLabels: Record<string, string> = {
  master: "Proprietário",
  admin: "Administrador",
  user: "Membro",
  viewer: "Convidado",
};

const ROLE_COLORS: Record<string, string> = {
  master: "bg-purple-500",
  admin: "bg-blue-500",
  user: "bg-gray-500",
  viewer: "bg-orange-500",
};

interface UsersManagementProps {
  currentUserRole: string;
}

export function UsersManagement({ currentUserRole }: UsersManagementProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name");
      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (rolesError) throw rolesError;

      const usersData = profiles?.map(profile => {
        const roleEntry = roles?.find(r => r.user_id === profile.id);
        return {
          id: profile.id,
          full_name: profile.full_name,
          role: roleEntry?.role || "user",
        };
      }) || [];

      setUsers(usersData);
    } catch (error: any) {
      console.error("Erro ao carregar usuários:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase.rpc("update_user_role", {
        _target_user_id: userId,
        _new_role: newRole as any,
      });
      if (error) throw error;
      toast.success("Role atualizado com sucesso!");
      fetchUsers();
    } catch (error: any) {
      console.error("Erro ao atualizar role:", error);
      toast.error(error.message || "Erro ao atualizar role");
    }
  };

  const getRoleOptions = (targetRole: string, targetUserId: string) => {
    // Can't change own role
    if (targetUserId === user?.id) return [];

    if (currentUserRole === "master") {
      // Master can't change another master, can't promote to master
      if (targetRole === "master") return [];
      return [
        { value: "admin", label: "Administrador" },
        { value: "user", label: "Membro" },
        { value: "viewer", label: "Convidado" },
      ];
    }

    if (currentUserRole === "admin") {
      // Admin can only toggle between user and viewer
      if (targetRole !== "user" && targetRole !== "viewer") return [];
      return [
        { value: "user", label: "Membro" },
        { value: "viewer", label: "Convidado" },
      ];
    }

    return [];
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
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Usuários</CardTitle>
        <CardDescription>
          {currentUserRole === "master"
            ? "Gerencie usuários e suas permissões no sistema (Admin, Membro ou Convidado)"
            : "Alterne membros entre Membro e Convidado"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const options = getRoleOptions(u.role, u.id);
              const isCurrentUser = u.id === user?.id;

              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.full_name}
                    {isCurrentUser && (
                      <span className="text-xs text-muted-foreground ml-2">(você)</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={ROLE_COLORS[u.role] || "bg-gray-500"}>
                      {roleLabels[u.role] || u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {options.length > 0 ? (
                      <Select
                        value={u.role}
                        onValueChange={(value) => handleRoleChange(u.id, value)}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {options.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
