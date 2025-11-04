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
import { CategoriesManagement } from "@/components/settings/CategoriesManagement";
import { UsersManagement } from "@/components/settings/UsersManagement";

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
      
      // Buscar role do usuário
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .single();
      
      if (roleData) {
        setUserRole(roleData.role);
      }

      // Buscar perfil do usuário
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user?.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
      }
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
        })
        .eq("id", user?.id);

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

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências e configurações do sistema
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="account">Conta</TabsTrigger>
          {canAccessSystemSettings && (
            <TabsTrigger value="categories">Categorias</TabsTrigger>
          )}
          {userRole === "master" && (
            <TabsTrigger value="users">Usuários</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>
                Atualize suas informações pessoais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatar_url">URL do Avatar</Label>
                <Input
                  id="avatar_url"
                  value={profile.avatar_url || ""}
                  onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                  placeholder="https://..."
                />
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
            <CardHeader>
              <CardTitle>Configurações da Conta</CardTitle>
              <CardDescription>
                Gerencie as configurações da sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={userRole} disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {canAccessSystemSettings && (
          <TabsContent value="categories">
            <CategoriesManagement />
          </TabsContent>
        )}

        {userRole === "master" && (
          <TabsContent value="users">
            <UsersManagement />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
