import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Web Push crypto helpers
async function generatePushPayload(
  subscription: { endpoint: string; p256dh: string; auth_key: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
) {
  // Import web-push for Deno
  const webPush = await import("https://esm.sh/web-push@3.6.7");

  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  await webPush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth_key,
      },
    },
    payload
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

    // === AUTHENTICATION: Only service role key allowed ===
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const providedKey = authHeader.replace("Bearer ", "");
    if (providedKey !== serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Only service role can call this function" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { user_id, title, body, url, icon } = await req.json();

    if (!user_id || !title) {
      return new Response(
        JSON.stringify({ error: "user_id and title are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to read all subscriptions for the user
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id);

    if (error) throw error;
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: "No push subscriptions found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = JSON.stringify({
      title,
      body: body || "",
      url: url || "/dashboard",
      icon: icon || "/pwa-192x192.png",
    });

    let sent = 0;
    const expiredEndpoints: string[] = [];

    for (const sub of subscriptions) {
      try {
        await generatePushPayload(
          sub,
          payload,
          vapidPublicKey,
          vapidPrivateKey,
          "mailto:suporte@agileiteequilibrium.com"
        );
        sent++;
      } catch (err: any) {
        console.error(`Push failed for endpoint ${sub.endpoint}:`, err.statusCode || err.message);
        // 410 Gone or 404 = subscription expired
        if (err.statusCode === 410 || err.statusCode === 404) {
          expiredEndpoints.push(sub.endpoint);
        }
      }
    }

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", expiredEndpoints);
    }

    return new Response(
      JSON.stringify({ sent, expired_removed: expiredEndpoints.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("send-push-notification error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
