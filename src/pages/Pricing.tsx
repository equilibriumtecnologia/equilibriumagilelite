import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, ArrowLeft, Crown, Zap, Rocket, Building2, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import { PoweredByEquilibrium } from "@/components/layout/PoweredByEquilibrium";

const plans = [
  {
    name: "Free",
    slug: "free",
    price: "R$ 0",
    period: "para sempre",
    description: "Para uso pessoal e experimentação",
    icon: Zap,
    popular: false,
    features: [
      "1 workspace padrão",
      "Participar de 1 workspace como convidado",
      "1 projeto por workspace",
      "Sem convites",
      "Suporte comunidade",
    ],
    limits: {
      workspaces: "1 padrão + 1 convidado",
      projects: "1 por workspace",
      invites: "0",
    },
    cta: "Começar Grátis",
    ctaVariant: "outline" as const,
    ctaLink: "/signup",
  },
  {
    name: "Starter",
    slug: "starter",
    price: "R$ 29",
    period: "/mês",
    description: "Para profissionais e pequenas equipes",
    icon: Rocket,
    popular: true,
    features: [
      "1 workspace padrão + 1 criado",
      "Participar de 1 workspace como convidado",
      "2 projetos por workspace",
      "1 convite por workspace",
      "Suporte por email",
    ],
    limits: {
      workspaces: "Até 3 simultâneos",
      projects: "2 por workspace",
      invites: "1 por workspace",
    },
    cta: "Assinar Starter",
    ctaVariant: "default" as const,
    ctaLink: "#upgrade-starter",
  },
  {
    name: "Professional",
    slug: "professional",
    price: "R$ 79",
    period: "/mês",
    description: "Para equipes em crescimento",
    icon: Crown,
    popular: false,
    features: [
      "1 workspace padrão + 2 criados",
      "Participar de 2 workspaces como convidado",
      "5 projetos por workspace",
      "5 convites por workspace",
      "Relatórios avançados",
      "Suporte prioritário",
    ],
    limits: {
      workspaces: "Até 5 simultâneos",
      projects: "5 por workspace",
      invites: "5 por workspace",
    },
    cta: "Assinar Professional",
    ctaVariant: "default" as const,
    ctaLink: "#upgrade-professional",
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    price: "Sob consulta",
    period: "",
    description: "Para grandes organizações com necessidades customizadas",
    icon: Building2,
    popular: false,
    features: [
      "Workspaces ilimitados",
      "Projetos ilimitados",
      "Convites ilimitados",
      "SSO / SAML",
      "Permissões customizadas",
      "Suporte dedicado",
      "SLA personalizado",
    ],
    limits: {
      workspaces: "Ilimitados",
      projects: "Ilimitados",
      invites: "Ilimitados",
    },
    cta: "Fale Conosco",
    ctaVariant: "outline" as const,
    ctaLink: "mailto:contato@agilelite.equilibriumtecnologia.com.br",
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <span className="text-base sm:text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                ALE
              </span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
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

      {/* Header */}
      <section className="py-12 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container mx-auto px-3 sm:px-4 relative">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
              Planos para cada etapa
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Comece gratuitamente e escale conforme sua equipe cresce. Todos os planos incluem as funcionalidades essenciais.
            </p>
          </div>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="pb-16 sm:pb-24">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.slug}
                className={`relative flex flex-col transition-all hover:shadow-lg ${
                  plan.popular
                    ? "border-primary shadow-md ring-1 ring-primary/20"
                    : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-0.5 text-xs font-semibold">
                      Mais Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      plan.popular ? "bg-primary" : "bg-muted"
                    }`}>
                      <plan.icon className={`h-5 w-5 ${
                        plan.popular ? "text-primary-foreground" : "text-muted-foreground"
                      }`} />
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    )}
                  </div>
                  <CardDescription className="text-sm mt-1">{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <ul className="space-y-2.5">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-4">
                  {plan.ctaLink.startsWith("mailto:") ? (
                    <a href={plan.ctaLink} className="w-full">
                      <Button
                        variant={plan.ctaVariant}
                        className={`w-full ${plan.popular ? "bg-primary hover:bg-primary/90" : ""}`}
                      >
                        {plan.cta}
                      </Button>
                    </a>
                  ) : plan.ctaLink.startsWith("#") ? (
                    <Button
                      variant={plan.ctaVariant}
                      className={`w-full ${plan.popular ? "bg-primary hover:bg-primary/90 text-primary-foreground" : ""}`}
                      onClick={() => {
                        // TODO: Integrate with Stripe checkout
                        window.location.href = "/signup";
                      }}
                    >
                      {plan.cta}
                    </Button>
                  ) : (
                    <Link to={plan.ctaLink} className="w-full">
                      <Button variant={plan.ctaVariant} className="w-full">
                        {plan.cta}
                      </Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Annual discount note */}
          <div className="text-center mt-8 sm:mt-12">
            <p className="text-sm text-muted-foreground">
              Planos anuais com <strong className="text-foreground">10% de desconto</strong>. Disponível em breve.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ / CTA */}
      <section className="py-12 sm:py-16 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="container mx-auto px-3 sm:px-4 relative">
          <div className="max-w-2xl mx-auto text-center text-white">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Dúvidas? Estamos aqui para ajudar
            </h2>
            <p className="text-base sm:text-lg mb-6 opacity-90">
              Entre em contato para planos Enterprise ou dúvidas sobre funcionalidades.
            </p>
            <a href="mailto:contato@agilelite.equilibriumtecnologia.com.br">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 shadow-lg"
              >
                Fale Conosco <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 sm:py-8 bg-card">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors flex items-center gap-1">
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar ao início
              </Link>
            </div>
            <div className="text-center text-muted-foreground text-xs sm:text-sm">
              <p>&copy; {new Date().getFullYear()} Agile Lite Equilibrium.</p>
              <PoweredByEquilibrium variant="footer" showTextFallback={false} className="justify-center mt-1" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
