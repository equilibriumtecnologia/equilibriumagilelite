import { useState } from "react";
import { useTeam } from "@/hooks/useTeam";
import { Input } from "@/components/ui/input";
import { InviteUserDialog } from "@/components/invitations/InviteUserDialog";
import { useUserRole } from "@/hooks/useUserRole";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const Team = () => {
  const { members, loading, refetch } = useTeam();
  const { canManageInvitations } = useUserRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const filteredMembers = members.filter((member) => {
    const matchesSearch = member.full_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesRole =
      roleFilter === "all" ||
      member.roles.some((r) => r.role === roleFilter);
    return matchesSearch && matchesRole;
  });

  const totalMembers = members.length;
  const totalProjects = members.reduce((sum, m) => sum + m.project_count, 0);
  const totalTasks = members.reduce((sum, m) => sum + m.task_count, 0);
  const totalCompleted = members.reduce((sum, m) => sum + m.completed_task_count, 0);
  const avgCompletionRate = totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0;

  if (loading) {
    return (
      <div className="px-3 sm:px-4 md:px-8 py-4 sm:py-8">
        <div className="text-center py-12 text-muted-foreground">
          Carregando equipe...
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 md:px-8 py-4 sm:py-6 md:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Equipe</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie membros e visualize estatísticas
          </p>
        </div>
        {canManageInvitations && <InviteUserDialog />}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-8">
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold">{totalMembers}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Membros</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold">{totalProjects}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Projetos</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold">{totalCompleted}/{totalTasks}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Concluídas</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-warning/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold">{Math.round(avgCompletionRate)}%</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Taxa Média</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6">
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
          <SelectTrigger className="w-full sm:w-[200px]">
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

      {/* Members List */}
      <Tabs defaultValue="all" className="w-full">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-auto">
            <TabsTrigger value="all" className="text-xs sm:text-sm whitespace-nowrap">
              Todos ({filteredMembers.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="text-xs sm:text-sm whitespace-nowrap">
              Ativos ({filteredMembers.filter((m) => m.task_count > 0).length})
            </TabsTrigger>
            <TabsTrigger value="inactive" className="text-xs sm:text-sm whitespace-nowrap">
              Inativos ({filteredMembers.filter((m) => m.task_count === 0).length})
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="all" className="mt-4 sm:mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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

        <TabsContent value="active" className="mt-4 sm:mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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

        <TabsContent value="inactive" className="mt-4 sm:mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
