import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TaskNotificationRequest {
  taskId: string;
  taskTitle: string;
  projectName: string;
  notificationType: "assigned" | "status_changed";
  recipientEmail: string;
  recipientName: string;
  changedByName: string;
  oldStatus?: string;
  newStatus?: string;
}

const statusLabels: Record<string, string> = {
  todo: "A Fazer",
  in_progress: "Em Progresso",
  review: "Em Revisão",
  completed: "Concluída",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === AUTHENTICATION CHECK ===
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing authentication" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with the user's auth token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the user's JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Failed to verify JWT:", claimsError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log("Authenticated user:", userId);

    // === PARSE REQUEST BODY ===
    const { 
      taskId,
      taskTitle,
      projectName,
      notificationType,
      recipientEmail,
      recipientName,
      changedByName,
      oldStatus,
      newStatus,
    }: TaskNotificationRequest = await req.json();

    // === INPUT VALIDATION ===
    if (!taskId || !taskTitle || !notificationType || !recipientEmail) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Bad Request: Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      console.error("Invalid email format:", recipientEmail);
      return new Response(
        JSON.stringify({ error: "Bad Request: Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending ${notificationType} notification to:`, recipientEmail);

    // === BUILD EMAIL ===
    const appUrl = Deno.env.get("APP_URL") || "https://agilelite.equilibriumtecnologia.com.br";
    
    let subject: string;
    let headerText: string;
    let bodyContent: string;

    if (notificationType === "assigned") {
      subject = `📋 Nova tarefa atribuída: ${taskTitle}`;
      headerText = "✨ Nova Tarefa Atribuída";
      bodyContent = `
        <p style="margin: 0 0 24px 0; color: #F8F8F8; font-size: 18px; line-height: 28px;">
          Olá, <span style="color: #A78BFA; font-weight: 600;">${recipientName}</span>! 👋
        </p>
        <p style="margin: 0 0 28px 0; color: #E5E5E5; font-size: 16px; line-height: 26px;">
          <span style="color: #A78BFA; font-weight: 600;">${changedByName}</span> atribuiu uma nova tarefa para você:
        </p>
        <div style="padding: 20px; background: linear-gradient(135deg, rgba(84, 21, 255, 0.15) 0%, rgba(124, 58, 237, 0.1) 100%); border-radius: 8px; border-left: 4px solid #5415FF; margin-bottom: 28px;">
          <p style="margin: 0 0 8px 0; color: #A78BFA; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
            Tarefa
          </p>
          <p style="margin: 0; color: #F8F8F8; font-size: 18px; font-weight: 600;">
            ${taskTitle}
          </p>
          ${projectName ? `<p style="margin: 8px 0 0 0; color: #A1A1AA; font-size: 14px;">Projeto: ${projectName}</p>` : ""}
        </div>
      `;
    } else {
      subject = `🔄 Status atualizado: ${taskTitle}`;
      headerText = "🔄 Status da Tarefa Atualizado";
      bodyContent = `
        <p style="margin: 0 0 24px 0; color: #F8F8F8; font-size: 18px; line-height: 28px;">
          Olá, <span style="color: #A78BFA; font-weight: 600;">${recipientName}</span>! 👋
        </p>
        <p style="margin: 0 0 28px 0; color: #E5E5E5; font-size: 16px; line-height: 26px;">
          <span style="color: #A78BFA; font-weight: 600;">${changedByName}</span> atualizou o status da sua tarefa:
        </p>
        <div style="padding: 20px; background: linear-gradient(135deg, rgba(84, 21, 255, 0.15) 0%, rgba(124, 58, 237, 0.1) 100%); border-radius: 8px; border-left: 4px solid #5415FF; margin-bottom: 28px;">
          <p style="margin: 0 0 8px 0; color: #A78BFA; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
            Tarefa
          </p>
          <p style="margin: 0 0 16px 0; color: #F8F8F8; font-size: 18px; font-weight: 600;">
            ${taskTitle}
          </p>
          ${projectName ? `<p style="margin: 0 0 16px 0; color: #A1A1AA; font-size: 14px;">Projeto: ${projectName}</p>` : ""}
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="padding: 6px 12px; background-color: #3B3B4F; border-radius: 4px; color: #A1A1AA; font-size: 14px;">
              ${statusLabels[oldStatus || ""] || oldStatus}
            </span>
            <span style="color: #A78BFA; font-size: 18px;">→</span>
            <span style="padding: 6px 12px; background: linear-gradient(135deg, #5415FF 0%, #7C3AED 100%); border-radius: 4px; color: #F8F8F8; font-size: 14px; font-weight: 600;">
              ${statusLabels[newStatus || ""] || newStatus}
            </span>
          </div>
        </div>
      `;
    }

    const emailHtml = `
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
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #5415FF 0%, #290880 50%, #4C1782 100%); padding: 48px 40px; text-align: center;">
                      <h1 style="margin: 0; color: #F8F8F8; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                        ${headerText}
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 48px 40px; background-color: #1E202C;">
                      ${bodyContent}
                      
                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 36px 0;">
                        <tr>
                          <td align="center">
                            <table cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td align="center" style="background: linear-gradient(135deg, #5415FF 0%, #7C3AED 100%); border-radius: 8px; box-shadow: 0 4px 20px rgba(84, 21, 255, 0.5);">
                                  <a href="${appUrl}/dashboard" target="_blank" style="display: inline-block; color: #F8F8F8; text-decoration: none; padding: 18px 48px; font-size: 16px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; letter-spacing: 0.5px;">
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
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #000823; padding: 28px 40px; text-align: center; border-top: 1px solid #3B3B4F;">
                      <p style="margin: 0; color: #71717A; font-size: 12px; line-height: 20px;">
                        Você recebeu este email porque está associado a esta tarefa.
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

    const emailResponse = await resend.emails.send({
      from: "Agile Lite <no-reply@agilelite.equilibriumtecnologia.com.br>",
      to: [recipientEmail],
      subject,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-task-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
