import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { toast } from "sonner";

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export function useWorkspaceMembers() {
  const { currentWorkspace } = useWorkspace();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    if (!currentWorkspace) {
      setMembers([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("workspace_members")
        .select("*, profile:profiles(*)")
        .eq("workspace_id", currentWorkspace.id)
        .order("joined_at");

      if (error) throw error;
      setMembers((data || []) as unknown as WorkspaceMember[]);
    } catch (error: any) {
      console.error("Erro ao carregar membros:", error);
    } finally {
      setLoading(false);
    }
  };

  const addMember = async (userId: string, role: string = "member") => {
    if (!currentWorkspace) return false;
    try {
      const { error } = await supabase
        .from("workspace_members")
        .insert({ workspace_id: currentWorkspace.id, user_id: userId, role: role as any });
      if (error) throw error;
      toast.success("Membro adicionado!");
      await fetchMembers();
      return true;
    } catch (error: any) {
      toast.error("Erro ao adicionar membro: " + error.message);
      return false;
    }
  };

  const updateRole = async (memberId: string, role: string) => {
    try {
      const { error } = await supabase
        .from("workspace_members")
        .update({ role: role as any })
        .eq("id", memberId);
      if (error) throw error;
      toast.success("Role atualizada!");
      await fetchMembers();
      return true;
    } catch (error: any) {
      toast.error("Erro ao atualizar role: " + error.message);
      return false;
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("workspace_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
      toast.success("Membro removido!");
      await fetchMembers();
      return true;
    } catch (error: any) {
      toast.error("Erro ao remover membro: " + error.message);
      return false;
    }
  };

  const transferOwnership = async (newOwnerId: string) => {
    if (!currentWorkspace) return false;
    try {
      const { error } = await supabase.rpc("transfer_workspace_ownership", {
        _workspace_id: currentWorkspace.id,
        _new_owner_id: newOwnerId,
      });
      if (error) throw error;
      toast.success("Propriedade transferida com sucesso!");
      await fetchMembers();
      return true;
    } catch (error: any) {
      toast.error("Erro ao transferir: " + error.message);
      return false;
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [currentWorkspace?.id]);

  return { members, loading, addMember, updateRole, removeMember, transferOwnership, refetch: fetchMembers };
}
