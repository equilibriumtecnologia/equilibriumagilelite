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
import { Plus, ArrowLeft, ArrowRight } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useProjects } from "@/hooks/useProjects";
import { useCategories } from "@/hooks/useCategories";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPlan } from "@/hooks/useUserPlan";
import { toast } from "sonner";
import { TemplateSelector } from "./TemplateSelector";
import type { ProjectTemplate } from "@/hooks/useProjectTemplates";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(100),
  description: z.string().max(500).optional(),
  category_id: z.string().uuid("Selecione uma categoria").optional().or(z.literal("")),
  status: z.enum(["planning", "active", "on_hold", "completed", "cancelled"]),
  deadline: z.string().optional(),
  criticality_level: z.coerce.number().min(1).max(5).default(3),
});

type FormData = z.infer<typeof formSchema>;

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"template" | "form">("template");
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { createProject } = useProjects();
  const { categories } = useCategories();
  const { checkProjectLimit } = useUserPlan();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "planning",
      deadline: "",
      criticality_level: 3,
    },
  });

  const handleTemplateSelect = (template: ProjectTemplate | null) => {
    setSelectedTemplate(template);
  };

  const handleNextStep = () => {
    setStep("form");
  };

  const applyTemplateConfig = async (projectId: string, template: ProjectTemplate) => {
    const config = template.config;

    // Apply board settings (labels, colors, WIP limits)
    const boardSettingsToInsert = config.columns.map((colId) => ({
      project_id: projectId,
      column_id: colId,
      label: config.column_labels?.[colId] || null,
      color: config.column_colors?.[colId] || null,
      wip_limit: config.wip_limits?.[colId] || null,
    }));

    if (boardSettingsToInsert.length > 0) {
      await supabase.from("board_settings").insert(boardSettingsToInsert);
    }

    // Create sample tasks
    if (config.sample_tasks?.length > 0 && user) {
      const tasksToInsert = config.sample_tasks.map((t, idx) => ({
        project_id: projectId,
        title: t.title,
        priority: (t.priority || "medium") as any,
        status: (t.status || "todo") as any,
        created_by: user.id,
        backlog_order: idx,
      }));

      await supabase.from("tasks").insert(tasksToInsert);
    }
  };

  const onSubmit = async (values: FormData) => {
    if (!user || !currentWorkspace) return;

    const canCreate = await checkProjectLimit(currentWorkspace.id);
    if (!canCreate) {
      toast.error("Limite de projetos atingido para este workspace. Faça upgrade do seu plano para criar mais projetos.");
      return;
    }

    // Create the project
    const { data: newProject, error } = await supabase
      .from("projects")
      .insert({
        name: values.name,
        description: values.description || null,
        category_id: values.category_id || null,
        status: values.status as any,
        deadline: values.deadline || null,
        criticality_level: values.criticality_level,
        created_by: user.id,
        workspace_id: currentWorkspace.id,
      })
      .select("id")
      .single();

    if (error) {
      toast.error("Erro ao criar projeto: " + error.message);
      return;
    }

    // Apply template if selected
    if (selectedTemplate && newProject) {
      try {
        await applyTemplateConfig(newProject.id, selectedTemplate);
      } catch (e) {
        console.error("Erro ao aplicar template:", e);
        // Project was created, just log the template error
      }
    }

    toast.success("Projeto criado com sucesso!");

    // Invalidate queries
    const { queryClient } = await import("@tanstack/react-query").then(() => {
      // We need to invalidate from the hook instead
      return { queryClient: null };
    });

    setOpen(false);
    setStep("template");
    setSelectedTemplate(null);
    form.reset();

    // Force refetch via window event
    window.dispatchEvent(new CustomEvent("project-created"));
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setStep("template");
      setSelectedTemplate(null);
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Projeto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        {step === "template" ? (
          <>
            <DialogHeader>
              <DialogTitle>Escolha um Template</DialogTitle>
              <DialogDescription>Selecione um template para começar ou crie um projeto do zero.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[400px] overflow-y-auto pr-1">
              <TemplateSelector
                selectedId={selectedTemplate?.id ?? null}
                onSelect={handleTemplateSelect}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleNextStep}>
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Criar Novo Projeto</DialogTitle>
              <DialogDescription>
                {selectedTemplate
                  ? `Usando template: ${selectedTemplate.name}`
                  : "Projeto em branco"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Projeto</FormLabel>
                    <FormControl><Input placeholder="Digite o nome" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl><Textarea placeholder="Descreva o projeto" className="resize-none" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="category_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="planning">Planejamento</SelectItem>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="on_hold">Em Espera</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="deadline" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo (Opcional)</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="criticality_level" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível de Criticidade</FormLabel>
                    <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione o nível" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 - Muito Baixa</SelectItem>
                        <SelectItem value="2">2 - Baixa</SelectItem>
                        <SelectItem value="3">3 - Média</SelectItem>
                        <SelectItem value="4">4 - Alta</SelectItem>
                        <SelectItem value="5">5 - Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="flex justify-between">
                  <Button type="button" variant="ghost" onClick={() => setStep("template")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancelar</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? "Criando..." : "Criar Projeto"}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
