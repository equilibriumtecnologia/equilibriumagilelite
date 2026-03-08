import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[RESTORE-DOWNGRADE] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

/**
 * Called when a user upgrades back. Restores all queue items that haven't been permanently deleted.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    let userId: string;
    const internalKey = req.headers.get("x-internal-key");
    const authHeader = req.headers.get("Authorization");

    if (internalKey === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
      const body = await req.json();
      userId = body.user_id;
    } else if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error } = await supabase.auth.getUser(token);
      if (error || !userData.user) throw new Error("Not authenticated");
      userId = userData.user.id;
    } else {
      throw new Error("Unauthorized");
    }

    logStep("Restoring items for user", { userId });

    // Get all non-deleted queue items
    const { data: queueItems } = await supabase
      .from("downgrade_queue")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["grace_period", "suspended", "exported"]);

    let restored = 0;

    for (const item of queueItems || []) {
      if (item.item_type === 'owned_workspace' && item.workspace_id) {
        // Unsuspend workspace
        await supabase
          .from("workspaces")
          .update({ is_suspended: false, suspended_at: null })
          .eq("id", item.workspace_id);
        
        logStep("Workspace restored", { workspaceId: item.workspace_id });
        restored++;
      }

      // Mark queue item as restored
      await supabase
        .from("downgrade_queue")
        .update({ status: "restored" })
        .eq("id", item.id);
    }

    // Notify user
    if (restored > 0) {
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "upgrade_restored",
        title: "Recursos restaurados",
        message: `Seu upgrade restaurou ${restored} recurso(s) que estavam na fila de downgrade.`,
        link: "/",
      });
    }

    logStep("Restoration complete", { restored, total: queueItems?.length || 0 });

    return new Response(JSON.stringify({ restored, total: queueItems?.length || 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
