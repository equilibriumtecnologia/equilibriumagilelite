import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Fetch all active products with metadata plan_slug
    const products = await stripe.products.list({ active: true, limit: 10 });
    
    const plansWithPrices = [];

    for (const product of products.data) {
      const planSlug = product.metadata?.plan_slug;
      if (!planSlug) continue;

      // Get all active prices for this product
      const prices = await stripe.prices.list({
        product: product.id,
        active: true,
        limit: 10,
      });

      const monthlyPrice = prices.data.find(p => p.recurring?.interval === "month");
      const yearlyPrice = prices.data.find(p => p.recurring?.interval === "year");

      plansWithPrices.push({
        product_id: product.id,
        name: product.name,
        slug: planSlug,
        display_order: parseInt(product.metadata?.display_order || "99"),
        monthly: monthlyPrice ? {
          price_id: monthlyPrice.id,
          amount: monthlyPrice.unit_amount || 0,
          currency: monthlyPrice.currency,
        } : null,
        yearly: yearlyPrice ? {
          price_id: yearlyPrice.id,
          amount: yearlyPrice.unit_amount || 0,
          currency: yearlyPrice.currency,
        } : null,
      });
    }

    // Sort by display_order
    plansWithPrices.sort((a, b) => a.display_order - b.display_order);

    return new Response(JSON.stringify({ plans: plansWithPrices }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
