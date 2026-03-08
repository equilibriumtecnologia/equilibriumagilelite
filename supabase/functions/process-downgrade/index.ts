import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[PROCESS-DOWNGRADE] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

interface DowngradeRequest {
  user_id: string;
  previous_plan_slug: string;
  new_plan_slug: string;
  trigger: 'webhook' | 'sync' | 'refund';
}

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

    // Can be called by webhook (no auth) or by authenticated user (sync)
    let body: DowngradeRequest;

    // Check for internal call (from webhook or cron)
    const authHeader = req.headers.get("Authorization");
    const internalKey = req.headers.get("x-internal-key");
    
    if (internalKey === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
      // Internal call from webhook
      body = await req.json();
    } else if (authHeader) {
      // Authenticated user call (from sync)
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData.user) throw new Error("Not authenticated");
      body = await req.json();
      body.user_id = userData.user.id; // Override to prevent spoofing
    } else {
      throw new Error("Unauthorized");
    }

    const { user_id, previous_plan_slug, new_plan_slug, trigger } = body;
    logStep("Processing downgrade", { user_id, previous_plan_slug, new_plan_slug, trigger });

    // Get user's new plan limits
    const { data: newPlanData } = await supabase.rpc("get_user_plan", { _user_id: user_id });
    const newPlan = newPlanData as any;
    if (!newPlan) throw new Error("Could not get user plan");

    logStep("New plan limits", {
      max_created_workspaces: newPlan.max_created_workspaces,
      max_guest_workspaces: newPlan.max_guest_workspaces,
      max_projects_per_workspace: newPlan.max_projects_per_workspace,
    });

    // Check if user is master (masters don't get downgraded)
    if (newPlan.is_master) {
      logStep("User is master, skipping downgrade");
      return new Response(JSON.stringify({ processed: false, reason: "master" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const gracePeriodDays = 7;
    const gracePeriodEndsAt = new Date(Date.now() + gracePeriodDays * 24 * 60 * 60 * 1000).toISOString();
    const itemsToQueue: any[] = [];

    // 1. Check owned workspaces (excluding default) - newest first
    const { data: ownedWorkspaces } = await supabase
      .from("workspace_members")
      .select("workspace_id, workspaces!inner(id, name, is_default, created_at)")
      .eq("user_id", user_id)
      .eq("role", "owner")
      .order("joined_at", { ascending: false });

    const nonDefaultOwned = (ownedWorkspaces || [])
      .filter((wm: any) => !wm.workspaces.is_default)
      .sort((a: any, b: any) => 
        new Date(b.workspaces.created_at).getTime() - new Date(a.workspaces.created_at).getTime()
      );

    const maxCreated = newPlan.max_created_workspaces;
    if (nonDefaultOwned.length > maxCreated) {
      const exceeding = nonDefaultOwned.slice(maxCreated); // Keep oldest, queue newest
      for (const wm of exceeding) {
        itemsToQueue.push({
          user_id,
          item_type: 'owned_workspace',
          workspace_id: wm.workspace_id,
          grace_period_ends_at: gracePeriodEndsAt,
          status: 'grace_period',
          previous_plan_slug,
          new_plan_slug,
        });
      }
      logStep("Owned workspaces exceeding", { count: exceeding.length, kept: maxCreated });
    }

    // 2. Check guest workspaces - newest first
    const { data: guestWorkspaces } = await supabase
      .from("workspace_members")
      .select("workspace_id, joined_at")
      .eq("user_id", user_id)
      .neq("role", "owner")
      .order("joined_at", { ascending: false });

    const maxGuest = newPlan.max_guest_workspaces;
    if ((guestWorkspaces || []).length > maxGuest) {
      const exceeding = (guestWorkspaces || []).slice(maxGuest);
      for (const wm of exceeding) {
        itemsToQueue.push({
          user_id,
          item_type: 'guest_workspace',
          workspace_id: wm.workspace_id,
          grace_period_ends_at: gracePeriodEndsAt,
          status: 'grace_period',
          previous_plan_slug,
          new_plan_slug,
        });
      }
      logStep("Guest workspaces exceeding", { count: exceeding.length, kept: maxGuest });
    }

    // 3. Check projects in default workspace exceeding limits
    const { data: defaultWsMember } = await supabase
      .from("workspace_members")
      .select("workspace_id, workspaces!inner(id, is_default)")
      .eq("user_id", user_id)
      .eq("role", "owner")
      .eq("workspaces.is_default", true)
      .single();

    if (defaultWsMember) {
      const defaultWsId = defaultWsMember.workspace_id;
      const { data: projects } = await supabase
        .from("projects")
        .select("id, created_at")
        .eq("workspace_id", defaultWsId)
        .order("created_at", { ascending: false });

      const maxProjects = newPlan.max_projects_per_workspace;
      if ((projects || []).length > maxProjects) {
        const exceeding = (projects || []).slice(maxProjects);
        for (const proj of exceeding) {
          itemsToQueue.push({
            user_id,
            item_type: 'exceeding_project',
            workspace_id: defaultWsId,
            project_id: proj.id,
            grace_period_ends_at: gracePeriodEndsAt,
            status: 'grace_period',
            previous_plan_slug,
            new_plan_slug,
          });
        }
        logStep("Projects exceeding in default WS", { count: exceeding.length, kept: maxProjects });
      }
    }

    // Also check projects in kept owned workspaces
    const keptOwnedIds = nonDefaultOwned.slice(0, maxCreated).map((wm: any) => wm.workspace_id);
    for (const wsId of keptOwnedIds) {
      const { data: projects } = await supabase
        .from("projects")
        .select("id, created_at")
        .eq("workspace_id", wsId)
        .order("created_at", { ascending: false });

      const maxProjects = newPlan.max_projects_per_workspace;
      if ((projects || []).length > maxProjects) {
        const exceeding = (projects || []).slice(maxProjects);
        for (const proj of exceeding) {
          itemsToQueue.push({
            user_id,
            item_type: 'exceeding_project',
            workspace_id: wsId,
            project_id: proj.id,
            grace_period_ends_at: gracePeriodEndsAt,
            status: 'grace_period',
            previous_plan_slug,
            new_plan_slug,
          });
        }
      }
    }

    if (itemsToQueue.length === 0) {
      logStep("No exceeding resources, no queue items needed");
      return new Response(JSON.stringify({ processed: true, queued: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Clear any existing grace_period items for this user (in case of re-trigger)
    await supabase
      .from("downgrade_queue")
      .delete()
      .eq("user_id", user_id)
      .eq("status", "grace_period");

    // Insert all queue items
    const { error: insertError } = await supabase
      .from("downgrade_queue")
      .insert(itemsToQueue);

    if (insertError) {
      logStep("Error inserting queue items", { error: insertError });
      throw new Error(`Failed to insert queue: ${insertError.message}`);
    }

    logStep("Downgrade queue created", { items: itemsToQueue.length });

    // Create notification for the user
    await supabase.from("notifications").insert({
      user_id,
      type: "downgrade",
      title: "Downgrade de Plano Detectado",
      message: `Seu plano foi alterado para ${newPlan.plan_name}. Você tem 7 dias para exportar dados dos recursos que excedem os limites do novo plano.`,
      link: "/settings",
    });

    return new Response(JSON.stringify({ 
      processed: true, 
      queued: itemsToQueue.length,
      grace_period_ends_at: gracePeriodEndsAt,
    }), {
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
