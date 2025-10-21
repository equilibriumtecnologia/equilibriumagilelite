import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Invitation = Database["public"]["Tables"]["invitations"]["Row"] & {
  invited_by_profile?: {
    full_name: string;
  };
  project?: {
    name: string;
  };
};

export function useInvitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from("invitations")
        .select(`
          *,
          invited_by_profile:profiles!invitations_invited_by_fkey(full_name),
          project:projects(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar convites: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();

    // Realtime updates
    const channel = supabase
      .channel("invitations-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invitations" },
        () => fetchInvitations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const createInvitation = async (
    email: string,
    projectId?: string,
    role: string = "member"
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Convite expira em 7 dias
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error } = await supabase.from("invitations").insert({
        email,
        invited_by: user.id,
        project_id: projectId || null,
        role,
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;

      toast.success("Convite enviado com sucesso!");
      await fetchInvitations();
      return true;
    } catch (error: any) {
      toast.error("Erro ao criar convite: " + error.message);
      return false;
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from("invitations")
        .update({ status: "cancelled" })
        .eq("id", invitationId);

      if (error) throw error;

      toast.success("Convite cancelado");
      await fetchInvitations();
      return true;
    } catch (error: any) {
      toast.error("Erro ao cancelar convite: " + error.message);
      return false;
    }
  };

  const resendInvitation = async (invitationId: string) => {
    try {
      // Extender expiração por mais 7 dias
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error } = await supabase
        .from("invitations")
        .update({ 
          expires_at: expiresAt.toISOString(),
          status: "pending"
        })
        .eq("id", invitationId);

      if (error) throw error;

      toast.success("Convite reenviado!");
      await fetchInvitations();
      return true;
    } catch (error: any) {
      toast.error("Erro ao reenviar convite: " + error.message);
      return false;
    }
  };

  return {
    invitations,
    loading,
    createInvitation,
    cancelInvitation,
    resendInvitation,
    refetch: fetchInvitations,
  };
}
