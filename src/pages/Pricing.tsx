import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, ArrowRight, ArrowLeft, Crown, Zap, Rocket, Building2, LayoutDashboard, Star, Bot, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { PoweredByEquilibrium } from "@/components/layout/PoweredByEquilibrium";
import { useStripePrices, StripePlan } from "@/hooks/useStripePrices";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPlan } from "@/hooks/useUserPlan";

const planMeta: Record<string, {
  icon: any;
  description: string;
  features: string[];
  popular?: boolean;
  hasAI?: boolean;
}> = {
  starter: {
    icon: Rocket,
    description: "Para profissionais individuais",
    features: [
      "1 workspace padrão + 1 criado",
      "Participar de 1 workspace como convidado",
      "2 projetos por workspace",
      "2 convites por workspace",
      "Até 3 usuários por workspace",
      "Suporte por email",
    ],
  },
  standard: {
    icon: Star,
    description: "Para pequenas equipes em crescimento",
    popular: true,
    hasAI: true,
    features: [
      "1 workspace padrão + 2 criados",
      "Participar de 2 workspaces como convidado",
      "3 projetos por workspace",
      "3 convites por workspace",
      "Até 5 usuários por workspace",
      "🤖 Priorização com IA",
      "Relatórios avançados",
      "Suporte por email",
    ],
  },
  pro: {
    icon: Crown,
    description: "Para equipes grandes e avançadas",
    hasAI: true,
    features: [
      "1 workspace padrão + 4 criados",
      "Participar de 4 workspaces como convidado",
      "5 projetos por workspace",
      "5 convites por workspace",
      "Até 10 usuários por workspace",
      "🤖 Priorização com IA",
      "Relatórios avançados",
      "Suporte prioritário",
    ],
  },
  enterprise_10: {
    icon: Building2,
    description: "Para organizações com até 10 usuários",
    hasAI: true,
    features: [
      "5 workspaces criados",
      "Participar de 5 workspaces como convidado",
      "10 projetos por workspace",
      "10 convites por workspace",
      "Até 10 usuários por workspace",
      "🤖 Priorização com IA",
      "Relatórios avançados",
      "Suporte prioritário",
    ],
  },
  enterprise_20: {
    icon: Building2,
    description: "Para organizações com até 20 usuários",
    hasAI: true,
    features: [
      "10 workspaces criados",
      "Participar de 10 workspaces como convidado",
      "20 projetos por workspace",
      "20 convites por workspace",
      "Até 20 usuários por workspace",
      "🤖 Priorização com IA",
      "Relatórios avançados",
      "Suporte dedicado",
    ],
  },
};

