import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const statusLabels: Record<string, string> = {
  todo: "A Fazer",
  in_progress: "Em Progresso",
  review: "Em Revisão",
  completed: "Concluída",
};

interface TaskRow {
  id: string;
  title: string;
  due_date: string;
  assigned_to: string;
  status: string;
  project_id: string;
  projects: { name: string } | null;
  profiles: { full_name: string } | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authorization (accepts anon key from cron or service role key)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Unauthorized: missing auth header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Use service role key internally for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const appUrl = Deno.env.get("APP_URL") || "https://agilelite.equilibriumtecnologia.com.br";

    // Get current date boundaries (UTC)
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    // Fetch tasks that are not completed, have a due_date, and are assigned
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("id, title, due_date, assigned_to, status, project_id, projects(name), profiles:assigned_to(full_name)")
      .not("assigned_to", "is", null)
      .not("due_date", "is", null)
      .neq("status", "completed")
      .lte("due_date", tomorrowStr);

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError.message);
      return new Response(
        JSON.stringify({ error: "Failed to fetch tasks" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!tasks || tasks.length === 0) {
      console.log("No tasks approaching or past due date");
      return new Response(
        JSON.stringify({ message: "No notifications to send", sent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch existing notification logs to avoid duplicates
    const taskIds = tasks.map((t: TaskRow) => t.id);
    const { data: existingLogs } = await supabase
      .from("task_notification_log")
      .select("task_id, user_id, notification_type")
      .in("task_id", taskIds);

    const sentSet = new Set(
      (existingLogs || []).map((l: { task_id: string; user_id: string; notification_type: string }) =>
        `${l.task_id}:${l.user_id}:${l.notification_type}`
      )
    );

    let sentCount = 0;
    const errors: string[] = [];

    for (const task of tasks as TaskRow[]) {
      const dueDate = task.due_date;
      let notificationType: "due_soon" | "overdue";

      if (dueDate === tomorrowStr) {
        notificationType = "due_soon";
      } else if (dueDate < todayStr) {
        notificationType = "overdue";
      } else if (dueDate === todayStr) {
        // Due today — treat as due_soon
        notificationType = "due_soon";
      } else {
        continue;
      }

      const key = `${task.id}:${task.assigned_to}:${notificationType}`;
      if (sentSet.has(key)) {
        continue; // Already notified
      }

      // Get user email via admin API
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(task.assigned_to);
      if (userError || !userData?.user?.email) {
        errors.push(`Could not get email for user ${task.assigned_to}: ${userError?.message || "no email"}`);
        continue;
      }

      const recipientEmail = userData.user.email;
      const recipientName = (task.profiles as { full_name: string } | null)?.full_name || "Usuário";
      const projectName = (task.projects as { name: string } | null)?.name || "";

      // Build email
      const { subject, headerText, bodyContent } = buildEmailContent(
        notificationType, task.title, recipientName, projectName, dueDate, appUrl
      );

      const emailHtml = buildEmailHtml(headerText, bodyContent, appUrl);

      try {
        await resend.emails.send({
          from: "Agile Lite <no-reply@agilelite.equilibriumtecnologia.com.br>",
          to: [recipientEmail],
          subject,
          html: emailHtml,
        });

        // Log the notification
        await supabase.from("task_notification_log").insert({
          task_id: task.id,
          user_id: task.assigned_to,
          notification_type: notificationType,
        });

        sentCount++;
        console.log(`Sent ${notificationType} notification for task "${task.title}" to ${recipientEmail}`);
      } catch (emailError: any) {
        errors.push(`Failed to send email for task ${task.id}: ${emailError.message}`);
      }
    }

    console.log(`Done. Sent ${sentCount} notifications. Errors: ${errors.length}`);
    return new Response(
      JSON.stringify({ message: "Check complete", sent: sentCount, errors }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in check-due-tasks:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

function buildEmailContent(
  type: "due_soon" | "overdue",
  taskTitle: string,
  recipientName: string,
  projectName: string,
  dueDate: string,
  appUrl: string
) {
  const formattedDate = new Date(dueDate + "T00:00:00").toLocaleDateString("pt-BR");

  if (type === "due_soon") {
    return {
      subject: `⏰ Tarefa próxima ao vencimento: ${taskTitle}`,
      headerText: "⏰ Tarefa Próxima ao Vencimento",
      bodyContent: `
        <p style="margin: 0 0 24px 0; color: #F8F8F8; font-size: 18px; line-height: 28px;">
          Olá, <span style="color: #A78BFA; font-weight: 600;">${recipientName}</span>! 👋
        </p>
        <p style="margin: 0 0 28px 0; color: #E5E5E5; font-size: 16px; line-height: 26px;">
          Sua tarefa está próxima ao vencimento:
        </p>
        <div style="padding: 20px; background: linear-gradient(135deg, rgba(84, 21, 255, 0.15) 0%, rgba(124, 58, 237, 0.1) 100%); border-radius: 8px; border-left: 4px solid #F59E0B; margin-bottom: 28px;">
          <p style="margin: 0 0 8px 0; color: #F59E0B; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
            Vence em ${formattedDate}
          </p>
          <p style="margin: 0; color: #F8F8F8; font-size: 18px; font-weight: 600;">
            ${taskTitle}
          </p>
          ${projectName ? `<p style="margin: 8px 0 0 0; color: #A1A1AA; font-size: 14px;">Projeto: ${projectName}</p>` : ""}
        </div>
      `,
    };
  } else {
    return {
      subject: `🚨 Tarefa vencida: ${taskTitle}`,
      headerText: "🚨 Tarefa Vencida",
      bodyContent: `
        <p style="margin: 0 0 24px 0; color: #F8F8F8; font-size: 18px; line-height: 28px;">
          Olá, <span style="color: #A78BFA; font-weight: 600;">${recipientName}</span>! 👋
        </p>
        <p style="margin: 0 0 28px 0; color: #E5E5E5; font-size: 16px; line-height: 26px;">
          A seguinte tarefa está <strong style="color: #EF4444;">vencida</strong>:
        </p>
        <div style="padding: 20px; background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%); border-radius: 8px; border-left: 4px solid #EF4444; margin-bottom: 28px;">
          <p style="margin: 0 0 8px 0; color: #EF4444; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
            Venceu em ${formattedDate}
          </p>
          <p style="margin: 0; color: #F8F8F8; font-size: 18px; font-weight: 600;">
            ${taskTitle}
          </p>
          ${projectName ? `<p style="margin: 8px 0 0 0; color: #A1A1AA; font-size: 14px;">Projeto: ${projectName}</p>` : ""}
        </div>
      `,
    };
  }
}

function buildEmailHtml(headerText: string, bodyContent: string, appUrl: string): string {
  const headerBg = headerText.includes("Vencida")
    ? "linear-gradient(135deg, #DC2626 0%, #991B1B 50%, #B91C1C 100%)"
    : "linear-gradient(135deg, #D97706 0%, #92400E 50%, #B45309 100%)";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #000823; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000823; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1E202C; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(84, 21, 255, 0.25);">
                <tr>
                  <td style="background: ${headerBg}; padding: 48px 40px; text-align: center;">
                    <h1 style="margin: 0; color: #F8F8F8; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                      ${headerText}
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 48px 40px; background-color: #1E202C;">
                    ${bodyContent}
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 36px 0;">
                      <tr>
                        <td align="center">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td align="center" style="background: linear-gradient(135deg, #5415FF 0%, #7C3AED 100%); border-radius: 8px; box-shadow: 0 4px 20px rgba(84, 21, 255, 0.5);">
                                <a href="${appUrl}/dashboard" target="_blank" style="display: inline-block; color: #F8F8F8; text-decoration: none; padding: 18px 48px; font-size: 16px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; letter-spacing: 0.5px;">
                                  Ver Tarefa
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #000823; padding: 28px 40px; text-align: center; border-top: 1px solid #3B3B4F;">
                    <p style="margin: 0; color: #71717A; font-size: 12px; line-height: 20px;">
                      Notificação automática — você é o responsável por esta tarefa.
                    </p>
                    <p style="margin: 12px 0 0 0; color: #52525B; font-size: 11px;">
                      © ${new Date().getFullYear()} Agile Lite - Equilibrium Tecnologia
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

serve(handler);
