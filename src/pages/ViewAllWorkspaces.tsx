import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPlan } from "@/hooks/useUserPlan";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building2, Search, Shield, Crown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface WorkspaceAccess {
  workspace_id: string;
  workspace_name: string;
  workspace_slug: string;
  is_default: boolean;
  is_enabled: boolean;
  owner_name: string;
  owner_id: string;
  owner_plan: string;
  is_master_member: boolean;
}

interface GroupedByOwner {
  owner_id: string;
  owner_name: string;
  owner_plan: string;
  workspaces: WorkspaceAccess[];
}

export default function ViewAllWorkspaces() {
  const { user } = useAuth();
  const { isMaster } = useUserPlan();
  const [data, setData] = useState<WorkspaceAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch all workspaces (master RLS allows via master_workspace_access or membership)
      // We need a broader approach - use the master_workspace_access table + join
      const { data: accessRows, error: accessError } = await supabase
        .from("master_workspace_access")
        .select("workspace_id, is_enabled");

      if (accessError) throw accessError;

      // Get all workspace IDs
      const wsIds = accessRows?.map((r) => r.workspace_id) || [];
      if (wsIds.length === 0) {
        setData([]);
        setLoading(false);
        return;
      }

      // For workspaces where master has access, fetch workspace details
      // We need to fetch workspace info using a service-level approach
      // Since master may not have SELECT access to all workspaces, 
      // we'll create an RPC or use the access table which has all workspace_ids

      // Fetch workspace details for enabled ones + get all workspace info
      // The master_workspace_access table has ALL workspace IDs
      // Let's fetch workspace details for those the master CAN access (enabled or member)
      const { data: accessibleWs, error: wsError } = await supabase
        .from("workspaces")
        .select("id, name, slug, is_default");

      if (wsError) throw wsError;

      // Fetch workspace members to find owners
      const accessibleIds = accessibleWs?.map((w) => w.id) || [];
      
      // For non-accessible workspaces, we only have the ID from master_workspace_access
      // We need an RPC to get all workspace info for master
      // Let's build what we can

      const { data: membersData, error: membersError } = await supabase
        .from("workspace_members")
        .select("workspace_id, user_id, role")
        .in("workspace_id", accessibleIds);

      if (membersError) throw membersError;

      // Get profiles for owners
      const ownerIds = [...new Set(
        (membersData || []).filter((m) => m.role === "owner").map((m) => m.user_id)
      )];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ownerIds.length > 0 ? ownerIds : ["00000000-0000-0000-0000-000000000000"]);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p.full_name]));

      // Check which workspaces master is a member of
      const masterMemberWs = new Set(
        (membersData || []).filter((m) => m.user_id === user.id).map((m) => m.workspace_id)
      );

      // Build access map
      const accessMap = new Map((accessRows || []).map((r) => [r.workspace_id, r.is_enabled]));

      // Get owner plans
      const ownerPlanPromises = ownerIds.map(async (oid) => {
        const { data: planData } = await supabase.rpc("get_user_plan", { _user_id: oid });
        return { id: oid, plan: (planData as any)?.plan_name || "Free" };
      });
      const ownerPlans = await Promise.all(ownerPlanPromises);
      const planMap = new Map(ownerPlans.map((p) => [p.id, p.plan]));

      // Build result for accessible workspaces
      const result: WorkspaceAccess[] = (accessibleWs || []).map((ws) => {
        const owner = (membersData || []).find(
          (m) => m.workspace_id === ws.id && m.role === "owner"
        );
        const ownerId = owner?.user_id || "";
        return {
          workspace_id: ws.id,
          workspace_name: ws.name,
          workspace_slug: ws.slug,
          is_default: ws.is_default,
          is_enabled: accessMap.get(ws.id) ?? false,
          owner_name: profileMap.get(ownerId) || "Desconhecido",
          owner_id: ownerId,
          owner_plan: planMap.get(ownerId) || "Free",
          is_master_member: masterMemberWs.has(ws.id),
        };
      });

      // Add non-accessible workspaces (only ID available, no details since RLS blocks)
      const accessibleSet = new Set(accessibleIds);
      for (const row of accessRows || []) {
        if (!accessibleSet.has(row.workspace_id)) {
          result.push({
            workspace_id: row.workspace_id,
            workspace_name: `Workspace (${row.workspace_id.slice(0, 8)}...)`,
            workspace_slug: "",
            is_default: false,
            is_enabled: row.is_enabled,
            owner_name: "Sem acesso",
            owner_id: "",
            owner_plan: "—",
            is_master_member: false,
          });
        }
      }

      setData(result);
    } catch (error: any) {
      console.error("Error fetching workspaces:", error);
      toast.error("Erro ao carregar workspaces");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isMaster) fetchData();
  }, [user, isMaster]);

  const toggleAccess = async (workspaceId: string, enabled: boolean) => {
    setUpdating((prev) => new Set(prev).add(workspaceId));
    try {
      const { error } = await supabase
        .from("master_workspace_access")
        .update({ is_enabled: enabled })
        .eq("workspace_id", workspaceId);

      if (error) throw error;

      setData((prev) =>
        prev.map((w) =>
          w.workspace_id === workspaceId ? { ...w, is_enabled: enabled } : w
        )
      );
      toast.success(enabled ? "Acesso habilitado" : "Acesso removido");
    } catch (error: any) {
      toast.error("Erro ao atualizar acesso: " + error.message);
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev);
        next.delete(workspaceId);
        return next;
      });
    }
  };

  // Guard: only master
  if (!isMaster) {
    return <Navigate to="/dashboard" replace />;
  }

  // Group by owner
  const filtered = data.filter(
    (w) =>
      w.workspace_name.toLowerCase().includes(search.toLowerCase()) ||
      w.owner_name.toLowerCase().includes(search.toLowerCase())
  );

  const grouped: GroupedByOwner[] = [];
  const ownerMap = new Map<string, GroupedByOwner>();
  for (const w of filtered) {
    const key = w.owner_id || "unknown";
    if (!ownerMap.has(key)) {
      const group: GroupedByOwner = {
        owner_id: w.owner_id,
        owner_name: w.owner_name,
        owner_plan: w.owner_plan,
        workspaces: [],
      };
      ownerMap.set(key, group);
      grouped.push(group);
    }
    ownerMap.get(key)!.workspaces.push(w);
  }

  // Sort groups: master's own first, then alphabetically
  grouped.sort((a, b) => {
    if (a.owner_id === user?.id) return -1;
    if (b.owner_id === user?.id) return 1;
    return a.owner_name.localeCompare(b.owner_name);
  });

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    return ((parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "")).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Gerenciar Acesso a Workspaces</h1>
      </div>

      <p className="text-muted-foreground mb-6 text-sm">
        Selecione os workspaces que deseja acessar. Por padrão, novos workspaces são criados sem acesso.
        Você também terá acesso a workspaces para os quais foi convidado.
      </p>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por workspace ou proprietário..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          Nenhum workspace encontrado.
        </p>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <Card key={group.owner_id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(group.owner_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{group.owner_name}</CardTitle>
                    <Badge variant="outline" className="text-[10px]">
                      {group.owner_plan}
                    </Badge>
                    {group.owner_id === user?.id && (
                      <Badge className="text-[10px] bg-primary/20 text-primary border-0">
                        <Crown className="h-3 w-3 mr-1" /> Você
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {group.workspaces.map((ws) => (
                    <div
                      key={ws.workspace_id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={ws.is_enabled}
                          disabled={updating.has(ws.workspace_id)}
                          onCheckedChange={(checked) =>
                            toggleAccess(ws.workspace_id, !!checked)
                          }
                        />
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{ws.workspace_name}</p>
                          {ws.workspace_slug && (
                            <p className="text-xs text-muted-foreground">{ws.workspace_slug}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {ws.is_default && (
                          <Badge variant="secondary" className="text-[10px]">
                            Padrão
                          </Badge>
                        )}
                        {ws.is_master_member && (
                          <Badge variant="outline" className="text-[10px]">
                            Membro
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
