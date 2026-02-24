import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  Users,
  Zap,
  FolderKanban,
  Shield,
  BarChart3,
} from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-dashboard.jpg";
import { PoweredByEquilibrium } from "@/components/layout/PoweredByEquilibrium";

const features = [
  {
    icon: LayoutDashboard,
    title: "Dashboard Visual",
    description: "Métricas e gráficos em tempo real para acompanhar o progresso dos seus projetos.",
    gradient: "bg-gradient-primary",
  },
  {
    icon: FolderKanban,
    title: "Kanban & Sprints",
    description: "Quadros Kanban, sprints e backlog para metodologias ágeis integradas.",
    gradient: "bg-gradient-accent",
  },
  {
    icon: Users,
    title: "Gestão de Equipes",
    description: "Permissões granulares, workspaces e papéis para colaboração segura.",
    gradient: "bg-success",
  },
  {
    icon: Shield,
    title: "Segurança & Auditoria",
    description: "Histórico completo de alterações e controle de acesso por nível.",
    gradient: "bg-primary",
  },
  {
    icon: Zap,
    title: "Notificações Inteligentes",
    description: "Alertas automáticos por email e no app para prazos e atualizações.",
    gradient: "bg-warning",
  },
  {
    icon: BarChart3,
    title: "Relatórios Avançados",
    description: "Burndown, velocidade, cycle time e performance da equipe.",
    gradient: "bg-destructive",
  },
];

const planPreview = [
  { name: "Free", price: "R$ 0", highlight: "1 projeto, uso pessoal" },
  { name: "Starter", price: "R$ 29/mês", highlight: "2 projetos, 1 convite" },
  { name: "Professional", price: "R$ 79/mês", highlight: "5 projetos, 5 convites" },
  { name: "Enterprise", price: "Sob consulta", highlight: "Limites customizados" },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50 safe-top">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <span className="text-base sm:text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                ALE
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link to="/pricing">
                <Button variant="ghost" size="sm">Planos</Button>
              </Link>
              <Link to="/login">
                <Button variant="ghost" size="sm">Entrar</Button>
              </Link>
              <Link to="/signup">
                <Button variant="hero" size="sm">
                  Começar <ArrowRight className="ml-1 h-3.5 w-3.5 sm:ml-2 sm:h-4 sm:w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-20 md:py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/2 to-transparent" />
        <div className="container mx-auto px-3 sm:px-4 relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <Badge variant="secondary" className="mb-4 text-xs sm:text-sm px-3 py-1">
                ✨ Gestão ágil simplificada
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-hero bg-clip-text text-transparent leading-tight">
                Gerencie Projetos com
                <br className="hidden sm:block" /> Simplicidade e Controle
              </h1>
              <p className="text-base sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
                Plataforma completa de gestão ágil com workspaces, Kanban, sprints, permissões granulares e relatórios — tudo em um só lugar.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
                <Link to="/signup">
                  <Button variant="hero" size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8">
                    Criar Conta Grátis <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8">
                    Ver Planos
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative mt-8 sm:mt-16 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-border mx-2 sm:mx-0">
              <img src={heroImage} alt="Agile Lite Equilibrium Dashboard" className="w-full h-auto" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 sm:py-20 bg-gradient-card">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-8 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              Tudo que sua equipe precisa
            </h2>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-xl mx-auto">
              Ferramentas poderosas com interface simples e intuitiva
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-card rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all border border-border group"
              >
                <div className={`w-10 h-10 ${feature.gradient} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-1.5">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 sm:mb-12 text-center">
              Por que escolher o ALE?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {[
                "Sistema híbrido e flexível para diferentes nichos",
                "Gestão completa de projetos e atividades",
                "Controle granular de permissões por usuário",
                "Histórico completo de alterações e auditoria",
                "Notificações automáticas por email",
                "Interface moderna e responsiva",
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 bg-card p-4 rounded-lg border border-border">
                  <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-12 sm:py-20 bg-muted/30">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
              Planos que crescem com você
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Comece grátis, escale quando precisar
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
            {planPreview.map((plan, i) => (
              <div
                key={i}
                className={`bg-card rounded-xl p-4 sm:p-5 border text-center transition-all hover:shadow-md ${
                  plan.name === "Starter" ? "border-primary ring-1 ring-primary/20" : "border-border"
                }`}
              >
                <p className="font-semibold text-sm sm:text-base mb-1">{plan.name}</p>
                <p className="text-lg sm:text-2xl font-bold text-primary mb-1">{plan.price}</p>
                <p className="text-xs text-muted-foreground">{plan.highlight}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-6 sm:mt-8">
            <Link to="/pricing">
              <Button variant="outline" size="lg">
                Ver todos os detalhes <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-20 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="container mx-auto px-3 sm:px-4 relative">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6">
              Comece a organizar seus projetos hoje
            </h2>
            <p className="text-base sm:text-xl mb-6 sm:mb-8 opacity-90">
              Crie sua conta gratuitamente e experimente todas as funcionalidades
            </p>
            <Link to="/signup">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 text-base sm:text-lg px-6 sm:px-8 shadow-lg hover:shadow-xl transition-all"
              >
                Criar Conta Grátis <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 sm:py-8 bg-card safe-bottom">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link to="/pricing" className="hover:text-foreground transition-colors">Planos</Link>
              <a href="mailto:contato@agilelite.equilibriumtecnologia.com.br" className="hover:text-foreground transition-colors">Contato</a>
            </div>
            <div className="text-center text-muted-foreground text-xs sm:text-sm">
              <p>&copy; {new Date().getFullYear()} Agile Lite Equilibrium. Todos os direitos reservados.</p>
              <PoweredByEquilibrium variant="footer" showTextFallback={false} className="justify-center mt-2" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
