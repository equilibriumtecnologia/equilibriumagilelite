import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StripePlan {
  product_id: string;
  name: string;
  slug: string;
  display_order: number;
  monthly: { price_id: string; amount: number; currency: string } | null;
  yearly: { price_id: string; amount: number; currency: string } | null;
}

export function useStripePrices() {
  return useQuery({
    queryKey: ["stripe-prices"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("stripe-get-prices");
      if (error) throw error;
      return (data as { plans: StripePlan[] }).plans;
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}
