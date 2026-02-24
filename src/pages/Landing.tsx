import { useScrollFadeIn } from "@/hooks/useScrollFadeIn";
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
  Layers,
  Target,
  Bell,
  Settings,
} from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-dashboard.jpg";
import { PoweredByEquilibrium } from "@/components/layout/PoweredByEquilibrium";

const features = [
  {
    icon: LayoutDashboard,
    title: "Dashboard Inteligente",
    description: "Métricas em tempo real com cards de status, projetos recentes, tarefas próximas e relatórios visuais.",
  },
  {
    icon: FolderKanban,
    title: "Kanban Interativo",
    description: "Quadro drag-and-drop com colunas customizáveis, limites WIP e filtros avançados.",
  },
  {
    icon: Target,
    title: "Sprints & Backlog",
    description: "Planejamento de sprints com story points, backlog priorizado e metas definidas.",
  },
  {
    icon: Users,
    title: "Workspaces & Equipes",
    description: "Multi-workspace com papéis granulares: owner, admin, member e viewer.",
  },
  {
    icon: Shield,
    title: "Permissões & Auditoria",
    description: "Controle de acesso por recurso, histórico completo de alterações em cada tarefa.",
  },
  {
    icon: BarChart3,
    title: "Relatórios Avançados",
    description: "Burndown, velocity, cycle time, CFD e performance da equipe em tempo real.",
  },
  {
    icon: Bell,
    title: "Notificações Inteligentes",
    description: "Alertas in-app e por email para prazos, atribuições e atualizações de tarefas.",
  },
  {
    icon: Settings,
    title: "Categorias & Configurações",
    description: "Categorias por workspace, configurações de board e personalização do fluxo.",
  },
];

const planPreview = [
  { name: "Free", price: "R$ 0", highlight: "1 projeto · uso pessoal", popular: false },
  { name: "Starter", price: "R$ 29", period: "/mês", highlight: "2 projetos · 1 convite", popular: true },
  { name: "Professional", price: "R$ 79", period: "/mês", highlight: "5 projetos · 5 convites", popular: false },
  { name: "Enterprise", price: "Sob consulta", highlight: "Limites customizados", popular: false },
];

const stats = [
  { value: "100%", label: "Open Source Ready" },
  { value: "4+", label: "Tipos de Relatório" },
  { value: "∞", label: "Tarefas por Projeto" },
  { value: "4", label: "Níveis de Permissão" },
];

