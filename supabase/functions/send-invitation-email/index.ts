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
    const appUrl = Deno.env.get("APP_URL") || "https://agilelite.equilibriumtecnologia.com.br";
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
        <body style="margin: 0; padding: 0; background-color: #000823; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000823; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1E202C; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(84, 21, 255, 0.25);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #5415FF 0%, #290880 50%, #4C1782 100%); padding: 48px 40px; text-align: center;">
                      <h1 style="margin: 0; color: #F8F8F8; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                        ✨ Você foi convidado!
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 48px 40px; background-color: #1E202C;">
                      <p style="margin: 0 0 24px 0; color: #F8F8F8; font-size: 18px; line-height: 28px;">
                        Olá! 👋
                      </p>
                      <p style="margin: 0 0 28px 0; color: #E5E5E5; font-size: 16px; line-height: 26px;">
                        <span style="color: #A78BFA; font-weight: 600;">${invitedByName}</span> convidou você para participar ${projectName ? `do projeto <span style="color: #A78BFA; font-weight: 600;">${projectName}</span>` : "da plataforma <span style='color: #A78BFA; font-weight: 600;'>Agile Lite</span>"} como <span style="color: #A78BFA; font-weight: 600;">${role === "admin" ? "Administrador" : role === "member" ? "Membro" : "Usuário"}</span>.
                      </p>
                      
                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 36px 0;">
                        <tr>
                          <td align="center">
                            <table cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td align="center" style="background: linear-gradient(135deg, #5415FF 0%, #7C3AED 100%); border-radius: 8px; box-shadow: 0 4px 20px rgba(84, 21, 255, 0.5);">
                                  <a href="${invitationUrl}" target="_blank" style="display: inline-block; color: #F8F8F8; text-decoration: none; padding: 18px 48px; font-size: 18px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; letter-spacing: 0.5px;">
                                    Aceitar Convite
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 24px 0 12px 0; color: #A1A1AA; font-size: 14px; line-height: 22px;">
                        Ou copie e cole este link no seu navegador:
                      </p>
                      <p style="margin: 0 0 28px 0; padding: 16px; background-color: #000823; border-radius: 8px; border: 1px solid #3B3B4F; word-break: break-all; font-size: 13px; color: #A78BFA; font-family: monospace;">
                        ${invitationUrl}
                      </p>
                      
                      <div style="padding: 16px; background: linear-gradient(135deg, rgba(84, 21, 255, 0.15) 0%, rgba(124, 58, 237, 0.1) 100%); border-radius: 8px; border-left: 4px solid #5415FF;">
                        <p style="margin: 0; color: #E5E5E5; font-size: 14px; line-height: 22px;">
                          ⏰ Este convite expira em <strong style="color: #A78BFA;">${expirationDate}</strong>
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #000823; padding: 28px 40px; text-align: center; border-top: 1px solid #3B3B4F;">
                      <p style="margin: 0; color: #71717A; font-size: 12px; line-height: 20px;">
                        Se você não esperava este convite, pode ignorar este email com segurança.
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
