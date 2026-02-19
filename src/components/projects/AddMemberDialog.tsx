import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AddMemberDialogProps {
  projectId: string;
  currentMembers: string[];
  onSuccess?: () => void;
}

export function AddMemberDialog({
  projectId,
  currentMembers,
  onSuccess,
}: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name");

    if (error) {
      toast.error("Erro ao carregar usuários");
      return;
    }

    // Filtrar usuários que já são membros
    const availableUsers = data.filter((u) => !currentMembers.includes(u.id));
    setUsers(availableUsers);
  };

  const handleAddMember = async () => {
    if (!selectedUserId) {
      toast.error("Selecione um usuário");
      return;
    }

    setLoading(true);

    try {
      // Check if user is already a member to avoid duplicate key error
      const { data: existing } = await supabase
        .from("project_members")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", selectedUserId)
        .maybeSingle();

      if (existing) {
        toast.error("Este usuário já é membro do projeto");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("project_members").insert({
        project_id: projectId,
        user_id: selectedUserId,
        role: "member",
      });

      if (error) throw error;

      toast.success("Membro adicionado com sucesso!");
      setOpen(false);
      setSelectedUserId("");
      onSuccess?.();
    } catch (error: any) {
      toast.error("Erro ao adicionar membro: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Adicionar Membro
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Membro ao Projeto</DialogTitle>
          <DialogDescription>
            Selecione um usuário para adicionar ao projeto
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um usuário" />
            </SelectTrigger>
            <SelectContent>
              {users.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">
                  Todos os usuários já são membros
                </div>
              ) : (
                users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddMember} disabled={loading || !selectedUserId}>
              {loading ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
