import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

async function resolveUserId(
  supabase: any,
  stripe: Stripe,
  metadata: Record<string, string> | null,
  customerId?: string
): Promise<{ userId: string | null; planSlug: string | null }> {
  // Try metadata first
  if (metadata?.user_id) {
    return { userId: metadata.user_id, planSlug: metadata.plan_slug || null };
  }

  // Fallback: look up by customer email
  if (!customerId) return { userId: null, planSlug: null };

  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted || !('email' in customer) || !customer.email) {
      return { userId: null, planSlug: null };
    }

    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users?.users?.find((u: any) => u.email === customer.email);
    if (!user) {
      logStep("No user found for customer email", { email: customer.email });
      return { userId: null, planSlug: null };
    }

    logStep("Resolved user by email fallback", { userId: user.id, email: customer.email });
    return { userId: user.id, planSlug: metadata?.plan_slug || null };
  } catch (err) {
    logStep("Error resolving user", { error: (err as Error).message });
    return { userId: null, planSlug: null };
  }
}

async function resolvePlanSlug(
  stripe: Stripe,
  subscription: Stripe.Subscription,
  metadataPlanSlug: string | null
): Promise<string | null> {
  if (metadataPlanSlug) return metadataPlanSlug;

  // Derive from product metadata
  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) return null;

  try {
    const price = await stripe.prices.retrieve(priceId);
    const product = await stripe.products.retrieve(price.product as string);
    return product.metadata?.plan_slug || null;
  } catch {
    return null;
  }
}

async function upsertSubscription(
  supabase: any,
  userId: string,
  planSlug: string,
  customerId: string,
  subscriptionId: string,
  subscription: Stripe.Subscription,
  status?: string
) {
  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("slug", planSlug)
    .single();

  if (!plan) {
    logStep("Plan not found in DB", { planSlug });
    return;
  }

  const { error } = await supabase
    .from("user_subscriptions")
    .upsert({
      user_id: userId,
      plan_id: plan.id,
      status: status || "active",
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    }, { onConflict: "user_id" });

  if (error) logStep("Error upserting subscription", { error });
  else logStep("Subscription upserted", { userId, planSlug, status: status || "active" });
}

serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response("No signature", { status: 400 });
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      logStep("ERROR: STRIPE_WEBHOOK_SECRET not set");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      logStep("Signature verification failed", { error: (err as Error).message });
      return new Response("Invalid signature", { status: 400 });
    }

    logStep("Event received", { type: event.type, id: event.id });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const { userId, planSlug } = await resolveUserId(
          supabase, stripe, session.metadata as Record<string, string>, customerId
        );

        if (!userId || !planSlug) {
          logStep("Could not resolve user/plan for checkout", { userId, planSlug });
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await upsertSubscription(supabase, userId, planSlug, customerId, subscriptionId, subscription);
        logStep("Checkout completed - subscription activated", { userId, planSlug });
        break;
      }

      case "invoice.payment_succeeded":
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const customerId = invoice.customer as string;
        const { userId } = await resolveUserId(
          supabase, stripe, subscription.metadata as Record<string, string>, customerId
        );
        if (!userId) break;

        const planSlug = await resolvePlanSlug(stripe, subscription, null);
        if (planSlug) {
          await upsertSubscription(supabase, userId, planSlug, customerId, subscriptionId, subscription);
        } else {
          // Just update period
          const { error } = await supabase
            .from("user_subscriptions")
            .update({
              status: "active",
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq("user_id", userId);
          if (error) logStep("Error updating period", { error });
          else logStep("Period renewed", { userId });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const customerId = invoice.customer as string;
        const { userId } = await resolveUserId(
          supabase, stripe, subscription.metadata as Record<string, string>, customerId
        );
        if (!userId) break;

        await supabase
          .from("user_subscriptions")
          .update({ status: "past_due" })
          .eq("user_id", userId);

        logStep("Payment failed, marked past_due", { userId });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const { userId } = await resolveUserId(
          supabase, stripe, subscription.metadata as Record<string, string>, customerId
        );
        if (!userId) break;

        const planSlug = await resolvePlanSlug(stripe, subscription, subscription.metadata?.plan_slug || null);
        if (planSlug) {
          await upsertSubscription(
            supabase, userId, planSlug, customerId, subscription.id, subscription,
            subscription.status === "active" ? "active" : subscription.status
          );
          logStep("Subscription updated", { userId, planSlug, status: subscription.status });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const { userId } = await resolveUserId(
          supabase, stripe, subscription.metadata as Record<string, string>, customerId
        );
        if (!userId) break;

        const { data: freePlan } = await supabase
          .from("subscription_plans")
          .select("id")
          .eq("slug", "free")
          .single();

        if (freePlan) {
          await supabase
            .from("user_subscriptions")
            .update({
              plan_id: freePlan.id,
              status: "active",
              stripe_subscription_id: null,
              current_period_end: null,
            })
            .eq("user_id", userId);

          logStep("Subscription cancelled, downgraded to free", { userId });
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    logStep("Unhandled error", { error: (error as Error).message });
    return new Response(JSON.stringify({ error: "Internal error" }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
