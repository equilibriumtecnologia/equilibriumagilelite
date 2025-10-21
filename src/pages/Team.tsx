import { useState } from "react";
import { useTeam } from "@/hooks/useTeam";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Search, Users, TrendingUp, Briefcase, CheckCircle } from "lucide-react";
import { TeamMemberCard } from "@/components/team/TeamMemberCard";

const Team = () => {
  const { members, loading, refetch } = useTeam();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Filtrar membros
  const filteredMembers = members.filter((member) => {
    const matchesSearch = member.full_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesRole =
      roleFilter === "all" ||
      member.roles.some((r) => r.role === roleFilter);

    return matchesSearch && matchesRole;
  });

  // Estatísticas gerais
  const totalMembers = members.length;
  const totalProjects = members.reduce((sum, m) => sum + m.project_count, 0);
  const totalTasks = members.reduce((sum, m) => sum + m.task_count, 0);
  const totalCompleted = members.reduce((sum, m) => sum + m.completed_task_count, 0);
  const avgCompletionRate = totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12 text-muted-foreground">
          Carregando equipe...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Equipe</h1>
        <p className="text-muted-foreground">
          Gerencie membros da equipe e visualize estatísticas de desempenho
        </p>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalMembers}</p>
              <p className="text-sm text-muted-foreground">Membros</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalProjects}</p>
              <p className="text-sm text-muted-foreground">Projetos Ativos</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCompleted}/{totalTasks}</p>
              <p className="text-sm text-muted-foreground">Tarefas Concluídas</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{Math.round(avgCompletionRate)}%</p>
              <p className="text-sm text-muted-foreground">Taxa Média</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filtrar por role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Roles</SelectItem>
            <SelectItem value="master">Master</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">Usuário</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Membros */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            Todos ({filteredMembers.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Ativos ({filteredMembers.filter((m) => m.task_count > 0).length})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inativos ({filteredMembers.filter((m) => m.task_count === 0).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <TeamMemberCard key={member.id} member={member} onUpdate={refetch} />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                Nenhum membro encontrado
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.filter((m) => m.task_count > 0).length > 0 ? (
              filteredMembers
                .filter((m) => m.task_count > 0)
                .map((member) => (
                  <TeamMemberCard key={member.id} member={member} onUpdate={refetch} />
                ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                Nenhum membro ativo
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="inactive" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.filter((m) => m.task_count === 0).length > 0 ? (
              filteredMembers
                .filter((m) => m.task_count === 0)
                .map((member) => (
                  <TeamMemberCard key={member.id} member={member} onUpdate={refetch} />
                ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                Nenhum membro inativo
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Team;
