
# Melhorias PWA: Push Notifications + Pagina de Instalacao

## Visao Geral

Implementar push notifications nativas do navegador (Web Push API com VAPID) e criar uma experiencia completa de instalacao do PWA, incluindo uma pagina dedicada `/install` e um banner flutuante dentro do app.

---

## 1. Infraestrutura de Push Notifications

### 1.1 Gerar chaves VAPID
- Gerar um par de chaves VAPID (publica/privada) usando a lib `web-push`
- Armazenar a chave privada como secret (`VAPID_PRIVATE_KEY`) e a publica como secret (`VAPID_PUBLIC_KEY`)
- A chave publica tambem sera exposta no frontend via variavel de ambiente ou hardcoded (e publica por natureza)

### 1.2 Tabela `push_subscriptions` (migracao SQL)
```text
push_subscriptions
  - id: uuid (PK)
  - user_id: uuid (FK -> auth.users)
  - endpoint: text (unique)
  - p256dh: text
  - auth_key: text
  - created_at: timestamptz
```
- RLS: usuarios podem inserir/deletar/ver apenas as proprias subscriptions
- Politica de INSERT: `auth.uid() = user_id`
- Politica de SELECT/DELETE: `auth.uid() = user_id`

### 1.3 Migrar Service Worker para `injectManifest`
- Alterar `vite.config.ts` de `registerType: "autoUpdate"` para estrategia `injectManifest`
- Criar `src/sw.ts` (ou `public/sw.js`) com:
  - Pre-caching do Workbox (via `precacheAndRoute`)
  - Listener `push` para exibir notificacao nativa
  - Listener `notificationclick` para abrir/focar a janela do app e navegar ao link da notificacao
  - Manter o `navigateFallbackDenylist` para `/~oauth`

### 1.4 Hook `usePushSubscription`
- Verificar suporte do navegador (`'PushManager' in window`)
- Verificar permissao atual (`Notification.permission`)
- Funcao `subscribe()`: solicitar permissao, criar subscription via `pushManager.subscribe()` com a chave VAPID publica, salvar no banco (`push_subscriptions`)
- Funcao `unsubscribe()`: remover do banco e chamar `subscription.unsubscribe()`
- Estado reativo: `isSubscribed`, `isSupported`, `permission`

### 1.5 Edge Function `send-push-notification`
- Recebe: `user_id`, `title`, `body`, `url`, `icon`
- Busca todas as subscriptions do usuario na tabela `push_subscriptions`
- Usa protocolo Web Push (com chaves VAPID) para enviar a cada endpoint
- Remove subscriptions com endpoint invalido (status 410 Gone)
- Configurar em `supabase/config.toml` com `verify_jwt = false` (validacao manual no codigo)

### 1.6 Integrar push com notificacoes existentes
- Nos locais onde ja se cria notificacoes in-app (`useTasks.ts`, `KanbanBoard.tsx`), apos inserir na tabela `notifications`, invocar tambem `send-push-notification` para o `user_id` destinatario
- O push so e enviado se o usuario tiver subscriptions ativas

---

## 2. Pagina de Instalacao `/install`

### 2.1 Rota publica
- Adicionar rota `/install` no `App.tsx` (rota publica, sem `ProtectedRoute`)
- Pagina `src/pages/Install.tsx`

### 2.2 Conteudo da pagina
- Header com logo e titulo "Instale o Agile Lite"
- Deteccao automatica da plataforma (iOS, Android, Desktop)
- Instrucoes visuais com icones para cada plataforma:
  - **iOS**: "Toque em Compartilhar > Adicionar a Tela de Inicio"
  - **Android/Chrome**: Botao "Instalar" usando `beforeinstallprompt` ou instrucoes manuais
  - **Desktop**: Botao "Instalar" ou instrucoes do navegador
- Botao de instalacao nativo (capturando evento `beforeinstallprompt`)
- Secao de beneficios: acesso offline, notificacoes push, experiencia nativa
- Link para login/signup para usuarios nao autenticados

---

## 3. Banner de Instalacao no App

### 3.1 Componente `InstallBanner`
- `src/components/pwa/InstallBanner.tsx`
- Exibido dentro do `AppLayout` (apos login) se:
  - O app NAO esta em modo standalone (`window.matchMedia('(display-mode: standalone)')`)
  - O usuario nao dispensou o banner (salvar no `localStorage`)
- Conteudo: mensagem curta + botao "Instalar" + botao "X" para dispensar
- No Android/Desktop: capturar `beforeinstallprompt` e disparar o prompt nativo
- No iOS: redirecionar para `/install` com instrucoes

### 3.2 Hook `useInstallPrompt`
- Capturar e armazenar o evento `beforeinstallprompt`
- Expor `canInstall`, `promptInstall()`, `isStandalone`
- Compartilhado entre a pagina `/install` e o banner

---

## 4. Configuracao de Notificacoes nas Settings

### 4.1 Secao na pagina de Configuracoes
- Adicionar toggle "Notificacoes Push" na pagina `/settings`
- Usar o hook `usePushSubscription` para ativar/desativar
- Mostrar status: "Ativadas", "Bloqueadas pelo navegador", "Nao suportadas"

---

## Detalhes Tecnicos

### Dependencias necessarias
- `web-push` (apenas na Edge Function, importado via esm.sh no Deno)
- Nenhuma dependencia frontend adicional

### Arquivos a criar
| Arquivo | Descricao |
|---|---|
| `src/sw.ts` | Service Worker customizado com push handlers |
| `src/pages/Install.tsx` | Pagina de instalacao do PWA |
| `src/components/pwa/InstallBanner.tsx` | Banner de instalacao flutuante |
| `src/hooks/useInstallPrompt.ts` | Hook para capturar beforeinstallprompt |
| `src/hooks/usePushSubscription.ts` | Hook para gerenciar push subscriptions |
| `supabase/functions/send-push-notification/index.ts` | Edge Function para envio de push |
| Migracao SQL | Tabela push_subscriptions + RLS |

### Arquivos a modificar
| Arquivo | Mudanca |
|---|---|
| `vite.config.ts` | Trocar para `injectManifest` strategy |
| `src/App.tsx` | Adicionar rota `/install` |
| `src/components/layout/AppLayout.tsx` | Adicionar `InstallBanner` |
| `src/hooks/useTasks.ts` | Invocar push apos criar notificacao in-app |
| `src/components/kanban/KanbanBoard.tsx` | Invocar push apos criar notificacao in-app |
| `src/pages/Settings.tsx` | Adicionar secao de push notifications |
| `supabase/config.toml` | Adicionar config da nova edge function |

### Seguranca
- Chaves VAPID privadas armazenadas como secrets
- RLS na tabela `push_subscriptions` garante isolamento por usuario
- Edge Function valida JWT antes de enviar push
- Endpoints expirados (410) sao removidos automaticamente

### Limitacoes conhecidas
- iOS Safari so suporta push em PWAs instaladas (iOS 16.4+)
- Permissao de notificacao e por navegador/dispositivo, nao por usuario
- Alguns navegadores podem bloquear o prompt de instalacao
