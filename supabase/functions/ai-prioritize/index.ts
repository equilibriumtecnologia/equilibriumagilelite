import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { tasks, projectName, sprintName } = await req.json();

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return new Response(JSON.stringify({ error: "No tasks provided" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const tasksSummary = tasks.map((t: any, i: number) => 
      `${i + 1}. "${t.title}" | Prioridade: ${t.priority} | Pontos: ${t.story_points ?? '?'} | Status: ${t.status} | Prazo: ${t.due_date || 'sem prazo'} | Atribuído: ${t.assigned_to_name || 'não atribuído'} | Última atualização: ${t.updated_at}`
    ).join("\n");

    const systemPrompt = `Você é um assistente de priorização ágil. Analise as tarefas abaixo do projeto "${projectName}"${sprintName ? ` (Sprint: ${sprintName})` : ' (Backlog)'} e sugira uma reordenação inteligente.

Critérios de priorização (em ordem de peso):
1. Prazo próximo ou vencido (mais urgente primeiro)
2. Prioridade atual (urgent > high > medium > low)
3. Story points (tarefas menores primeiro para flow, a menos que bloqueiem outras)
4. Tempo parado (tarefas sem atualização há muito tempo devem subir)
5. Criticidade e dependências implícitas nos títulos

Responda usando a ferramenta fornecida.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Reordene estas tarefas por prioridade:\n\n${tasksSummary}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_priority_order",
              description: "Return tasks reordered by priority with reasoning for each.",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        task_index: { type: "number", description: "Original 1-based index of the task" },
                        new_position: { type: "number", description: "New 1-based position in the suggested order" },
                        reasoning: { type: "string", description: "Brief reasoning (max 2 sentences) in Portuguese" },
                        suggested_priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
                      },
                      required: ["task_index", "new_position", "reasoning", "suggested_priority"],
                      additionalProperties: false,
                    },
                  },
                  summary: { type: "string", description: "Brief summary of the reordering rationale in Portuguese (1-2 sentences)" },
                },
                required: ["suggestions", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_priority_order" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI did not return structured data" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-prioritize error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
