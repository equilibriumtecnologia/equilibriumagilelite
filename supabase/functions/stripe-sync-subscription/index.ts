import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[STRIPE-SYNC] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    logStep("Syncing subscription for user", { userId: user.id, email: user.email });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ synced: false, reason: "no_customer" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId });

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      logStep("No active subscription found, downgrading to free");

      // Get current plan before downgrade
      const { data: currentSub } = await supabaseClient
        .from("user_subscriptions")
        .select("subscription_plans(slug)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();
      
      const previousSlug = (currentSub as any)?.subscription_plans?.slug || "unknown";

      // Find free plan
      const { data: freePlan } = await supabaseClient
        .from("subscription_plans")
        .select("id, name, slug")
        .eq("slug", "free")
        .single();

      if (freePlan) {
        const { error: downgradeError } = await supabaseClient
          .from("user_subscriptions")
          .upsert({
            user_id: user.id,
            plan_id: freePlan.id,
            status: "active",
            stripe_customer_id: customerId,
            stripe_subscription_id: null,
            current_period_start: new Date().toISOString(),
            current_period_end: null,
          }, { onConflict: "user_id" });

        if (downgradeError) {
          logStep("Error downgrading to free", { error: downgradeError });
        } else {
          logStep("Downgraded to free plan", { userId: user.id });

          // Trigger downgrade processing if coming from a paid plan
          if (previousSlug !== "free") {
            try {
              const baseUrl = Deno.env.get("SUPABASE_URL") ?? "";
              await fetch(`${baseUrl}/functions/v1/process-downgrade`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-internal-key": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
                },
                body: JSON.stringify({
                  user_id: user.id,
                  previous_plan_slug: previousSlug,
                  new_plan_slug: "free",
                  trigger: "sync",
                }),
              });
            } catch (e) {
              logStep("Error triggering downgrade", { error: (e as Error).message });
            }
          }
        }
      }

      return new Response(JSON.stringify({ synced: true, plan_name: "Free", plan_slug: "free" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0]?.price?.id;
    if (!priceId) throw new Error("No price found in subscription");

    // Get product to find plan_slug
    const price = await stripe.prices.retrieve(priceId);
    const product = await stripe.products.retrieve(price.product as string);
    const planSlug = product.metadata?.plan_slug;

    if (!planSlug) {
      logStep("Product missing plan_slug metadata", { productId: product.id });
      return new Response(JSON.stringify({ synced: false, reason: "no_plan_slug" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Found subscription", { planSlug, subscriptionId: subscription.id });

    // Find plan in DB
    const { data: plan } = await supabaseClient
      .from("subscription_plans")
      .select("id, name, slug")
      .eq("slug", planSlug)
      .single();

    if (!plan) {
      logStep("Plan not found in DB", { planSlug });
      return new Response(JSON.stringify({ synced: false, reason: "plan_not_found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Upsert subscription
    const periodStart = subscription.current_period_start
      ? new Date(Number(subscription.current_period_start) * 1000).toISOString()
      : new Date().toISOString();
    const periodEnd = subscription.current_period_end
      ? new Date(Number(subscription.current_period_end) * 1000).toISOString()
      : null;

    logStep("Period dates", { start: periodStart, end: periodEnd, rawStart: subscription.current_period_start, rawEnd: subscription.current_period_end });

    const { error } = await supabaseClient
      .from("user_subscriptions")
      .upsert({
        user_id: user.id,
        plan_id: plan.id,
        status: "active",
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        current_period_start: periodStart,
        current_period_end: periodEnd,
      }, { onConflict: "user_id" });

    if (error) {
      logStep("Error updating subscription", { error });
      throw new Error(`DB error: ${error.message}`);
    }

    logStep("Subscription synced successfully", { userId: user.id, plan: plan.slug });

    // Check if user has pending downgrade items and restore them (upgrade scenario)
    try {
      const { data: pendingItems } = await supabaseClient
        .from("downgrade_queue")
        .select("id")
        .eq("user_id", user.id)
        .in("status", ["grace_period", "suspended", "exported"])
        .limit(1);

      if (pendingItems && pendingItems.length > 0) {
        const baseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        await fetch(`${baseUrl}/functions/v1/restore-downgrade`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-key": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
          },
          body: JSON.stringify({ user_id: user.id }),
        });
        logStep("Restore triggered for upgrade", { userId: user.id });
      }
    } catch (e) {
      logStep("Error checking/restoring downgrade", { error: (e as Error).message });
    }

    return new Response(JSON.stringify({ 
      synced: true, 
      plan_name: plan.name, 
      plan_slug: plan.slug 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
