import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useUserPlan } from "@/hooks/useUserPlan";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(50),
  description: z.string().max(200).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateWorkspaceDialogProps {
  trigger?: React.ReactNode;
}

export function CreateWorkspaceDialog({ trigger }: CreateWorkspaceDialogProps) {
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const { user } = useAuth();
  const { refetch, switchWorkspace } = useWorkspace();
  const { checkCanCreateWorkspace, plan, isMaster } = useUserPlan();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", description: "" },
  });

  const handleOpenChange = async (newOpen: boolean) => {
    if (newOpen && !isMaster) {
      setChecking(true);
      const canCreate = await checkCanCreateWorkspace();
      setChecking(false);
      if (!canCreate) {
        toast.error(
          "Limite de workspaces atingido no seu plano. Faça upgrade para criar mais workspaces."
        );
        return;
      }
    }
    setOpen(newOpen);
  };

  const onSubmit = async (values: FormData) => {
    if (!user) return;

    try {
      const slug = "ws-" + Date.now().toString(36);

      const { data, error } = await supabase.rpc("create_workspace", {
        _name: values.name.trim(),
        _description: values.description?.trim() || null,
        _slug: slug,
      });

      if (error) throw error;

      const workspaceId = data as unknown as string;

      toast.success("Workspace criado com sucesso!");
      await refetch();
      switchWorkspace(workspaceId);
      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast.error("Erro ao criar workspace: " + error.message);
    }
  };

  const canCreate = isMaster || (plan && plan.max_created_workspaces > 0);

  if (!canCreate) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" disabled={checking}>
            {checking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span>Novo Workspace</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Workspace</DialogTitle>
          <DialogDescription>
            Crie um workspace para organizar seus projetos e equipe
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Workspace</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Minha Empresa" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Nome que identifica o workspace
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o propósito do workspace..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Criando..." : "Criar Workspace"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
