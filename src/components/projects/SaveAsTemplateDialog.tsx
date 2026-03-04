import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { BookmarkPlus } from "lucide-react";
import { useProjectTemplates, type TemplateConfig } from "@/hooks/useProjectTemplates";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(100),
  description: z.string().max(300).optional(),
  category: z.enum(["development", "marketing", "custom"]),
});

type FormData = z.infer<typeof formSchema>;

interface SaveAsTemplateDialogProps {
  projectId: string;
  projectName: string;
}

export function SaveAsTemplateDialog({ projectId, projectName }: SaveAsTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { createTemplate } = useProjectTemplates();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: `Template - ${projectName}`,
      description: "",
      category: "custom",
    },
  });

  const onSubmit = async (values: FormData) => {
    setLoading(true);
    try {
      // Fetch current board settings for the project
      const { data: boardSettings } = await supabase
        .from("board_settings")
        .select("column_id, label, color, wip_limit")
        .eq("project_id", projectId);

      const columnLabels: Record<string, string> = {};
      const columnColors: Record<string, string> = {};
      const wipLimits: Record<string, number> = {};

      (boardSettings || []).forEach((s) => {
        if (s.label) columnLabels[s.column_id] = s.label;
        if (s.color) columnColors[s.column_id] = s.color;
        if (s.wip_limit) wipLimits[s.column_id] = s.wip_limit;
      });

      const config: TemplateConfig = {
        columns: ["todo", "in_progress", "review", "completed"],
        column_labels: columnLabels,
        column_colors: columnColors,
        wip_limits: wipLimits,
        default_categories: [],
        sample_tasks: [],
      };

      await createTemplate.mutateAsync({
        name: values.name,
        description: values.description,
        category: values.category,
        config,
      });

      setOpen(false);
      form.reset();
    } catch {
      // Error handled by mutation
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BookmarkPlus className="mr-2 h-4 w-4" />
          Salvar como Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Salvar como Template</DialogTitle>
          <DialogDescription>
            Salve as configurações deste projeto como template reutilizável.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Template</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl><Textarea className="resize-none" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="development">Desenvolvimento</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="custom">Genérico</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Template"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
