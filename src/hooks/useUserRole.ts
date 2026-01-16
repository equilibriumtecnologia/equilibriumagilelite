import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UseUserRoleReturn {
  role: AppRole | null;
  loading: boolean;
  isAdmin: boolean;
  isMaster: boolean;
  isUser: boolean;
  canManageInvitations: boolean;
  canManageTeam: boolean;
  canAccessSettings: boolean;
}

export function useUserRole(): UseUserRoleReturn {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;
        setRole(data?.role || null);
      } catch (error) {
        console.error("Error fetching user role:", error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  const isMaster = role === "master";
  const isAdmin = role === "admin";
  const isUser = role === "user";

  return {
    role,
    loading,
    isAdmin,
    isMaster,
    isUser,
    canManageInvitations: isMaster || isAdmin,
    canManageTeam: isMaster || isAdmin,
    canAccessSettings: isMaster || isAdmin,
  };
}
