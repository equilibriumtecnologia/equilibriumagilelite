import { NavLink, useLocation } from "react-router-dom";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const adminMenuItems = [
  { title: "Convites", url: "/invitations", icon: Mail },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { role, canManageInvitations } = useUserRole();
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspace();
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
      return ((parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "")).toUpperCase();
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
                  {!isCollapsed && <ChevronsUpDown className="h-3 w-3 shrink-0 text-muted-foreground" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {workspaces.map((ws) => (
                  <DropdownMenuItem
                    key={ws.id}
                    onClick={() => switchWorkspace(ws.id)}
                    className={ws.id === currentWorkspace?.id ? "bg-accent" : ""}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    <span className="truncate">{ws.name}</span>
                  </DropdownMenuItem>
                ))}
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
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        {!isCollapsed && (
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
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-0.5">
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
        )}
        {isCollapsed && (
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-8 w-8">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
