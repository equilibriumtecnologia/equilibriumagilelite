import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[EXPORT-WORKSPACE] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

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

    let workspaceId: string;
    let userId: string;
    let queueItemId: string | null = null;
    let isManualExport = false;

    // Check if internal call or authenticated user
    const internalKey = req.headers.get("x-internal-key");
    const authHeader = req.headers.get("Authorization");

    if (internalKey === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
      const body = await req.json();
      workspaceId = body.workspace_id;
      userId = body.user_id;
      queueItemId = body.queue_item_id || null;
    } else if (authHeader) {
      // Manual export by authenticated workspace owner
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData.user) throw new Error("Not authenticated");
      
      const body = await req.json();
      workspaceId = body.workspace_id;
      userId = userData.user.id;
      isManualExport = true;

      // Verify user is workspace owner
      const { data: membership } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId)
        .single();

      if (!membership || membership.role !== "owner") {
        throw new Error("Apenas o owner do workspace pode exportar dados");
      }
    } else {
      throw new Error("Unauthorized");
    }

    logStep("Starting export", { workspaceId, userId, isManualExport });

    // Collect all workspace data
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", workspaceId)
      .single();

    if (!workspace) throw new Error("Workspace not found");

    const { data: members } = await supabase
      .from("workspace_members")
      .select("*, profiles(full_name, avatar_url)")
      .eq("workspace_id", workspaceId);

    const { data: projects } = await supabase
      .from("projects")
      .select("*")
      .eq("workspace_id", workspaceId);

    const projectIds = (projects || []).map((p: any) => p.id);

    let tasks: any[] = [];
    let sprints: any[] = [];
    let boardSettings: any[] = [];
    let subTasks: any[] = [];
    let taskHistory: any[] = [];

    if (projectIds.length > 0) {
      const { data: t } = await supabase
        .from("tasks")
        .select("*")
        .in("project_id", projectIds);
      tasks = t || [];

      const { data: s } = await supabase
        .from("sprints")
        .select("*")
        .in("project_id", projectIds);
      sprints = s || [];

      const { data: bs } = await supabase
        .from("board_settings")
        .select("*")
        .in("project_id", projectIds);
      boardSettings = bs || [];

      const taskIds = tasks.map((t: any) => t.id);
      if (taskIds.length > 0) {
        const { data: st } = await supabase
          .from("sub_tasks")
          .select("*")
          .in("task_id", taskIds);
        subTasks = st || [];

        const { data: th } = await supabase
          .from("task_history")
          .select("*")
          .in("task_id", taskIds);
        taskHistory = th || [];
      }
    }

    const { data: categories } = await supabase
      .from("categories")
      .select("*")
      .eq("workspace_id", workspaceId);

    const { data: templates } = await supabase
      .from("project_templates")
      .select("*")
      .eq("workspace_id", workspaceId);

    const { data: invitations } = await supabase
      .from("invitations")
      .select("*")
      .eq("workspace_id", workspaceId);

    const { data: projectMembers } = projectIds.length > 0
      ? await supabase.from("project_members").select("*").in("project_id", projectIds)
      : { data: [] };

    const exportData = {
      export_version: "1.0",
      exported_at: new Date().toISOString(),
      workspace,
      members: (members || []).map((m: any) => ({
        ...m,
        profile_name: m.profiles?.full_name,
      })),
      categories: categories || [],
      templates: templates || [],
      projects: (projects || []).map((project: any) => ({
        ...project,
        members: (projectMembers || []).filter((pm: any) => pm.project_id === project.id),
        tasks: tasks
          .filter((t: any) => t.project_id === project.id)
          .map((task: any) => ({
            ...task,
            sub_tasks: subTasks.filter((st: any) => st.task_id === task.id),
            history: taskHistory.filter((th: any) => th.task_id === task.id),
          })),
        sprints: sprints.filter((s: any) => s.project_id === project.id),
        board_settings: boardSettings.filter((bs: any) => bs.project_id === project.id),
      })),
      invitations: invitations || [],
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const jsonBytes = new TextEncoder().encode(jsonString);

    logStep("Export data compiled", { 
      projects: projects?.length || 0,
      tasks: tasks.length,
      size: jsonBytes.length,
    });

    // Upload to storage
    const fileName = `exports/${userId}/${workspaceId}_${Date.now()}.json`;
    
    // Ensure exports bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const exportsBucket = buckets?.find((b: any) => b.name === "workspace-exports");
    if (!exportsBucket) {
      await supabase.storage.createBucket("workspace-exports", { 
        public: false,
        fileSizeLimit: 52428800, // 50MB
      });
    }

    const { error: uploadError } = await supabase.storage
      .from("workspace-exports")
      .upload(fileName, jsonBytes, {
        contentType: "application/json",
        upsert: true,
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    // Create signed URL (7 days)
    const { data: signedUrl } = await supabase.storage
      .from("workspace-exports")
      .createSignedUrl(fileName, 7 * 24 * 60 * 60); // 7 days

    const downloadUrl = signedUrl?.signedUrl;
    logStep("File uploaded, signed URL created", { fileName });

    // Update queue item if exists
    if (queueItemId) {
      await supabase
        .from("downgrade_queue")
        .update({
          export_url: downloadUrl,
          export_generated_at: new Date().toISOString(),
          status: "exported",
        })
        .eq("id", queueItemId);
    }

    // Send email with download link
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const userEmail = authUser?.user?.email;

    if (userEmail && downloadUrl) {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        const appUrl = Deno.env.get("APP_URL") || "https://agilelite.equilibriumtecnologia.com.br";
        
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "AgileLite <notify@notify.agilelite.equilibriumtecnologia.com.br>",
            to: [userEmail],
            subject: `Export dos dados do workspace "${workspace.name}"`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #e0e0e0; padding: 32px; border-radius: 12px;">
                <h2 style="color: #a78bfa;">Seus dados estão prontos para download</h2>
                <p>Olá ${userProfile?.full_name || 'Usuário'},</p>
                <p>Os dados do workspace <strong>"${workspace.name}"</strong> foram exportados com sucesso.</p>
                <p>Clique no botão abaixo para baixar o arquivo JSON com todos os seus dados:</p>
                <div style="text-align: center; margin: 24px 0;">
                  <a href="${downloadUrl}" 
                     style="background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                    Baixar Dados (JSON)
                  </a>
                </div>
                <p style="color: #999; font-size: 12px;">
                  Este link expira em 7 dias. Após a expiração, os dados serão excluídos permanentemente.
                </p>
                <hr style="border-color: #333; margin: 24px 0;">
                <p style="color: #666; font-size: 11px; text-align: center;">
                  AgileLite — Equilibrium Tecnologia
                </p>
              </div>
            `,
          }),
        });
        logStep("Export email sent", { email: userEmail });
      }
    }

    // If manual export, return the download URL directly
    if (isManualExport) {
      return new Response(JSON.stringify({ 
        success: true, 
        download_url: downloadUrl,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
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
