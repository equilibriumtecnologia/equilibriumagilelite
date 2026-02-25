import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface MemberWithPermissions {
  userId: string;
  fullName: string;
  role: string;
  permissions: Record<string, boolean>;
  hasPermissionRow: boolean;
}

const roleLabels: Record<string, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  member: "Membro",
  viewer: "Convidado",
};

// Permission definitions grouped by category and tier
const permissionGroups = [
  {
    label: "Workspace",
    tier: 2, // Admin+
    permissions: [
      { key: "can_manage_workspace_settings", label: "Gerenciar configurações do workspace" },
      { key: "can_manage_members", label: "Gerenciar membros" },
      { key: "can_invite_members", label: "Convidar membros" },
    ],
  },
  {
    label: "Projetos",
    tier: 3, // Member+
    permissions: [
      { key: "can_create_project", label: "Criar projetos", tier: 3 },
      { key: "can_edit_project", label: "Editar projetos", tier: 3 },
      { key: "can_delete_project", label: "Excluir projetos", tier: 2 },
      { key: "can_manage_project_members", label: "Gerenciar membros do projeto", tier: 2 },
    ],
  },
  {
    label: "Tarefas",
    tier: 3,
    permissions: [
      { key: "can_create_task", label: "Criar tarefas", tier: 3 },
      { key: "can_edit_own_task", label: "Editar próprias tarefas", tier: 3 },
      { key: "can_edit_any_task", label: "Editar qualquer tarefa", tier: 2 },
      { key: "can_delete_own_task", label: "Excluir próprias tarefas", tier: 3 },
      { key: "can_delete_any_task", label: "Excluir qualquer tarefa", tier: 2 },
      { key: "can_assign_task", label: "Atribuir tarefas a outros", tier: 3 },
    ],
  },
  {
    label: "Sprints",
    tier: 2,
    permissions: [
      { key: "can_create_sprint", label: "Criar sprints" },
      { key: "can_edit_sprint", label: "Editar sprints" },
      { key: "can_delete_sprint", label: "Excluir sprints" },
    ],
  },
  {
    label: "Outros",
    tier: 2,
    permissions: [
      { key: "can_manage_categories", label: "Gerenciar categorias", tier: 2 },
      { key: "can_view_reports", label: "Visualizar relatórios", tier: 3 },
      { key: "can_manage_board_settings", label: "Gerenciar configurações do board", tier: 2 },
      { key: "can_manage_backlog", label: "Gerenciar backlog", tier: 3 },
    ],
  },
];

// Get the effective tier for a permission
function getPermTier(group: typeof permissionGroups[0], perm: typeof permissionGroups[0]["permissions"][0]) {
  return (perm as any).tier || group.tier;
}

// Determine which permissions a role can have enabled (max tier)
function getMaxTierForRole(role: string): number {
  switch (role) {
    case "owner":
      return 1; // All tiers
    case "admin":
      return 2;
    case "member":
      return 3;
    case "viewer":
      return 4; // No configurable permissions
    default:
      return 4;
  }
}

function canRoleHavePermission(role: string, permTier: number): boolean {
  const maxTier = getMaxTierForRole(role);
  // Role can have permissions at their tier level or below (higher number = less privilege)
  // Admin (tier 2) can have tier 2 and tier 3 permissions
  // Member (tier 3) can only have tier 3 permissions
  return permTier >= maxTier || maxTier <= 2;
}

