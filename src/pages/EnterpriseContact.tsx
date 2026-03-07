import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, ArrowLeft, Send, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  company: z.string().trim().min(2, "Empresa deve ter pelo menos 2 caracteres").max(100),
  phone: z.string().trim().max(30).optional(),
  teamSize: z.string().min(1, "Selecione o tamanho da equipe"),
  message: z.string().trim().min(10, "Descreva suas necessidades com pelo menos 10 caracteres").max(2000),
});

export default function EnterpriseContact() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    teamSize: "",
    message: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-enterprise-contact", {
        body: result.data,
      });
      if (error) throw error;
      navigate("/obrigado");
    } catch {
      toast.error("Erro ao enviar formulário. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* noindex meta tag */}
      <meta name="robots" content="noindex, nofollow" />

      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <Link to="/pricing" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Voltar aos planos
          </Link>
        </div>
      </nav>

      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Plano Enterprise</h1>
              <p className="text-muted-foreground">
                Preencha o formulário abaixo e nossa equipe entrará em contato com uma proposta personalizada.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações de contato</CardTitle>
                <CardDescription>Todos os campos com * são obrigatórios</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo *</Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={e => handleChange("name", e.target.value)}
                        placeholder="Seu nome"
                        maxLength={100}
                      />
                      {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email corporativo *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={e => handleChange("email", e.target.value)}
                        placeholder="seu@empresa.com"
                        maxLength={255}
                      />
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Empresa *</Label>
                      <Input
                        id="company"
                        value={form.company}
                        onChange={e => handleChange("company", e.target.value)}
                        placeholder="Nome da empresa"
                        maxLength={100}
                      />
                      {errors.company && <p className="text-sm text-destructive">{errors.company}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={form.phone}
                        onChange={e => handleChange("phone", e.target.value)}
                        placeholder="(11) 99999-9999"
                        maxLength={30}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teamSize">Tamanho da equipe *</Label>
                    <Select value={form.teamSize} onValueChange={v => handleChange("teamSize", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1 a 10 pessoas</SelectItem>
                        <SelectItem value="11-25">11 a 25 pessoas</SelectItem>
                        <SelectItem value="26-50">26 a 50 pessoas</SelectItem>
                        <SelectItem value="51-100">51 a 100 pessoas</SelectItem>
                        <SelectItem value="100+">Mais de 100 pessoas</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.teamSize && <p className="text-sm text-destructive">{errors.teamSize}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Descreva suas necessidades *</Label>
                    <Textarea
                      id="message"
                      value={form.message}
                      onChange={e => handleChange("message", e.target.value)}
                      placeholder="Conte-nos sobre o tamanho da equipe, funcionalidades desejadas, integrações necessárias, requisitos de segurança, SLA esperado, etc."
                      rows={5}
                      maxLength={2000}
                    />
                    <p className="text-xs text-muted-foreground text-right">{form.message.length}/2000</p>
                    {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Enviar solicitação
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
