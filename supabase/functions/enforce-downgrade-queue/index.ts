import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[ENFORCE-DOWNGRADE] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

/**
 * This function is called by a cron job to enforce downgrade queue items:
 * 1. Grace period expired → suspend/remove
 * 2. 60 days after suspension → permanent delete
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

    const now = new Date().toISOString();

    // 1. Process grace period expirations
    const { data: expiredGrace } = await supabase
      .from("downgrade_queue")
      .select("*")
      .eq("status", "grace_period")
      .lte("grace_period_ends_at", now);

    logStep("Expired grace period items", { count: expiredGrace?.length || 0 });

    for (const item of expiredGrace || []) {
      const deleteAfter = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

      if (item.item_type === 'guest_workspace') {
        // Remove membership (hard delete) + notify workspace owner
        const { data: wsOwner } = await supabase
          .from("workspace_members")
          .select("user_id")
          .eq("workspace_id", item.workspace_id)
          .eq("role", "owner")
          .single();

        // Remove from workspace
        await supabase
          .from("workspace_members")
          .delete()
          .eq("workspace_id", item.workspace_id)
          .eq("user_id", item.user_id);

        // Remove permissions
        await supabase
          .from("user_permissions")
          .delete()
          .eq("workspace_id", item.workspace_id)
          .eq("user_id", item.user_id);

        // Remove from all projects in that workspace
        const { data: wsProjects } = await supabase
          .from("projects")
          .select("id")
          .eq("workspace_id", item.workspace_id);

        for (const proj of wsProjects || []) {
          await supabase
            .from("project_members")
            .delete()
            .eq("project_id", proj.id)
            .eq("user_id", item.user_id);
        }

        // Notify workspace owner
        if (wsOwner) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", item.user_id)
            .single();

          await supabase.from("notifications").insert({
            user_id: wsOwner.user_id,
            type: "member_removed",
            title: "Membro removido automaticamente",
            message: `${profile?.full_name || 'Um membro'} foi removido do workspace por downgrade de plano.`,
            link: "/workspace-settings",
          });
        }

        // Mark as deleted (guest items don't need 60-day wait)
        await supabase
          .from("downgrade_queue")
          .update({ status: "deleted", suspended_at: now })
          .eq("id", item.id);

        logStep("Guest membership removed", { userId: item.user_id, workspaceId: item.workspace_id });

      } else if (item.item_type === 'owned_workspace') {
        // Suspend the workspace
        await supabase
          .from("workspaces")
          .update({ is_suspended: true, suspended_at: now })
          .eq("id", item.workspace_id);

        // Update queue item
        await supabase
          .from("downgrade_queue")
          .update({ 
            status: "suspended", 
            suspended_at: now,
            delete_after: deleteAfter,
          })
          .eq("id", item.id);

        // Notify all members of this workspace
        const { data: members } = await supabase
          .from("workspace_members")
          .select("user_id")
          .eq("workspace_id", item.workspace_id);

        for (const member of members || []) {
          await supabase.from("notifications").insert({
            user_id: member.user_id,
            type: "workspace_suspended",
            title: "Workspace suspenso",
            message: "O workspace foi suspenso por downgrade de plano do proprietário. O acesso foi bloqueado.",
            link: "/",
          });
        }

        logStep("Workspace suspended", { workspaceId: item.workspace_id });

      } else if (item.item_type === 'exceeding_project') {
        // Projects in default/kept workspaces become read-only
        // We mark the queue item as suspended; the UI will check this
        await supabase
          .from("downgrade_queue")
          .update({
            status: "suspended",
            suspended_at: now,
            delete_after: deleteAfter,
          })
          .eq("id", item.id);

        logStep("Project marked as suspended/read-only", { projectId: item.project_id });
      }
    }

    // 2. Process permanent deletions (60 days after suspension)
    const { data: readyForDeletion } = await supabase
      .from("downgrade_queue")
      .select("*")
      .eq("status", "exported") // Only delete after export has been sent
      .lte("delete_after", now);

    logStep("Ready for permanent deletion", { count: readyForDeletion?.length || 0 });

    for (const item of readyForDeletion || []) {
      if (item.item_type === 'owned_workspace') {
        // Permanently delete the workspace (CASCADE will handle related data)
        const { error } = await supabase
          .from("workspaces")
          .delete()
          .eq("id", item.workspace_id);

        if (error) {
          logStep("Error deleting workspace", { error, workspaceId: item.workspace_id });
        } else {
          await supabase
            .from("downgrade_queue")
            .update({ status: "deleted" })
            .eq("id", item.id);
          logStep("Workspace permanently deleted", { workspaceId: item.workspace_id });
        }
      } else if (item.item_type === 'exceeding_project') {
        const { error } = await supabase
          .from("projects")
          .delete()
          .eq("id", item.project_id);

        if (error) {
          logStep("Error deleting project", { error, projectId: item.project_id });
        } else {
          await supabase
            .from("downgrade_queue")
            .update({ status: "deleted" })
            .eq("id", item.id);
          logStep("Project permanently deleted", { projectId: item.project_id });
        }
      }
    }

    // 3. Check suspended items approaching 60 days - trigger export if not done
    const exportDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days before deletion
    const { data: needsExport } = await supabase
      .from("downgrade_queue")
      .select("*")
      .eq("status", "suspended")
      .is("export_generated_at", null)
      .lte("delete_after", exportDeadline);

    for (const item of needsExport || []) {
      if (item.item_type === 'owned_workspace') {
        // Trigger export via export-workspace-data function
        try {
          const baseUrl = Deno.env.get("SUPABASE_URL") ?? "";
          await fetch(`${baseUrl}/functions/v1/export-workspace-data`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-internal-key": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
            },
            body: JSON.stringify({
              queue_item_id: item.id,
              workspace_id: item.workspace_id,
              user_id: item.user_id,
            }),
          });
          logStep("Export triggered", { workspaceId: item.workspace_id });
        } catch (err) {
          logStep("Error triggering export", { error: (err as Error).message });
        }
      }
    }

    return new Response(JSON.stringify({ 
      processed: true,
      grace_expired: expiredGrace?.length || 0,
      deleted: readyForDeletion?.length || 0,
      exports_triggered: needsExport?.length || 0,
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