export function PermissionsManagement() {
  const { currentWorkspace } = useWorkspace();
  const [members, setMembers] = useState<MemberWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [editedPermissions, setEditedPermissions] = useState<Record<string, boolean>>({});

  const fetchData = async () => {
    if (!currentWorkspace) return;
    try {
      setLoading(true);

      // Fetch workspace members with profiles
      const { data: wsMembers, error: wmError } = await supabase
        .from("workspace_members")
        .select("user_id, role, profile:profiles(id, full_name)")
        .eq("workspace_id", currentWorkspace.id);
      if (wmError) throw wmError;

      // Fetch permissions for this workspace
      const { data: perms, error: permsError } = await supabase
        .from("user_permissions")
        .select("*")
        .eq("workspace_id", currentWorkspace.id);
      if (permsError) throw permsError;

      const membersData: MemberWithPermissions[] = (wsMembers || []).map((wm: any) => {
        // Use workspace_members.role as source of truth
        const wsRole = wm.role || "member";
        const permRow = perms?.find(p => p.user_id === wm.user_id);

        const permissions: Record<string, boolean> = {};
        permissionGroups.forEach(g => {
          g.permissions.forEach(p => {
            permissions[p.key] = permRow ? (permRow as any)[p.key] ?? false : false;
          });
        });

        return {
          userId: wm.user_id,
          fullName: (wm.profile as any)?.full_name || "Usuário",
          role: wsRole,
          permissions,
          hasPermissionRow: !!permRow,
        };
      });

      setMembers(membersData);
    } catch (error: any) {
      console.error("Erro ao carregar permissões:", error);
      toast.error("Erro ao carregar permissões");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentWorkspace?.id]);

  const selectedMember = members.find(m => m.userId === selectedUser);

  useEffect(() => {
    if (selectedMember) {
      setEditedPermissions({ ...selectedMember.permissions });
    }
  }, [selectedUser]);

  const handleToggle = (key: string) => {
    setEditedPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!selectedMember || !currentWorkspace) return;
    try {
      setSaving(true);

      const payload: any = {
        user_id: selectedMember.userId,
        workspace_id: currentWorkspace.id,
        ...editedPermissions,
      };

      if (selectedMember.hasPermissionRow) {
        const { error } = await supabase
          .from("user_permissions")
          .update(editedPermissions)
          .eq("user_id", selectedMember.userId)
          .eq("workspace_id", currentWorkspace.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_permissions")
          .insert(payload);
        if (error) throw error;
      }

      toast.success("Permissões salvas com sucesso!");
      await fetchData();
    } catch (error: any) {
      toast.error("Erro ao salvar permissões: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!selectedMember || !currentWorkspace) return;
    try {
      setSaving(true);
      const { error } = await supabase.rpc("set_default_permissions", {
        _user_id: selectedMember.userId,
        _workspace_id: currentWorkspace.id,
        _role: selectedMember.role,
      });
      if (error) throw error;
      toast.success("Permissões restauradas ao padrão!");
      await fetchData();
      // Refresh edited permissions
      const updated = members.find(m => m.userId === selectedUser);
      if (updated) setEditedPermissions({ ...updated.permissions });
    } catch (error: any) {
      toast.error("Erro ao restaurar permissões: " + error.message);
    } finally {
      setSaving(false);
    }
  };

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
        <CardTitle>Matriz de Permissões</CardTitle>
        <CardDescription>
          Configure permissões granulares por usuário. As permissões são limitadas pelo nível de role:
          Membros não podem receber permissões de Admin.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Selecionar Usuário</label>
          <Select value={selectedUser || ""} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue placeholder="Escolha um usuário..." />
            </SelectTrigger>
            <SelectContent>
              {members
                .filter(m => m.role !== "owner") // Owner has all permissions, can't be edited
                .map(m => (
                  <SelectItem key={m.userId} value={m.userId}>
                    {m.fullName} — {roleLabels[m.role] || m.role}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {selectedMember && (
          <>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{roleLabels[selectedMember.role] || selectedMember.role}</Badge>
              <span className="text-sm text-muted-foreground">
                {selectedMember.role === "viewer"
                  ? "Convidados não possuem permissões configuráveis"
                  : selectedMember.role === "user"
                  ? "Membros podem ter permissões de nível 3 (operações básicas)"
                  : "Admins podem ter permissões de nível 2 e 3"}
              </span>
            </div>

            {selectedMember.role === "viewer" ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                Convidados possuem apenas acesso de visualização. Para conceder permissões, altere o role para Membro ou superior.
              </div>
            ) : (
              <div className="space-y-6">
                {permissionGroups.map((group) => {
                  const availablePerms = group.permissions.filter(p =>
                    canRoleHavePermission(selectedMember.role, getPermTier(group, p))
                  );
                  if (availablePerms.length === 0) return null;

                  return (
                    <div key={group.label}>
                      <h4 className="text-sm font-semibold mb-3">{group.label}</h4>
                      <div className="space-y-2">
                        {group.permissions.map(perm => {
                          const permTier = getPermTier(group, perm);
                          const canHave = canRoleHavePermission(selectedMember.role, permTier);
                          const isChecked = editedPermissions[perm.key] ?? false;

                          return (
                            <div key={perm.key} className="flex items-center gap-3">
                              <Checkbox
                                id={perm.key}
                                checked={canHave ? isChecked : false}
                                disabled={!canHave}
                                onCheckedChange={() => handleToggle(perm.key)}
                              />
                              <label
                                htmlFor={perm.key}
                                className={`text-sm ${!canHave ? "text-muted-foreground line-through" : ""}`}
                              >
                                {perm.label}
                                {!canHave && (
                                  <span className="text-xs text-muted-foreground ml-2">(requer role superior)</span>
                                )}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                      <Separator className="mt-4" />
                    </div>
                  );
                })}

                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar Permissões
                  </Button>
                  <Button variant="outline" onClick={handleResetDefaults} disabled={saving}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restaurar Padrão
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
