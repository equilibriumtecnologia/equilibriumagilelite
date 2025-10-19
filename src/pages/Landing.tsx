import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, LayoutDashboard, Users, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-dashboard.jpg";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Agile Lite Equilibrium
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost">Entrar</Button>
              </Link>
              <Link to="/signup">
                <Button variant="hero">
                  Começar Grátis <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
                Gerencie Projetos com Simplicidade e Eficiência
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Sistema completo de gestão de projetos e atividades para equipes e pequenas empresas.
                Organize, colabore e conquiste resultados.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup">
                  <Button variant="hero" size="lg" className="text-lg px-8">
                    Criar Conta Grátis <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="text-lg px-8">
                  Ver Demonstração
                </Button>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative mt-16 rounded-2xl overflow-hidden shadow-2xl border border-border">
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
      <section className="py-20 bg-gradient-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que você precisa para gerenciar projetos
            </h2>
            <p className="text-lg text-muted-foreground">
              Ferramentas poderosas, interface simples
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-card rounded-xl p-8 shadow-md hover:shadow-lg transition-all border border-border">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                <LayoutDashboard className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Dashboard Visual</h3>
              <p className="text-muted-foreground">
                Acompanhe o progresso com gráficos e métricas em tempo real. Visualize tudo de forma clara.
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-md hover:shadow-lg transition-all border border-border">
              <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Gestão de Equipes</h3>
              <p className="text-muted-foreground">
                Permissões personalizadas, atribuição de tarefas e colaboração eficiente entre membros.
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-md hover:shadow-lg transition-all border border-border">
              <div className="w-12 h-12 bg-success rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Automação Inteligente</h3>
              <p className="text-muted-foreground">
                Notificações automáticas, lembretes de prazos e fluxos de trabalho otimizados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
              Por que escolher o Agile Lite Equilibrium?
            </h2>
            <div className="space-y-6">
              {[
                "Sistema híbrido e flexível adaptável a diferentes nichos",
                "Gestão completa de projetos, categorias e atividades",
                "Controle granular de permissões por usuário",
                "Histórico completo de alterações e auditoria",
                "Notificações por email automáticas",
                "Interface moderna e responsiva",
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-4 bg-card p-6 rounded-lg border border-border">
                  <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0 mt-1" />
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Comece a organizar seus projetos hoje
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Crie sua conta gratuitamente e descubra como é fácil gerenciar projetos
            </p>
            <Link to="/signup">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 text-lg px-8 shadow-lg hover:shadow-xl transition-all"
              >
                Criar Conta Grátis <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2025 Agile Lite Equilibrium. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
