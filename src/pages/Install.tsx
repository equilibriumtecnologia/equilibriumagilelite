import { Download, Smartphone, Bell, Wifi, Share, PlusSquare, MoreVertical, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { Link } from "react-router-dom";

export default function Install() {
  const { canInstall, isStandalone, isIOS, promptInstall } = useInstallPrompt();

  const isAndroid = /Android/i.test(navigator.userAgent);
  const isDesktop = !isIOS && !isAndroid;

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Smartphone className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold">App já instalado!</h2>
            <p className="text-muted-foreground">
              O Agile Lite já está instalado no seu dispositivo.
            </p>
            <Link to="/dashboard">
              <Button className="mt-4">Ir para o Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <img src="/pwa-192x192.png" alt="Agile Lite" className="h-8 w-8 rounded-lg" />
            <h1 className="text-lg font-bold">Instale o Agile Lite</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Benefits */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Por que instalar?</h2>
          <div className="grid gap-3">
            {[
              { icon: Smartphone, title: "Experiência nativa", desc: "Acesse como um app nativo, sem barra de endereço." },
              { icon: Bell, title: "Notificações push", desc: "Receba alertas de tarefas e atualizações em tempo real." },
              { icon: Wifi, title: "Acesso rápido", desc: "Inicie direto da tela inicial do seu dispositivo." },
            ].map((item) => (
              <Card key={item.title}>
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Install instructions */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Como instalar</h2>

          {canInstall && (
            <Card>
              <CardContent className="p-6 text-center space-y-4">
                <p className="text-muted-foreground">
                  Clique no botão abaixo para instalar o app.
                </p>
                <Button size="lg" onClick={promptInstall} className="gap-2">
                  <Download className="h-5 w-5" />
                  Instalar Agile Lite
                </Button>
              </CardContent>
            </Card>
          )}

          {isIOS && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-medium">iPhone / iPad (Safari)</h3>
                <ol className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="bg-primary/10 text-primary rounded-full w-7 h-7 flex items-center justify-center shrink-0 text-sm font-bold">1</span>
                    <div className="flex items-center gap-2">
                      <span>Toque no ícone</span>
                      <Share className="h-5 w-5 text-primary" />
                      <span className="font-medium">Compartilhar</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-primary/10 text-primary rounded-full w-7 h-7 flex items-center justify-center shrink-0 text-sm font-bold">2</span>
                    <div className="flex items-center gap-2">
                      <span>Selecione</span>
                      <PlusSquare className="h-5 w-5 text-primary" />
                      <span className="font-medium">Adicionar à Tela de Início</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-primary/10 text-primary rounded-full w-7 h-7 flex items-center justify-center shrink-0 text-sm font-bold">3</span>
                    <span>Toque em <strong>Adicionar</strong></span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          )}

          {isAndroid && !canInstall && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-medium">Android (Chrome)</h3>
                <ol className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="bg-primary/10 text-primary rounded-full w-7 h-7 flex items-center justify-center shrink-0 text-sm font-bold">1</span>
                    <div className="flex items-center gap-2">
                      <span>Toque no menu</span>
                      <MoreVertical className="h-5 w-5 text-primary" />
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-primary/10 text-primary rounded-full w-7 h-7 flex items-center justify-center shrink-0 text-sm font-bold">2</span>
                    <span>Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-primary/10 text-primary rounded-full w-7 h-7 flex items-center justify-center shrink-0 text-sm font-bold">3</span>
                    <span>Confirme tocando em <strong>Instalar</strong></span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          )}

          {isDesktop && !canInstall && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-medium">Desktop (Chrome / Edge)</h3>
                <ol className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="bg-primary/10 text-primary rounded-full w-7 h-7 flex items-center justify-center shrink-0 text-sm font-bold">1</span>
                    <span>Procure o ícone <strong>⊕</strong> na barra de endereço</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-primary/10 text-primary rounded-full w-7 h-7 flex items-center justify-center shrink-0 text-sm font-bold">2</span>
                    <span>Clique em <strong>"Instalar"</strong></span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          )}
        </section>

        {/* CTA */}
        <section className="text-center space-y-3 pb-8">
          <p className="text-muted-foreground text-sm">
            Ainda não tem uma conta?
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/login">
              <Button variant="outline">Entrar</Button>
            </Link>
            <Link to="/signup">
              <Button>Criar Conta</Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
