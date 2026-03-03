import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BoardSetting {
  id: string;
  project_id: string;
  column_id: string;
  wip_limit: number | null;
  label: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export function useBoardSettings(projectId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["board-settings", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("board_settings")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;
      return data as BoardSetting[];
    },
    enabled: !!projectId,
  });

  const upsertSetting = useMutation({
    mutationFn: async ({
      columnId,
      wipLimit,
      label,
      color,
    }: {
      columnId: string;
      wipLimit?: number | null;
      label?: string | null;
      color?: string | null;
    }) => {
      if (!projectId) throw new Error("Project ID is required");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
        project_id: projectId,
        column_id: columnId,
      };
      if (wipLimit !== undefined) payload.wip_limit = wipLimit;
      if (label !== undefined) payload.label = label;
      if (color !== undefined) payload.color = color;

      const { data, error } = await supabase
        .from("board_settings")
        .upsert(payload, {
            onConflict: "project_id,column_id",
          },
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["board-settings", projectId],
      });
      toast.success("Configuração atualizada");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar limite: " + error.message);
    },
  });

  const getWipLimit = (columnId: string): number | null => {
    const setting = settings?.find((s) => s.column_id === columnId);
    return setting?.wip_limit ?? null;
  };

  const getColumnLabel = (columnId: string): string | null => {
    const setting = settings?.find((s) => s.column_id === columnId);
    return setting?.label ?? null;
  };

  const getColumnColor = (columnId: string): string | null => {
    const setting = settings?.find((s) => s.column_id === columnId);
    return setting?.color ?? null;
  };

  const getWipStatus = (
    columnId: string,
    currentCount: number,
  ): "normal" | "warning" | "exceeded" => {
    const limit = getWipLimit(columnId);
    if (!limit) return "normal";
    if (currentCount >= limit) return "exceeded";
    if (currentCount >= limit * 0.8) return "warning";
    return "normal";
  };

  return {
    settings,
    isLoading,
    upsertSetting,
    getWipLimit,
    getWipStatus,
    getColumnLabel,
    getColumnColor,
  };
}
