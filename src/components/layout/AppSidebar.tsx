import { NavLink, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Mail,
  ChevronsUpDown,
  Building2,
  Crown,
  Plus,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useUserPlan } from "@/hooks/useUserPlan";
import { useProjects } from "@/hooks/useProjects";
import { useWorkspaceMembers } from "@/hooks/useWorkspaceMembers";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CreateWorkspaceDialog } from "@/components/workspace/CreateWorkspaceDialog";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PoweredByEquilibrium } from "./PoweredByEquilibrium";

const roleLabels: Record<string, string> = {
  master: "Proprietário",
  admin: "Administrador",
  member: "Membro",
  user: "Membro",
  viewer: "Convidado",
};

const baseMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Projetos", url: "/projects", icon: FolderKanban },
  { title: "Atividades", url: "/tasks", icon: CheckSquare },
  { title: "Relatórios", url: "/reports", icon: BarChart3 },
  { title: "Equipe", url: "/team", icon: Users },
  { title: "Workspace", url: "/workspace-settings", icon: Building2 },
  { title: "Configurações", url: "/settings", icon: Settings },
];

const adminMenuItems = [{ title: "Convites", url: "/invitations", icon: Mail }];

function PlanUsageBar({
  label,
  current,
  max,
}: {
  label: string;
  current: number;
  max: number;
}) {
  const isUnlimited = max >= 999;
  const pct = isUnlimited
    ? 0
    : max > 0
      ? Math.min((current / max) * 100, 100)
      : 0;
  const atLimit = !isUnlimited && current >= max;

  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{label}</span>
        <span className={atLimit ? "text-destructive font-medium" : ""}>
          {current}/{isUnlimited ? "∞" : max}
        </span>
      </div>
      {!isUnlimited && <Progress value={pct} className="h-1" />}
    </div>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { role, canManageInvitations } = useUserRole();
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspace();
  const { plan, isMaster } = useUserPlan();
  const { projects } = useProjects();
  const { members } = useWorkspaceMembers();
  const [profileName, setProfileName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const isCollapsed = state === "collapsed";

  const menuItems = [
    ...baseMenuItems,
    ...(canManageInvitations ? adminMenuItems : []),
  ];

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setProfileName(data?.full_name || null);
        setAvatarUrl(data?.avatar_url || null);
      });
  }, [user]);

  const displayName = profileName || user?.email || "";
  const initials = (() => {
    if (profileName) {
      const parts = profileName.split(" ");
      return (
        (parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "")
      ).toUpperCase();
    }
    return (user?.email?.[0] || "?").toUpperCase();
  })();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Logo/Header */}
        <div className="p-4 border-b border-sidebar-border">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
                Agile Lite Equilibrium
              </span>
            </div>
          )}
          {isCollapsed && (
            <div className="flex justify-center">
              <LayoutDashboard className="h-6 w-6 text-primary" />
            </div>
          )}
        </div>

        {/* Workspace Selector */}
        <div className="p-2 border-b border-sidebar-border">
          {workspaces.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`w-full ${isCollapsed ? "justify-center px-2" : "justify-between"}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {!isCollapsed && (
                      <span className="truncate text-sm font-medium">
                        {currentWorkspace?.name || "Workspace"}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <ChevronsUpDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {workspaces.map((ws) => (
                  <DropdownMenuItem
                    key={ws.id}
                    onClick={() => switchWorkspace(ws.id)}
                    className={
                      ws.id === currentWorkspace?.id ? "bg-accent" : ""
                    }
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    <span className="truncate">{ws.name}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <CreateWorkspaceDialog
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Plus className="h-4 w-4 mr-2" />
                      <span>Novo Workspace</span>
                    </DropdownMenuItem>
                  }
                />
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* Plan Usage Indicator */}
        {!isCollapsed && plan && (
          <div className="px-4 py-3 border-t border-sidebar-border">
            <div className="flex items-center gap-1.5 mb-2">
              <Crown className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-sidebar-foreground">
                {plan.plan_name}
              </span>
            </div>
            <div className="space-y-1.5">
              {/* Projects usage */}
              <PlanUsageBar
                label="Projetos"
                current={projects.length}
                max={plan.max_projects_per_workspace}
              />
              {/* Members usage */}
              <PlanUsageBar
                label="Membros"
                current={members.filter((m) => m.role !== "owner").length}
                max={plan.max_invites_per_workspace}
              />
              {/* Workspaces usage */}
              <PlanUsageBar
                label="Workspaces"
                current={workspaces.length}
                max={plan.max_workspaces}
              />
            </div>
            {!isMaster && plan.plan_slug === "free" && (
              <Link to="/pricing" className="block mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-7 text-[10px] border-primary/30 text-primary hover:bg-primary/10"
                >
                  <Crown className="h-3 w-3 mr-1" /> Fazer Upgrade
                </Button>
              </Link>
            )}
          </div>
        )}
        {isCollapsed && plan && (
          <div className="px-2 py-2 border-t border-sidebar-border flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center">
                  <Crown className="h-4 w-4 text-primary" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                <p className="font-semibold">{plan.plan_name}</p>
                <p>
                  Projetos: {projects.length}/
                  {plan.max_projects_per_workspace === 999
                    ? "∞"
                    : plan.max_projects_per_workspace}
                </p>
                <p>
                  Membros: {members.filter((m) => m.role !== "owner").length}/
                  {plan.max_invites_per_workspace === 999
                    ? "∞"
                    : plan.max_invites_per_workspace}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        {!isCollapsed && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 flex-shrink-0">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{displayName}</p>
                {role && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 mt-0.5"
                  >
                    {roleLabels[role] || role}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={signOut}
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
            <PoweredByEquilibrium
              variant="menu"
              logo="compact"
              showTextFallback={false}
              theme="light"
            />
          </div>
        )}
        {isCollapsed && (
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-8 w-8">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={signOut} title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
            <PoweredByEquilibrium
              variant="badge"
              logo="icon"
              label=""
              showTextFallback={false}
              theme="light"
            />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
