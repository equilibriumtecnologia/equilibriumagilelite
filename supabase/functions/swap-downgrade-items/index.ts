import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[SWAP-DOWNGRADE] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

/**
 * Allows a user to swap which workspaces/projects are kept vs queued for downgrade.
 * 
 * Body: { 
 *   keep_workspace_ids: string[],    // owned workspace IDs to KEEP (rest get queued)
 *   keep_guest_ids: string[],        // guest workspace IDs to KEEP
 *   keep_project_ids: Record<string, string[]> // per workspace: project IDs to KEEP
 * }
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");
    const userId = userData.user.id;

    const body = await req.json();
    const { keep_workspace_ids, keep_guest_ids, keep_project_ids } = body as {
      keep_workspace_ids?: string[];
      keep_guest_ids?: string[];
      keep_project_ids?: Record<string, string[]>;
    };

    logStep("Swap request", { userId, keep_workspace_ids, keep_guest_ids, keep_project_ids });

    // Get current plan limits
    const { data: planData } = await supabase.rpc("get_user_plan", { _user_id: userId });
    const plan = planData as any;
    if (!plan) throw new Error("Could not get user plan");
    if (plan.is_master) throw new Error("Master users don't have downgrade limits");

    // Get existing queue items for this user (only grace_period — can't swap suspended)
    const { data: existingItems } = await supabase
      .from("downgrade_queue")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "grace_period");

    if (!existingItems || existingItems.length === 0) {
      return new Response(JSON.stringify({ error: "No items in grace period to swap" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Preserve grace period end from existing items
    const gracePeriodEndsAt = existingItems[0].grace_period_ends_at;
    const previousPlanSlug = existingItems[0].previous_plan_slug;
    const newPlanSlug = existingItems[0].new_plan_slug;

    // ---- OWNED WORKSPACES ----
    // Get all owned non-default workspaces
    const { data: ownedWsMembers } = await supabase
      .from("workspace_members")
      .select("workspace_id, workspaces!inner(id, is_default, created_at)")
      .eq("user_id", userId)
      .eq("role", "owner");

    const nonDefaultOwned = (ownedWsMembers || [])
      .filter((wm: any) => !wm.workspaces.is_default)
      .map((wm: any) => wm.workspace_id);

    const maxCreated = plan.max_created_workspaces;

    // Validate: user can't keep more than their limit
    const keptOwned = (keep_workspace_ids || []).filter((id: string) => nonDefaultOwned.includes(id));
    if (keptOwned.length > maxCreated) {
      return new Response(JSON.stringify({ 
        error: `Limite de workspaces criados: ${maxCreated}. Você selecionou ${keptOwned.length}.` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const queuedOwned = nonDefaultOwned.filter((id: string) => !keptOwned.includes(id));

    // ---- GUEST WORKSPACES ----
    const { data: guestWsMembers } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .neq("role", "owner");

    const allGuest = (guestWsMembers || []).map((wm: any) => wm.workspace_id);
    const maxGuest = plan.max_guest_workspaces;

    const keptGuest = (keep_guest_ids || []).filter((id: string) => allGuest.includes(id));
    if (keptGuest.length > maxGuest) {
      return new Response(JSON.stringify({ 
        error: `Limite de workspaces convidados: ${maxGuest}. Você selecionou ${keptGuest.length}.` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const queuedGuest = allGuest.filter((id: string) => !keptGuest.includes(id));

    // ---- PROJECTS (in kept workspaces + default) ----
    const { data: defaultWsMember } = await supabase
      .from("workspace_members")
      .select("workspace_id, workspaces!inner(id, is_default)")
      .eq("user_id", userId)
      .eq("role", "owner")
      .eq("workspaces.is_default", true)
      .single();

    const defaultWsId = defaultWsMember?.workspace_id;
    const wsIdsToCheckProjects = [...keptOwned];
    if (defaultWsId) wsIdsToCheckProjects.push(defaultWsId);

    const maxProjects = plan.max_projects_per_workspace;
    const projectQueueItems: any[] = [];

    for (const wsId of wsIdsToCheckProjects) {
      const { data: projects } = await supabase
        .from("projects")
        .select("id, created_at")
        .eq("workspace_id", wsId)
        .order("created_at", { ascending: false });

      if (!projects || projects.length <= maxProjects) continue;

      const keptForWs = keep_project_ids?.[wsId] || [];
      
      if (keptForWs.length > maxProjects) {
        return new Response(JSON.stringify({ 
          error: `Limite de projetos por workspace: ${maxProjects}. Workspace ${wsId} tem ${keptForWs.length} selecionados.` 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      // Projects not in the kept list become queued
      const queuedProjects = projects
        .filter(p => !keptForWs.includes(p.id))
        .slice(0, projects.length - maxProjects); // Only queue the excess

      // If user specified keeps, queue everything else that exceeds
      const allProjectIds = projects.map(p => p.id);
      const actualKept = keptForWs.length > 0 
        ? keptForWs 
        : allProjectIds.slice(allProjectIds.length - maxProjects); // default: keep oldest
      
      const actualQueued = allProjectIds.filter(id => !actualKept.includes(id));

      for (const projId of actualQueued) {
        projectQueueItems.push({
          user_id: userId,
          item_type: "exceeding_project",
          workspace_id: wsId,
          project_id: projId,
          grace_period_ends_at: gracePeriodEndsAt,
          status: "grace_period",
          previous_plan_slug: previousPlanSlug,
          new_plan_slug: newPlanSlug,
        });
      }
    }

    // ---- APPLY CHANGES ----
    // Delete all existing grace_period items for this user
    await supabase
      .from("downgrade_queue")
      .delete()
      .eq("user_id", userId)
      .eq("status", "grace_period");

    // Build new queue items
    const newQueueItems: any[] = [];

    // Only queue workspaces that exceed limits
    if (nonDefaultOwned.length > maxCreated) {
      for (const wsId of queuedOwned) {
        newQueueItems.push({
          user_id: userId,
          item_type: "owned_workspace",
          workspace_id: wsId,
          grace_period_ends_at: gracePeriodEndsAt,
          status: "grace_period",
          previous_plan_slug: previousPlanSlug,
          new_plan_slug: newPlanSlug,
        });
      }
    }

    if (allGuest.length > maxGuest) {
      for (const wsId of queuedGuest) {
        newQueueItems.push({
          user_id: userId,
          item_type: "guest_workspace",
          workspace_id: wsId,
          grace_period_ends_at: gracePeriodEndsAt,
          status: "grace_period",
          previous_plan_slug: previousPlanSlug,
          new_plan_slug: newPlanSlug,
        });
      }
    }

    newQueueItems.push(...projectQueueItems);

    if (newQueueItems.length > 0) {
      const { error: insertError } = await supabase
        .from("downgrade_queue")
        .insert(newQueueItems);

      if (insertError) throw new Error(`Failed to insert: ${insertError.message}`);
    }

    logStep("Swap complete", { 
      removed: existingItems.length, 
      added: newQueueItems.length,
      keptOwned: keptOwned.length,
      keptGuest: keptGuest.length,
    });

    return new Response(JSON.stringify({ 
      success: true, 
      queued: newQueueItems.length,
      kept_workspaces: keptOwned.length,
      kept_guest: keptGuest.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500,
    });
  }
});
