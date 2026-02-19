import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  loading: boolean;
  switchWorkspace: (workspaceId: string) => void;
  refetch: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  workspaces: [],
  currentWorkspace: null,
  loading: true,
  switchWorkspace: () => {},
  refetch: async () => {},
});

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = async () => {
    if (!user) {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("workspaces")
        .select("*")
        .order("created_at");

      if (error) throw error;

      const ws = (data || []) as Workspace[];
      setWorkspaces(ws);

      // Restore from localStorage or pick first
      const savedId = localStorage.getItem(`workspace_${user.id}`);
      const saved = ws.find((w) => w.id === savedId);
      
      if (saved) {
        setCurrentWorkspace(saved);
      } else if (ws.length > 0) {
        setCurrentWorkspace(ws[0]);
        localStorage.setItem(`workspace_${user.id}`, ws[0].id);
      }
    } catch (error: any) {
      console.error("Erro ao carregar workspaces:", error);
    } finally {
      setLoading(false);
    }
  };

  const switchWorkspace = (workspaceId: string) => {
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (ws && user) {
      setCurrentWorkspace(ws);
      localStorage.setItem(`workspace_${user.id}`, ws.id);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("workspaces-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "workspaces" }, () => fetchWorkspaces())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <WorkspaceContext.Provider value={{ workspaces, currentWorkspace, loading, switchWorkspace, refetch: fetchWorkspaces }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => useContext(WorkspaceContext);
