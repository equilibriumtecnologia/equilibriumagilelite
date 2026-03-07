import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, company, phone, teamSize, message } = await req.json();

    // Validate required fields
    if (!name || !email || !company || !teamSize || !message) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios faltando" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "Email inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate lengths
    if (name.length > 100 || email.length > 255 || company.length > 100 || message.length > 2000) {
      return new Response(JSON.stringify({ error: "Campos excedem o tamanho máximo" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const APP_URL = Deno.env.get("APP_URL") || "https://agilelite.equilibriumtecnologia.com.br";

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Serviço de email não configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send email to the company
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ALE Enterprise <noreply@agilelite.equilibriumtecnologia.com.br>",
        to: ["contato@agilelite.equilibriumtecnologia.com.br"],
        subject: `[Enterprise Lead] ${company} - ${name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Nova Solicitação Enterprise</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Nome</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${email}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Empresa</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${company}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Telefone</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${phone || "Não informado"}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Equipe</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${teamSize}</td></tr>
            </table>
            <h3 style="margin-top: 20px;">Necessidades descritas:</h3>
            <p style="background: #f5f5f5; padding: 16px; border-radius: 8px; white-space: pre-wrap;">${message}</p>
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
            <p style="color: #666; font-size: 12px;">Enviado via formulário Enterprise em ${APP_URL}</p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend error:", errorText);
      return new Response(JSON.stringify({ error: "Falha ao enviar email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
