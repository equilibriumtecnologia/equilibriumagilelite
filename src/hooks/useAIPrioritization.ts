import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";
import { useUserPlan } from "@/hooks/useUserPlan";

type Task = Database["public"]["Tables"]["tasks"]["Row"];

export interface AISuggestion {
  task_index: number;
  new_position: number;
  reasoning: string;
  suggested_priority: string;
  task_id: string;
  task_title: string;
}

interface AIPrioritizationResult {
  suggestions: AISuggestion[];
  summary: string;
}

const AI_ALLOWED_PLANS = ["standard", "pro", "master"];

export function useAIPrioritization() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AIPrioritizationResult | null>(null);
  const { plan } = useUserPlan();

  const isAIAvailable = plan ? AI_ALLOWED_PLANS.includes(plan.plan_slug) : false;

  const prioritize = async (
    tasks: Task[],
    projectName: string,
    sprintName?: string,
    assigneeNames?: Record<string, string>
  ) => {
    if (!isAIAvailable) {
      toast.error("Funcionalidade de IA disponível a partir do plano Standard. Faça upgrade para utilizar.");
      return;
    }

    if (tasks.length === 0) {
      toast.error("Nenhuma tarefa para priorizar");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const taskPayload = tasks.map((t) => ({
        title: t.title,
        priority: t.priority,
        story_points: t.story_points,
        status: t.status,
        due_date: t.due_date,
        assigned_to_name: t.assigned_to && assigneeNames ? assigneeNames[t.assigned_to] : null,
        updated_at: t.updated_at,
      }));

      const { data, error } = await supabase.functions.invoke("ai-prioritize", {
        body: { tasks: taskPayload, projectName, sprintName },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      // Map back task ids
      const enriched: AISuggestion[] = (data.suggestions || []).map((s: any) => ({
        ...s,
        task_id: tasks[s.task_index - 1]?.id || "",
        task_title: tasks[s.task_index - 1]?.title || "",
      }));

      setResult({ suggestions: enriched, summary: data.summary || "" });
      toast.success("Sugestões da IA prontas!");
    } catch (err: any) {
      console.error("AI prioritization error:", err);
      toast.error("Erro ao consultar a IA. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const clear = () => setResult(null);

  return { prioritize, isLoading, result, clear, isAIAvailable };
}
