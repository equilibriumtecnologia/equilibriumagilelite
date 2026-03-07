import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDowngradeQueue, DowngradeQueueItem } from "@/hooks/useDowngradeQueue";
import { useUserPlan } from "@/hooks/useUserPlan";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  FolderKanban,
  Users,
  Clock,
  Loader2,
  Shield,
  AlertTriangle,
  Check,
} from "lucide-react";

interface WorkspaceInfo {
  id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  member_count: number;
  project_count: number;
  role: string;
}

export default function ManageDowngrade() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { queueItems, isLoading: queueLoading } = useDowngradeQueue();
  const { plan, loading: planLoading } = useUserPlan();

  const [ownedWorkspaces, setOwnedWorkspaces] = useState<WorkspaceInfo[]>([]);
  const [guestWorkspaces, setGuestWorkspaces] = useState<WorkspaceInfo[]>([]);
  const [projectsByWs, setProjectsByWs] = useState<Record<string, { id: string; name: string; created_at: string }[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Selection state
  const [selectedOwned, setSelectedOwned] = useState<Set<string>>(new Set());
  const [selectedGuest, setSelectedGuest] = useState<Set<string>>(new Set());
  const [selectedProjects, setSelectedProjects] = useState<Record<string, Set<string>>>({});

  // Limits
  const maxCreated = plan?.max_created_workspaces ?? 0;
  const maxGuest = plan?.max_guest_workspaces ?? 0;
  const maxProjects = plan?.max_projects_per_workspace ?? 1;

  // Grace period info
  const graceItem = queueItems.find(i => i.status === "grace_period");
  const daysLeft = graceItem
    ? Math.max(0, Math.ceil((new Date(graceItem.grace_period_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Only grace_period items can be swapped
  const gracePeriodItems = queueItems.filter(i => i.status === "grace_period");
  const hasGraceItems = gracePeriodItems.length > 0;

  useEffect(() => {
    if (user && !planLoading) fetchWorkspaceData();
  }, [user, planLoading]);

  const fetchWorkspaceData = async () => {
    if (!user) return;
    try {
      // Owned workspaces
      const { data: ownedMembers } = await supabase
        .from("workspace_members")
        .select("workspace_id, role, workspaces!inner(id, name, is_default, created_at)")
        .eq("user_id", user.id)
        .eq("role", "owner");

      const owned: WorkspaceInfo[] = [];
      for (const wm of ownedMembers || []) {
        const ws = wm.workspaces as any;
        const { count: memberCount } = await supabase
          .from("workspace_members")
          .select("*", { count: "exact", head: true })
          .eq("workspace_id", wm.workspace_id);
        const { data: projects } = await supabase
          .from("projects")
          .select("id, name, created_at")
          .eq("workspace_id", wm.workspace_id)
          .order("created_at", { ascending: false });

        owned.push({
          id: wm.workspace_id,
          name: ws.name,
          is_default: ws.is_default,
          created_at: ws.created_at,
          member_count: memberCount || 0,
          project_count: projects?.length || 0,
          role: "owner",
        });

        if (projects && projects.length > 0) {
          setProjectsByWs(prev => ({ ...prev, [wm.workspace_id]: projects }));
        }
      }
      setOwnedWorkspaces(owned.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

      // Guest workspaces
      const { data: guestMembers } = await supabase
        .from("workspace_members")
        .select("workspace_id, role, workspaces!inner(id, name, is_default, created_at)")
        .eq("user_id", user.id)
        .neq("role", "owner");

      const guest: WorkspaceInfo[] = [];
      for (const wm of guestMembers || []) {
        const ws = wm.workspaces as any;
        guest.push({
          id: wm.workspace_id,
          name: ws.name,
          is_default: ws.is_default,
          created_at: ws.created_at,
          member_count: 0,
          project_count: 0,
          role: wm.role,
        });
      }
      setGuestWorkspaces(guest.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

      // Initialize selections based on what's NOT in queue (i.e. currently kept)
      const queuedOwnedIds = new Set(gracePeriodItems.filter(i => i.item_type === "owned_workspace").map(i => i.workspace_id));
      const queuedGuestIds = new Set(gracePeriodItems.filter(i => i.item_type === "guest_workspace").map(i => i.workspace_id));
      const queuedProjectIds = new Set(gracePeriodItems.filter(i => i.item_type === "exceeding_project").map(i => i.project_id));

      const nonDefaultOwned = owned.filter(w => !w.is_default);
      setSelectedOwned(new Set(nonDefaultOwned.filter(w => !queuedOwnedIds.has(w.id)).map(w => w.id)));
      setSelectedGuest(new Set(guest.filter(w => !queuedGuestIds.has(w.id)).map(w => w.id)));

      // Projects: select those not in queue
      const projSelections: Record<string, Set<string>> = {};
      for (const [wsId, projects] of Object.entries(projectsByWs)) {
        projSelections[wsId] = new Set(projects.filter(p => !queuedProjectIds.has(p.id)).map(p => p.id));
      }
      setSelectedProjects(projSelections);
    } catch (err) {
      console.error("Error loading workspace data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Re-init project selections after projectsByWs updates
  useEffect(() => {
    if (Object.keys(projectsByWs).length === 0) return;
    const queuedProjectIds = new Set(gracePeriodItems.filter(i => i.item_type === "exceeding_project").map(i => i.project_id));
    const projSelections: Record<string, Set<string>> = {};
    for (const [wsId, projects] of Object.entries(projectsByWs)) {
      projSelections[wsId] = new Set(projects.filter(p => !queuedProjectIds.has(p.id)).map(p => p.id));
    }
    setSelectedProjects(projSelections);
  }, [projectsByWs, gracePeriodItems.length]);

  const nonDefaultOwned = useMemo(() => ownedWorkspaces.filter(w => !w.is_default), [ownedWorkspaces]);
  const defaultWs = useMemo(() => ownedWorkspaces.find(w => w.is_default), [ownedWorkspaces]);

  const ownedExceeds = nonDefaultOwned.length > maxCreated;
  const guestExceeds = guestWorkspaces.length > maxGuest;

  const ownedOverLimit = selectedOwned.size > maxCreated;
  const guestOverLimit = selectedGuest.size > maxGuest;

  // Check project limits per workspace
  const projectOverLimits = useMemo(() => {
    const overLimits: Record<string, boolean> = {};
    for (const [wsId, projects] of Object.entries(projectsByWs)) {
      if (projects.length > maxProjects) {
        const selected = selectedProjects[wsId]?.size ?? 0;
        overLimits[wsId] = selected > maxProjects;
      }
    }
    return overLimits;
  }, [projectsByWs, selectedProjects, maxProjects]);

  const hasAnyOverLimit = ownedOverLimit || guestOverLimit || Object.values(projectOverLimits).some(v => v);

  const toggleOwned = (id: string) => {
    setSelectedOwned(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGuest = (id: string) => {
    setSelectedGuest(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleProject = (wsId: string, projId: string) => {
    setSelectedProjects(prev => {
      const wsSet = new Set(prev[wsId] || []);
      if (wsSet.has(projId)) wsSet.delete(projId);
      else wsSet.add(projId);
      return { ...prev, [wsId]: wsSet };
    });
  };

  const handleSave = async () => {
    if (hasAnyOverLimit) {
      toast.error("Você selecionou mais itens do que o limite do seu plano permite.");
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const keepProjectIds: Record<string, string[]> = {};
      for (const [wsId, projects] of Object.entries(projectsByWs)) {
        if (projects.length > maxProjects) {
          keepProjectIds[wsId] = Array.from(selectedProjects[wsId] || []);
        }
      }

      const response = await supabase.functions.invoke("swap-downgrade-items", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          keep_workspace_ids: Array.from(selectedOwned),
          keep_guest_ids: Array.from(selectedGuest),
          keep_project_ids: keepProjectIds,
        },
      });

      if (response.error) throw new Error(response.error.message);

      const result = response.data;
      if (result.error) throw new Error(result.error);

      toast.success("Seleção atualizada com sucesso!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar seleção");
    } finally {
      setSaving(false);
    }
  };

  if (loading || queueLoading || planLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasGraceItems) {
    return (
      <div className="px-3 sm:px-4 md:px-8 py-4 sm:py-8 max-w-3xl mx-auto">
        <div className="text-center py-12">
          <Check className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Nenhum item em carência</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Não há recursos excedentes para gerenciar no momento.
          </p>
          <Button variant="outline" onClick={() => navigate("/")}>
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 md:px-8 py-4 sm:py-6 md:py-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold">Gerenciar Recursos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Escolha quais workspaces e projetos manter dentro dos limites do plano{" "}
          <Badge variant="outline" className="ml-1">{plan?.plan_name}</Badge>
        </p>
      </div>

      {/* Grace period warning */}
      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="flex items-center gap-3 py-4">
          <Clock className="h-5 w-5 text-yellow-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">
              Período de carência: <span className="text-yellow-600 dark:text-yellow-400">{daysLeft} dia(s) restante(s)</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Após este período, os itens não selecionados serão suspensos automaticamente.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Owned Workspaces Section */}
      {ownedExceeds && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Workspaces Próprios
            </CardTitle>
            <CardDescription>
              Selecione até <strong>{maxCreated}</strong> workspace(s) para manter.
              {" "}Você possui <strong>{nonDefaultOwned.length}</strong>.
              {ownedOverLimit && (
                <span className="text-destructive font-medium ml-1">
                  ({selectedOwned.size}/{maxCreated} selecionados — excede o limite!)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Default workspace is always kept */}
            {defaultWs && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 opacity-70">
                <Shield className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{defaultWs.name}</p>
                  <p className="text-xs text-muted-foreground">Workspace padrão — sempre preservado</p>
                </div>
                <Badge variant="secondary" className="text-xs">Protegido</Badge>
              </div>
            )}

            <Separator />

            {nonDefaultOwned.map(ws => {
              const isInQueue = !selectedOwned.has(ws.id);
              return (
                <div
                  key={ws.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    isInQueue
                      ? "border-destructive/30 bg-destructive/5"
                      : "border-primary/30 bg-primary/5"
                  }`}
                  onClick={() => toggleOwned(ws.id)}
                >
                  <Checkbox
                    checked={selectedOwned.has(ws.id)}
                    onCheckedChange={() => toggleOwned(ws.id)}
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ws.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />{ws.member_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <FolderKanban className="h-3 w-3" />{ws.project_count} projetos
                      </span>
                    </div>
                  </div>
                  <Badge variant={isInQueue ? "destructive" : "default"} className="text-xs">
                    {isInQueue ? "Será removido" : "Mantido"}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Guest Workspaces Section */}
      {guestExceeds && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Workspaces Convidados
            </CardTitle>
            <CardDescription>
              Selecione até <strong>{maxGuest}</strong> workspace(s) convidado(s) para manter.
              {" "}Você participa de <strong>{guestWorkspaces.length}</strong>.
              {guestOverLimit && (
                <span className="text-destructive font-medium ml-1">
                  ({selectedGuest.size}/{maxGuest} selecionados — excede o limite!)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {guestWorkspaces.map(ws => {
              const isInQueue = !selectedGuest.has(ws.id);
              return (
                <div
                  key={ws.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    isInQueue
                      ? "border-destructive/30 bg-destructive/5"
                      : "border-primary/30 bg-primary/5"
                  }`}
                  onClick={() => toggleGuest(ws.id)}
                >
                  <Checkbox
                    checked={selectedGuest.has(ws.id)}
                    onCheckedChange={() => toggleGuest(ws.id)}
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ws.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">Papel: {ws.role}</p>
                  </div>
                  <Badge variant={isInQueue ? "destructive" : "default"} className="text-xs">
                    {isInQueue ? "Perderá acesso" : "Mantido"}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Exceeding Projects Section */}
      {Object.entries(projectsByWs).map(([wsId, projects]) => {
        if (projects.length <= maxProjects) return null;
        // Only show for kept workspaces (or default)
        const ws = ownedWorkspaces.find(w => w.id === wsId);
        if (!ws) return null;
        if (!ws.is_default && !selectedOwned.has(wsId)) return null;

        const wsSelectedProjects = selectedProjects[wsId] || new Set();
        const overLimit = projectOverLimits[wsId];

        return (
          <Card key={wsId}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-primary" />
                Projetos — {ws.name}
                {ws.is_default && <Badge variant="secondary" className="text-xs">Padrão</Badge>}
              </CardTitle>
              <CardDescription>
                Selecione até <strong>{maxProjects}</strong> projeto(s) para manter.
                {" "}Este workspace possui <strong>{projects.length}</strong>.
                {overLimit && (
                  <span className="text-destructive font-medium ml-1">
                    ({wsSelectedProjects.size}/{maxProjects} selecionados — excede o limite!)
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {projects.map(proj => {
                const isInQueue = !wsSelectedProjects.has(proj.id);
                return (
                  <div
                    key={proj.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      isInQueue
                        ? "border-destructive/30 bg-destructive/5"
                        : "border-primary/30 bg-primary/5"
                    }`}
                    onClick={() => toggleProject(wsId, proj.id)}
                  >
                    <Checkbox
                      checked={wsSelectedProjects.has(proj.id)}
                      onCheckedChange={() => toggleProject(wsId, proj.id)}
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{proj.name}</p>
                    </div>
                    <Badge variant={isInQueue ? "destructive" : "default"} className="text-xs">
                      {isInQueue ? "Somente-leitura" : "Mantido"}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 pb-8">
        {hasAnyOverLimit && (
          <div className="flex items-center gap-2 text-destructive text-sm w-full sm:w-auto">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>Reduza a seleção para dentro dos limites do plano.</span>
          </div>
        )}
        <div className="flex gap-3 ml-auto">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || hasAnyOverLimit}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Seleção
          </Button>
        </div>
      </div>
    </div>
  );
}