const FadeSection = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const { ref, isVisible } = useScrollFadeIn(0.12);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s cubic-bezier(0.4,0,0.2,1) ${delay}s, transform 0.7s cubic-bezier(0.4,0,0.2,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
};

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 safe-top">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <span className="text-base sm:text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Agile Lite
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to="/pricing">
                <Button variant="ghost" size="sm">Planos</Button>
              </Link>
              <Link to="/login">
                <Button variant="ghost" size="sm">Entrar</Button>
              </Link>
              <Link to="/signup">
                <Button variant="hero" size="sm">
                  Começar <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <FadeSection>
      <section className="relative overflow-hidden py-16 sm:py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-6xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 text-xs sm:text-sm px-4 py-1.5 border border-primary/20">
              ✨ Plataforma completa de gestão ágil
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent leading-tight tracking-tight">
              Gerencie Projetos
              <br className="hidden sm:block" /> com Agilidade
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Kanban, sprints, backlog, workspaces e relatórios avançados.
              Tudo que sua equipe precisa em uma única plataforma.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button variant="hero" size="lg" className="w-full sm:w-auto text-lg px-8 h-12">
                  Criar Conta Grátis <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 h-12">
                  Ver Planos
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative mt-16 sm:mt-20 max-w-5xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur-xl opacity-60" />
            <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-border">
              <img src={heroImage} alt="Agile Lite Equilibrium - Dashboard com Kanban, Sprints e Relatórios" className="w-full h-auto" />
            </div>
          </div>
        </div>
      </section>
      </FadeSection>

      {/* Stats Bar */}
      <FadeSection>
      <section className="py-8 sm:py-12 border-y border-border bg-card/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      </FadeSection>

      {/* Features Grid */}
      <FadeSection>
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <Badge variant="secondary" className="mb-4 text-xs px-3 py-1">Funcionalidades</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Tudo que sua equipe precisa
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Ferramentas integradas para gestão ágil completa, do planejamento à entrega
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {features.map((feature, i) => {
              const { ref, isVisible } = useScrollFadeIn(0.1);
              return (
                <div
                  key={i}
                  ref={ref}
                  className="group bg-card rounded-xl p-5 sm:p-6 border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateY(0)" : "translateY(24px)",
                    transition: `opacity 0.5s cubic-bezier(0.4,0,0.2,1) ${i * 0.1}s, transform 0.5s cubic-bezier(0.4,0,0.2,1) ${i * 0.1}s`,
                  }}
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      </FadeSection>

      {/* How it works */}
      <FadeSection>
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 text-xs px-3 py-1">Como funciona</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simples de começar</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Crie seu Workspace", desc: "Configure seu espaço de trabalho e convide sua equipe em segundos." },
              { step: "02", title: "Organize Projetos", desc: "Crie projetos, defina sprints e popule o backlog com suas tarefas." },
              { step: "03", title: "Acompanhe Resultados", desc: "Use o Kanban, relatórios e métricas para acompanhar o progresso." },
            ].map((item, i) => (
              <div key={i} className="text-center p-6">
                <span className="inline-block text-4xl font-bold text-primary/20 mb-3">{item.step}</span>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      </FadeSection>

      {/* Benefits */}
      <FadeSection>
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4 text-xs px-3 py-1">Diferenciais</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Por que escolher o ALE?</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {[
                "Sistema híbrido Kanban + Scrum para qualquer equipe",
                "Gestão completa com sub-tarefas e story points",
                "Controle granular de permissões por workspace",
                "Histórico completo de alterações e auditoria",
                "Notificações automáticas por email e in-app",
                "Interface moderna, responsiva e tema escuro",
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
      </FadeSection>

      {/* Pricing Preview */}
      <FadeSection>
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 text-xs px-3 py-1">Planos</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Planos que crescem com você</h2>
            <p className="text-muted-foreground">Comece grátis, escale quando precisar</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
            {planPreview.map((plan, i) => (
              <div
                key={i}
                className={`bg-card rounded-xl p-5 border text-center transition-all hover:shadow-md relative ${
                  plan.popular ? "border-primary ring-2 ring-primary/20" : "border-border"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-medium px-2.5 py-0.5 rounded-full">
                    Popular
                  </span>
                )}
                <p className="font-semibold text-sm sm:text-base mb-1">{plan.name}</p>
                <p className="text-xl sm:text-2xl font-bold text-primary mb-0.5">
                  {plan.price}
                  {plan.period && <span className="text-xs text-muted-foreground font-normal">{plan.period}</span>}
                </p>
                <p className="text-xs text-muted-foreground">{plan.highlight}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/pricing">
              <Button variant="outline" size="lg">
                Ver todos os detalhes <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      </FadeSection>

      {/* CTA */}
      <FadeSection>
      <section className="py-16 sm:py-24 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.3)_100%)]" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              Comece a organizar seus projetos hoje
            </h2>
            <p className="text-lg sm:text-xl mb-8 opacity-90">
              Crie sua conta gratuitamente e experimente todas as funcionalidades
            </p>
            <Link to="/signup">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 text-lg px-8 h-12 shadow-lg hover:shadow-xl transition-all"
              >
                Criar Conta Grátis <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      </FadeSection>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card safe-bottom">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link to="/pricing" className="hover:text-foreground transition-colors">
                Planos
              </Link>
              <a
                href="mailto:contato@agilelite.equilibriumtecnologia.com.br"
                className="hover:text-foreground transition-colors"
              >
                Contato
              </a>
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
