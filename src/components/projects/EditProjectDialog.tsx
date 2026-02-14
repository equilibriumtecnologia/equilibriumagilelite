import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useProjects } from "@/hooks/useProjects";
import { useCategories } from "@/hooks/useCategories";
import type { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  criticality_level?: number | null;
};

const formSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  category_id: z.string().optional(),
  status: z.enum(["planning", "active", "on_hold", "completed", "cancelled"]),
  deadline: z.string().optional(),
  criticality_level: z.coerce.number().min(1).max(5).default(3),
});

interface EditProjectDialogProps {
  project: Project;
  onSuccess?: () => void;
}

export function EditProjectDialog({ project, onSuccess }: EditProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const { updateProject } = useProjects();
  const { categories } = useCategories();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: project.name,
      description: project.description || "",
      category_id: project.category_id || "",
      status: project.status,
      deadline: project.deadline || "",
      criticality_level: project.criticality_level ?? 3,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await updateProject.mutateAsync({
      id: project.id,
      name: values.name,
      description: values.description || null,
      category_id: values.category_id || null,
      status: values.status,
      deadline: values.deadline || null,
      criticality_level: values.criticality_level,
    });
    setOpen(false);
    onSuccess?.();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Editar Projeto</DialogTitle>
          <DialogDescription>Atualize as informações do projeto</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nome do Projeto</FormLabel><FormControl><Input placeholder="Digite o nome do projeto" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea placeholder="Descreva o projeto..." className="resize-none" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="category_id" render={({ field }) => (
              <FormItem><FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger></FormControl>
                  <SelectContent>{categories?.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
                </Select><FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem><FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="planning">Planejamento</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="on_hold">Em Espera</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select><FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="deadline" render={({ field }) => (
              <FormItem><FormLabel>Prazo</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="criticality_level" render={({ field }) => (
              <FormItem><FormLabel>Nível de Criticidade</FormLabel>
                <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione o nível" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="1">1 - Muito Baixa</SelectItem>
                    <SelectItem value="2">2 - Baixa</SelectItem>
                    <SelectItem value="3">3 - Média</SelectItem>
                    <SelectItem value="4">4 - Alta</SelectItem>
                    <SelectItem value="5">5 - Crítica</SelectItem>
                  </SelectContent>
                </Select><FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="submit" disabled={updateProject.isPending}>
                {updateProject.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
