import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CategoriesManagement } from "@/components/settings/CategoriesManagement";
import { UsersManagement } from "@/components/settings/UsersManagement";
import { PermissionsManagement } from "@/components/settings/PermissionsManagement";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const roleLabels: Record<string, string> = {
  master: "Proprietário",
  admin: "Administrador",
  user: "Membro",
  viewer: "Convidado",
};

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("user");
  const [profile, setProfile] = useState({ full_name: "", avatar_url: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user?.id).single();
      if (roleData) setUserRole(roleData.role);
      const { data: profileData } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", user?.id).single();
      if (profileData) setProfile({ full_name: profileData.full_name || "", avatar_url: profileData.avatar_url || "" });
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const { error } = await supabase.from("profiles").update({ full_name: profile.full_name, avatar_url: profile.avatar_url || null }).eq("id", user?.id);
      if (error) throw error;
      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao atualizar perfil: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const canAccessSystemSettings = userRole === "master" || userRole === "admin";
  const canAccessUsers = userRole === "master" || userRole === "admin";
  const canAccessPermissions = userRole === "master";

  const initials = (() => {
    if (profile.full_name) {
      const parts = profile.full_name.split(" ");
      return ((parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "")).toUpperCase();
    }
    return (user?.email?.[0] || "?").toUpperCase();
  })();

  return (
    <div className="px-3 sm:px-4 md:px-8 py-4 sm:py-6 max-w-4xl mx-auto">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Configurações</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Gerencie suas preferências e configurações
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4 sm:space-y-6">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-auto">
            <TabsTrigger value="profile" className="text-xs sm:text-sm">Perfil</TabsTrigger>
            <TabsTrigger value="account" className="text-xs sm:text-sm">Conta</TabsTrigger>
            {canAccessSystemSettings && (
              <TabsTrigger value="categories" className="text-xs sm:text-sm">Categorias</TabsTrigger>
            )}
            {canAccessUsers && (
              <TabsTrigger value="users" className="text-xs sm:text-sm">Usuários</TabsTrigger>
            )}
            {canAccessPermissions && (
              <TabsTrigger value="permissions" className="text-xs sm:text-sm">Permissões</TabsTrigger>
            )}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="profile">
          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-lg sm:text-xl">Informações do Perfil</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Atualize suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name} />}
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{profile.full_name || "Sem nome"}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input id="full_name" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatar_url">URL do Avatar</Label>
                <Input id="avatar_url" value={profile.avatar_url || ""} onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })} placeholder="https://..." />
              </div>
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-lg sm:text-xl">Configurações da Conta</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Gerencie as configurações da sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={roleLabels[userRole] || userRole} disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {canAccessSystemSettings && (
          <TabsContent value="categories"><CategoriesManagement /></TabsContent>
        )}
        {canAccessUsers && (
          <TabsContent value="users"><UsersManagement currentUserRole={userRole} /></TabsContent>
        )}
        {canAccessPermissions && (
          <TabsContent value="permissions"><PermissionsManagement /></TabsContent>
        )}
      </Tabs>
    </div>
  );
}
