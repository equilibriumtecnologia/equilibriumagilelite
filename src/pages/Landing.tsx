import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  Users,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-dashboard.jpg";
import { PoweredByEquilibrium } from "@/components/layout/PoweredByEquilibrium";

const Landing = () => {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-background">
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
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Entrar
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="hero" size="sm">
                  Começar{" "}
                  <ArrowRight className="ml-1 h-3.5 w-3.5 sm:ml-2 sm:h-4 sm:w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container mx-auto px-3 sm:px-4 relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-hero bg-clip-text text-transparent leading-tight">
                Gerencie Projetos com Simplicidade
              </h1>
              <p className="text-base sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
                Sistema completo de gestão de projetos e atividades para equipes
                e pequenas empresas.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
                <Link to="/signup">
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8"
                  >
                    Criar Conta Grátis{" "}
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8"
                >
                  Ver Demonstração
                </Button>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative mt-8 sm:mt-16 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-border mx-2 sm:mx-0">
              <img
                src={heroImage}
                alt="Agile Lite Equilibrium Dashboard"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-20 bg-gradient-card">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              Tudo que você precisa
            </h2>
            <p className="text-sm sm:text-lg text-muted-foreground">
              Ferramentas poderosas, interface simples
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 max-w-5xl mx-auto">
            <div className="bg-card rounded-xl p-5 sm:p-8 shadow-md hover:shadow-lg transition-all border border-border">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                <LayoutDashboard className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">
                Dashboard Visual
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Acompanhe o progresso com gráficos e métricas em tempo real.
              </p>
            </div>

            <div className="bg-card rounded-xl p-5 sm:p-8 shadow-md hover:shadow-lg transition-all border border-border">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-accent rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">
                Gestão de Equipes
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Permissões personalizadas e colaboração eficiente.
              </p>
            </div>

            <div className="bg-card rounded-xl p-5 sm:p-8 shadow-md hover:shadow-lg transition-all border border-border sm:col-span-2 md:col-span-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">
                Automação Inteligente
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Notificações automáticas e fluxos otimizados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 sm:mb-12 text-center">
              Por que escolher o ALE?
            </h2>
            <div className="space-y-3 sm:space-y-6">
              {[
                "Sistema híbrido e flexível adaptável a diferentes nichos",
                "Gestão completa de projetos, categorias e atividades",
                "Controle granular de permissões por usuário",
                "Histórico completo de alterações e auditoria",
                "Notificações por email automáticas",
                "Interface moderna e responsiva",
              ].map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 sm:gap-4 bg-card p-4 sm:p-6 rounded-lg border border-border"
                >
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-lg">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="container mx-auto px-3 sm:px-4 relative">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6">
              Comece a organizar seus projetos hoje
            </h2>
            <p className="text-base sm:text-xl mb-6 sm:mb-8 opacity-90">
              Crie sua conta gratuitamente
            </p>
            <Link to="/signup">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 text-base sm:text-lg px-6 sm:px-8 shadow-lg hover:shadow-xl transition-all"
              >
                Criar Conta Grátis{" "}
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 sm:py-8 bg-card safe-bottom">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center text-muted-foreground text-xs sm:text-sm">
            <p>
              &copy; {new Date().getFullYear()} Agile Lite Equilibrium. Todos os
              direitos reservados.
            </p>
            <PoweredByEquilibrium
              variant="footer"
              className="justify-center mt-2"
            />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
