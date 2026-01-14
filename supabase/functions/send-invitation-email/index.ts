import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  email: string;
  invitedByName: string;
  projectName?: string;
  role: string;
  token: string;
  expiresAt: string;
}

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

    // Verify the user's JWT and get claims
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
    const { email, invitedByName, projectName, role, token: invitationToken, expiresAt }: InvitationEmailRequest = await req.json();

    // === INPUT VALIDATION ===
    if (!email || !invitationToken || !expiresAt) {
      console.error("Missing required fields:", { email: !!email, token: !!invitationToken, expiresAt: !!expiresAt });
      return new Response(
        JSON.stringify({ error: "Bad Request: Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("Invalid email format:", email);
      return new Response(
        JSON.stringify({ error: "Bad Request: Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // === AUTHORIZATION CHECK ===
    // Verify the invitation exists and belongs to the authenticated user (invited_by)
    const { data: invitation, error: invitationError } = await supabase
      .from("invitations")
      .select("id, invited_by, email, status")
      .eq("token", invitationToken)
      .single();

    if (invitationError || !invitation) {
      console.error("Invitation not found or access denied:", invitationError?.message);
      return new Response(
        JSON.stringify({ error: "Forbidden: Invitation not found or access denied" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify the caller is the one who created the invitation
    if (invitation.invited_by !== userId) {
      console.error("User is not the invitation creator:", { userId, invitedBy: invitation.invited_by });
      return new Response(
        JSON.stringify({ error: "Forbidden: Only the invitation creator can send emails" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify the email matches the invitation
    if (invitation.email !== email) {
      console.error("Email mismatch:", { requested: email, stored: invitation.email });
      return new Response(
        JSON.stringify({ error: "Forbidden: Email does not match invitation" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Only allow sending for pending invitations
    if (invitation.status !== "pending") {
      console.error("Invitation is not pending:", invitation.status);
      return new Response(
        JSON.stringify({ error: "Bad Request: Invitation is not in pending status" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Authorization passed. Sending invitation email to:", email);

    // === BUILD EMAIL ===
    const appUrl = Deno.env.get("APP_URL") || "https://oteqziddtpjosoacjfwq.lovable.app";
    const invitationUrl = `${appUrl}/accept-invitation?token=${invitationToken}`;

    const expirationDate = new Date(expiresAt).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #5415FF 0%, #4C1782 100%); padding: 40px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                        Você foi convidado!
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 24px;">
                        Olá! 👋
                      </p>
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 24px;">
                        <strong>${invitedByName}</strong> convidou você para participar ${projectName ? `do projeto <strong>${projectName}</strong>` : "da plataforma"} como <strong>${role === "admin" ? "Administrador" : role === "member" ? "Membro" : "Usuário"}</strong>.
                      </p>
                      
                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                        <tr>
                          <td align="center">
                            <table cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td align="center" style="background: linear-gradient(135deg, #5415FF 0%, #4C1782 100%); border-radius: 6px; box-shadow: 0 4px 12px rgba(84, 21, 255, 0.4);">
                                  <a href="${invitationUrl}" target="_blank" style="display: inline-block; color: #ffffff; text-decoration: none; padding: 16px 40px; font-size: 16px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;">
                                    Aceitar Convite
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 20px 0 0 0; color: #666666; font-size: 14px; line-height: 20px;">
                        Ou copie e cole este link no seu navegador:
                      </p>
                      <p style="margin: 8px 0 20px 0; padding: 12px; background-color: #f8f9fa; border-radius: 4px; word-break: break-all; font-size: 13px; color: #495057; font-family: monospace;">
                        ${invitationUrl}
                      </p>
                      
                      <p style="margin: 20px 0 0 0; color: #999999; font-size: 14px; line-height: 20px;">
                        ⏰ Este convite expira em <strong>${expirationDate}</strong>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 24px; text-align: center; border-top: 1px solid #e9ecef;">
                      <p style="margin: 0; color: #999999; font-size: 12px; line-height: 18px;">
                        Se você não esperava este convite, pode ignorar este email com segurança.
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
      to: [email],
      subject: projectName 
        ? `Convite para o projeto ${projectName}` 
        : "Convite para a plataforma Agile Lite",
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
    console.error("Error in send-invitation-email function:", error);
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
