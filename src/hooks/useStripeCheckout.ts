import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useStripeCheckout() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const checkout = async (priceId: string) => {
    if (!user) {
      toast.error("Você precisa estar logado para assinar um plano.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-create-checkout", {
        body: { price_id: priceId },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao iniciar checkout");
    } finally {
      setLoading(false);
    }
  };

  const openPortal = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao abrir portal de gerenciamento");
    } finally {
      setLoading(false);
    }
  };

  const syncSubscription = async () => {
    if (!user) return null;
    try {
      const { data, error } = await supabase.functions.invoke("stripe-sync-subscription");
      if (error) throw error;
      return data as { synced: boolean; plan_name?: string; plan_slug?: string; reason?: string };
    } catch (err: any) {
      console.error("Sync subscription error:", err);
      return null;
    }
  };

  return { checkout, openPortal, syncSubscription, loading };
}