function formatCurrency(amountCents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

function calcDiscount(monthly: number, yearly: number): number {
  const fullYear = monthly * 12;
  if (fullYear === 0) return 0;
  return Math.round(((fullYear - yearly) / fullYear) * 100);
}

interface PlanCardProps {
  plan: StripePlan;
  isAnnual: boolean;
  onCheckout: (priceId: string) => void;
  checkoutLoading: boolean;
  isCurrentPlan: boolean;
  isLoggedIn: boolean;
}

function StripePlanCard({ plan, isAnnual, onCheckout, checkoutLoading, isCurrentPlan, isLoggedIn }: PlanCardProps) {
  const meta = planMeta[plan.slug];
  if (!meta) return null;

  const price = isAnnual ? plan.yearly : plan.monthly;
  const displayAmount = price ? formatCurrency(price.amount) : "Sob consulta";
  const discount = plan.monthly && plan.yearly ? calcDiscount(plan.monthly.amount, plan.yearly.amount) : 0;

  return (
    <Card className={`relative flex flex-col transition-all hover:shadow-lg ${
      meta.popular ? "border-primary shadow-md ring-1 ring-primary/20" : "border-border"
    }`}>
      {meta.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3 py-0.5 text-xs font-semibold">
            Mais Popular
          </Badge>
        </div>
      )}
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <Badge variant="secondary" className="px-3 py-0.5 text-xs font-semibold">
            Seu Plano
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            meta.popular ? "bg-primary" : "bg-muted"
          }`}>
            <meta.icon className={`h-5 w-5 ${
              meta.popular ? "text-primary-foreground" : "text-muted-foreground"
            }`} />
          </div>
          <CardTitle className="text-xl">{plan.name.replace("ALE ", "")}</CardTitle>
          {meta.hasAI && (
            <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0.5">
              <Bot className="h-3 w-3" /> IA inclusa
            </Badge>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl sm:text-4xl font-bold">{displayAmount}</span>
          {price && (
            <span className="text-muted-foreground text-sm">
              /{isAnnual ? "ano" : "mês"}
            </span>
          )}
        </div>
        {isAnnual && discount > 0 && (
          <Badge variant="outline" className="w-fit mt-1 text-xs text-green-600 border-green-300">
            {discount}% de desconto
          </Badge>
        )}
        <CardDescription className="text-sm mt-1">{meta.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-2.5">
          {meta.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-4">
        {plan.slug === "enterprise" ? (
          <a href="mailto:contato@agilelite.equilibriumtecnologia.com.br" className="w-full">
            <Button variant="outline" className="w-full">Fale Conosco</Button>
          </a>
        ) : isCurrentPlan ? (
          <Button variant="outline" className="w-full" disabled>Plano Atual</Button>
        ) : (
          <Button
            variant={meta.popular ? "default" : "default"}
            className={`w-full ${meta.popular ? "bg-primary hover:bg-primary/90 text-primary-foreground" : ""}`}
            disabled={checkoutLoading || !price}
            onClick={() => {
              if (!isLoggedIn) {
                window.location.href = "/signup";
                return;
              }
              if (price) onCheckout(price.price_id);
            }}
          >
            {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isLoggedIn ? `Assinar ${plan.name.replace("ALE ", "")}` : "Criar Conta"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// Static Free plan card (no Stripe product)
function FreePlanCard({ isLoggedIn, isCurrentPlan }: { isLoggedIn: boolean; isCurrentPlan: boolean }) {
  return (
    <Card className="relative flex flex-col transition-all hover:shadow-lg border-border">
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <Badge variant="secondary" className="px-3 py-0.5 text-xs font-semibold">Seu Plano</Badge>
        </div>
      )}
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-muted">
            <Zap className="h-5 w-5 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">Free</CardTitle>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl sm:text-4xl font-bold">R$ 0</span>
          <span className="text-muted-foreground text-sm">para sempre</span>
        </div>
        <CardDescription className="text-sm mt-1">Para uso pessoal e experimentação</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-2.5">
          {["1 workspace padrão", "Participar de 1 workspace como convidado", "1 projeto por workspace", "Apenas 1 usuário (individual)", "Sem convites", "Suporte comunidade"].map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="pt-4">
        {isCurrentPlan ? (
          <Button variant="outline" className="w-full" disabled>Plano Atual</Button>
        ) : (
          <Link to={isLoggedIn ? "/dashboard" : "/signup"} className="w-full">
            <Button variant="outline" className="w-full">Começar Grátis</Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const { data: stripePlans, isLoading } = useStripePrices();
  const { checkout, loading: checkoutLoading } = useStripeCheckout();
  const { user } = useAuth();
  const { plan: userPlan } = useUserPlan();

  const currentSlug = userPlan?.plan_slug || "free";

  // Filter out enterprise for the 3-col grid, keep it separate
  const paidPlans = stripePlans?.filter(p => p.slug !== "enterprise") || [];
  const enterprisePlan = stripePlans?.find(p => p.slug === "enterprise");

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <span className="text-base sm:text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">ALE</span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              {user ? (
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/login"><Button variant="ghost" size="sm">Entrar</Button></Link>
                  <Link to="/signup">
                    <Button variant="hero" size="sm">Começar <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>
                  </Link>
                </>
              )}
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
            <p className="text-base sm:text-lg text-muted-foreground mb-8">
              Comece gratuitamente e escale conforme sua equipe cresce.
            </p>

            {/* Monthly/Annual toggle */}
            <div className="flex items-center justify-center gap-3">
              <span className={`text-sm font-medium ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}>Mensal</span>
              <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
              <span className={`text-sm font-medium ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
                Anual
                <Badge variant="outline" className="ml-2 text-xs text-green-600 border-green-300">-10%</Badge>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="pb-16 sm:pb-24">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
            {/* Free */}
            <div className="max-w-md mx-auto">
              <FreePlanCard isLoggedIn={!!user} isCurrentPlan={currentSlug === "free"} />
            </div>

            {/* Paid plans */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {paidPlans.map((plan) => (
                  <StripePlanCard
                    key={plan.slug}
                    plan={plan}
                    isAnnual={isAnnual}
                    onCheckout={checkout}
                    checkoutLoading={checkoutLoading}
                    isCurrentPlan={currentSlug === plan.slug}
                    isLoggedIn={!!user}
                  />
                ))}
              </div>
            )}

            {/* Enterprise */}
            {enterprisePlan && (
              <div className="max-w-md mx-auto">
                <StripePlanCard
                  plan={enterprisePlan}
                  isAnnual={isAnnual}
                  onCheckout={checkout}
                  checkoutLoading={checkoutLoading}
                  isCurrentPlan={currentSlug === "enterprise"}
                  isLoggedIn={!!user}
                />
              </div>
            )}
            {!enterprisePlan && !isLoading && (
              <div className="max-w-md mx-auto">
                <Card className="flex flex-col border-border">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-muted">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <CardTitle className="text-xl">Enterprise</CardTitle>
                    </div>
                    <span className="text-3xl font-bold">Sob consulta</span>
                    <CardDescription className="text-sm mt-1">Para grandes organizações</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-2.5">
                      {["Workspaces ilimitados", "Projetos ilimitados", "SSO / SAML", "Suporte dedicado"].map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="pt-4">
                    <a href="mailto:contato@agilelite.equilibriumtecnologia.com.br" className="w-full">
                      <Button variant="outline" className="w-full">Fale Conosco</Button>
                    </a>
                  </CardFooter>
                </Card>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-16 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="container mx-auto px-3 sm:px-4 relative">
          <div className="max-w-2xl mx-auto text-center text-white">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Dúvidas? Estamos aqui para ajudar</h2>
            <p className="text-base sm:text-lg mb-6 opacity-90">
              Entre em contato para planos Enterprise ou dúvidas sobre funcionalidades.
            </p>
            <a href="mailto:contato@agilelite.equilibriumtecnologia.com.br">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg">
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
            <Link to="/" className="hover:text-foreground transition-colors flex items-center gap-1 text-sm text-muted-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao início
            </Link>
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
