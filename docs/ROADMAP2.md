# ROADMAP 2.0 - Agile Lite Equilibrium

> Atualizado em: 03/03/2026  
> Documento gerado a partir da análise do ROADMAP.md original vs. estado atual do projeto.

---

## 📊 Status das Fases do ROADMAP Original

### ✅ Fase 1 - Quick Wins (100% Concluída)

| Feature | Status | Evidência |
|---------|--------|-----------|
| 1.1 WIP Limits por Coluna | ✅ Feito | `WIPLimitBadge.tsx`, `WIPLimitSettings.tsx`, `useBoardSettings.ts`, tabela `board_settings` |
| 1.2 Story Points nas Tarefas | ✅ Feito | `StoryPointsBadge.tsx`, `StoryPointsSelector.tsx`, coluna `story_points` em `tasks` |
| 1.3 Filtros Avançados no Kanban | ✅ Feito | `KanbanFilters.tsx` |
| 1.4 Colunas Customizáveis (Labels) | ✅ Feito | `ColumnCustomizeDialog.tsx`, colunas `label`/`color` em `board_settings` |

### ✅ Fase 2 - Sistema de Sprints (95% Concluída)

| Feature | Status | Evidência |
|---------|--------|-----------|
| 2.1 Tabela de Sprints | ✅ Feito | Tabela `sprints`, `useSprints.ts`, CRUD completo |
| 2.2 Página de Backlog | ✅ Feito | `Backlog.tsx`, `BacklogItem.tsx`, `MoveToSprintDialog.tsx` |
| 2.3 Sprint Planning View | ✅ Feito | `SprintPlanningDialog.tsx` com split-view e drag-and-drop |
| 2.4 Swimlanes por Sprint | ❌ Não feito | Kanban não agrupa por sprint |

### ✅ Fase 3 - Analytics e Reports (85% Concluída)

| Feature | Status | Evidência |
|---------|--------|-----------|
| 3.1 Página de Reports | ✅ Feito | `Reports.tsx`, `useReportData.ts` |
| 3.2 Burndown Chart | ✅ Feito | `BurndownChart.tsx` |
| 3.3 Velocity Chart | ✅ Feito | `VelocityChart.tsx` |
| 3.4 Cumulative Flow Diagram | ✅ Feito | `CumulativeFlowChart.tsx` |
| 3.5 Cycle Time | ✅ Feito | `CycleTimeChart.tsx` |
| 3.6 Team Performance | ✅ Feito | `TeamPerformance.tsx` |
| 3.7 Export de Relatórios | ✅ Feito | `ExportButton.tsx`, `exportCsv.ts` — CSV client-side em todas as abas |

### ⚠️ Fase 4 - Colaboração Avançada (70% Concluída)

| Feature | Status | Evidência |
|---------|--------|-----------|
| 4.1 Comentários em Tarefas | ✅ Feito | `MentionTextarea.tsx`, `TaskHistoryPanel.tsx` (via `comment_added`) |
| 4.2 Sistema de @Menções | ✅ Feito | `useMentions.ts`, `MentionTextarea.tsx` |
| 4.3 Notificações In-App | ✅ Feito | `NotificationsPopover.tsx`, `useNotifications.ts`, tabela `notifications` |
| 4.4 Activity Feed | ✅ Feito | `ActivityFeed.tsx`, `ActivityItem.tsx`, `useActivityFeed.ts` — feed cronológico real |

### ❌ Fase 5 - Diferenciais Competitivos (0% Concluída)

| Feature | Status |
|---------|--------|
| 5.1 IA para Priorização | ❌ Não feito |
| 5.2 Previsão de Entrega | ❌ Não feito |
| 5.3 Bottleneck Detection | ❌ Não feito |
| 5.4 Templates de Projeto | ❌ Não feito |
| 5.5 Integrações (Webhooks) | ❌ Não feito |

### ⚠️ Fase 6 - Monetização (60% Concluída)

| Feature | Status | Evidência |
|---------|--------|-----------|
| 6.1 Sistema de Planos | ✅ Feito | `subscription_plans`, `user_subscriptions`, `useUserPlan.ts` |
| 6.2 Integração Stripe | ❌ Não feito | Sem edge functions de checkout/webhook |
| 6.3 Limite de Uso e Upselling | ⚠️ Parcial | Funções `check_*_limit` existem, falta UI de upselling |

---

## 🚀 ROADMAP 2.0 - Features Pendentes

Organizado por prioridade e esforço estimado.

---

### Fase A - Complementos Rápidos (1-2 semanas)

#### A.1 Colunas Customizáveis (Labels e Cores)

**Prioridade:** Média | **Esforço:** Baixo

**O que falta:**
- Adicionar colunas `label` e `color` à tabela `board_settings`
- UI para customizar nomes/cores das colunas do Kanban

**Mudanças no Banco:**
```sql
ALTER TABLE public.board_settings
ADD COLUMN label TEXT DEFAULT NULL,
ADD COLUMN color TEXT DEFAULT NULL;
```

**Componentes a criar/modificar:**
- `src/components/kanban/ColumnCustomizeDialog.tsx` — Dialog para editar label/cor
- Modificar `KanbanColumn.tsx` — Exibir label customizado e cor
- Modificar `useBoardSettings.ts` — Incluir label/color nas queries

---

#### A.2 Export de Relatórios (CSV)

**Prioridade:** Média | **Esforço:** Baixo

**O que falta:**
- Botão de exportar dados em CSV nos relatórios

**Componentes a criar:**
- `src/components/reports/ExportButton.tsx` — Botão que converte dados dos charts em CSV
- Função utilitária `src/lib/exportCsv.ts` — Converte array de objetos para CSV e dispara download

**Comportamento:**
- Cada aba do Reports terá botão "Exportar CSV"
- Gera download do navegador sem necessidade de backend
- Campos: conforme dados do chart ativo

---

#### A.3 Activity Feed Real

**Prioridade:** Média | **Esforço:** Baixo

**O que falta:**
- A página Activities.tsx é uma lista de tarefas, não um feed de atividades recentes

**Componentes a criar/modificar:**
- `src/components/activity/ActivityFeed.tsx` — Lista cronológica de ações
- `src/components/activity/ActivityItem.tsx` — Item individual (avatar + ação + timestamp)
- `src/hooks/useActivityFeed.ts` — Query na tabela `task_history` com join em `profiles`
- Modificar `Activities.tsx` — Usar o novo feed
- Adicionar widget compacto no `Dashboard.tsx`

---

#### A.4 Sprint Planning Dialog

**Prioridade:** Alta | **Esforço:** Médio

**O que falta:**
- Interface dedicada para planejar sprints (split view Backlog | Sprint)

**Componentes a criar:**
- `src/components/sprints/SprintPlanningDialog.tsx` — Dialog fullscreen com split view
- `src/components/sprints/SprintCapacity.tsx` — Barra de capacity (pontos planejados vs velocity média)

**Comportamento:**
- Abrir a partir da página de Sprints (botão "Planejar Sprint")
- Lado esquerdo: lista de tarefas do backlog (filtráveis)
- Lado direito: tarefas já na sprint com total de story points
- Drag-and-drop entre os dois lados
- Exibir velocity média das últimas 3 sprints como referência

---

### Fase B - Swimlanes e UX Avançada (2-3 semanas)

#### B.1 Swimlanes por Sprint no Kanban

**Prioridade:** Média | **Esforço:** Médio

**O que falta:**
- Opção de agrupar tarefas por sprint no board

**Componentes a criar/modificar:**
- Modificar `KanbanBoard.tsx` — Adicionar toggle de modo (flat vs swimlane)
- `src/components/kanban/KanbanSwimlane.tsx` — Container de swimlane (expandível/colapsável)
- Cada swimlane = uma sprint (+ "Sem Sprint" para órfãs)

**Comportamento:**
- Toggle no header do board: "Agrupar por Sprint"
- Cada swimlane mostra nome da sprint, progresso e pode ser colapsada
- Persistir preferência no localStorage

---

#### B.2 PWA Push Notifications

**Prioridade:** Alta | **Esforço:** Alto

**O que falta:**
- Notificações push nativas no celular/desktop via PWA

**Mudanças no Banco:**
```sql
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
```

**Infraestrutura:**
- Gerar VAPID keys e armazenar como secrets
- `supabase/functions/send-push-notification/index.ts` — Envia via Web Push protocol
- Migrar `vite-plugin-pwa` para `injectManifest` com service worker customizado

**Componentes a criar:**
- `src/hooks/usePushNotifications.ts` — Registra subscription e pede permissão
- `src/components/notifications/PushPermissionBanner.tsx` — Banner pedindo permissão
- `public/sw.js` — Service worker com handlers de `push` e `notificationclick`

**Fluxo:**
1. Usuário instala PWA → banner aparece pedindo permissão
2. Aceita → subscription salva no banco
3. Eventos (tarefa atribuída, menção, etc.) disparam edge function
4. Edge function envia push via VAPID

---

### Fase C - Diferenciais Competitivos (4-6 semanas)

#### C.1 IA para Priorização

**Prioridade:** Alta | **Esforço:** Alto

**Componentes a criar:**
- `supabase/functions/ai-prioritize/index.ts` — Recebe lista de tarefas, retorna sugestões
- `src/components/ai/PrioritySuggestion.tsx` — Badge/tooltip na tarefa
- `src/components/ai/PrioritizeButton.tsx` — Botão "Sugerir Prioridades" no backlog
- `src/hooks/useAIPrioritization.ts` — Chamada à edge function

**Modelo:** Usar Lovable AI (google/gemini-2.5-flash) sem necessidade de API key

**Algoritmo (prompt) considera:**
- Prazo (due_date) e proximidade
- Prioridade atual e story points
- Status e tempo parado
- Criticidade do projeto (criticality_level)
- Padrões históricos (task_history)

**UI:**
- Botão no Backlog: "🤖 Sugerir Prioridades"
- Exibe lista reordenada com badges "IA Suggest"
- Tooltip explica raciocínio
- Botão para aceitar (reordena backlog) ou rejeitar

---

#### C.2 Previsão de Entrega

**Prioridade:** Média | **Esforço:** Médio

**Componentes a criar:**
- `src/components/reports/DeliveryForecast.tsx` — Card com data estimada
- Adicionar como nova aba no Reports ou widget no Dashboard

**Cálculo:**
- Story points restantes na sprint / velocity média = sprints restantes
- Data estimada = hoje + (sprints_restantes × duração_média_sprint)
- Intervalo: pessimista (velocity mínima) / otimista (velocity máxima)

**Dados necessários:**
- `getVelocityData()` do `useReportData` (já existe)
- Total de story points não concluídos por sprint

---

#### C.3 Bottleneck Detection

**Prioridade:** Média | **Esforço:** Médio

**Componentes a criar:**
- `src/components/kanban/ColumnHealthIndicator.tsx` — Indicador visual na coluna
- `src/components/reports/BottleneckAlert.tsx` — Alert no Reports
- `src/hooks/useBottleneckDetection.ts` — Lógica de detecção

**Regras de detecção:**
- Coluna com WIP > limite por 3+ dias consecutivos
- Tarefas paradas (sem mudança de status) há mais de 5 dias úteis
- Membro com mais de 5 tarefas em andamento
- Coluna crescendo sem saída (entradas > saídas nos últimos 7 dias)

**UI:**
- Indicador amarelo/vermelho na coluna do Kanban
- Card de alerta no Dashboard
- Detalhes expandidos nos Reports

---

#### C.4 Templates de Projeto

**Prioridade:** Baixa | **Esforço:** Médio

**Mudanças no Banco:**
```sql
CREATE TABLE public.project_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'development', 'marketing', 'custom'
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;
```

**Componentes a criar:**
- `src/components/projects/TemplateSelector.tsx` — Seleção ao criar projeto
- `src/components/projects/SaveAsTemplateDialog.tsx` — Salvar projeto como template
- `src/hooks/useProjectTemplates.ts`

**Templates iniciais (seed):**
- **Desenvolvimento:** Colunas padrão + categorias (Bug, Feature, Tech Debt)
- **Marketing:** Colunas (Ideia, Produção, Revisão, Publicado)
- **Genérico:** Kanban básico (To Do, In Progress, Done)

**Config JSONB:**
```json
{
  "columns": ["todo", "in_progress", "review", "completed"],
  "column_labels": {"todo": "A Fazer", ...},
  "default_categories": ["Bug", "Feature"],
  "wip_limits": {"in_progress": 5},
  "sample_tasks": [{"title": "Tarefa exemplo", "priority": "medium"}]
}
```

---

#### C.5 Webhooks Base

**Prioridade:** Baixa | **Esforço:** Alto

**Mudanças no Banco:**
```sql
CREATE TABLE public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  secret TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
```

**Componentes a criar:**
- `src/components/settings/WebhooksManagement.tsx` — CRUD de webhooks
- `src/components/settings/WebhookTestDialog.tsx` — Enviar evento de teste
- `supabase/functions/webhook-dispatcher/index.ts` — Dispara webhooks

**Eventos:**
- `task.created`, `task.updated`, `task.status_changed`, `task.assigned`
- `sprint.started`, `sprint.completed`
- `comment.added`

**Segurança:**
- HMAC-SHA256 com secret do webhook no header `X-Webhook-Signature`
- Retry com backoff exponencial (3 tentativas)

---

### Fase D - Monetização Completa (3-4 semanas)

#### D.1 Integração Stripe (Checkout + Webhook)

**Prioridade:** Alta | **Esforço:** Alto

**Pré-requisitos:**
- Conta Stripe configurada
- Secret `STRIPE_SECRET_KEY` adicionada

**Edge Functions a criar:**
- `supabase/functions/create-checkout/index.ts`
  - Recebe `plan_id`, cria Stripe Checkout Session
  - Retorna URL de checkout
- `supabase/functions/stripe-webhook/index.ts`
  - Valida assinatura do webhook Stripe
  - Atualiza `user_subscriptions` conforme evento
  - Eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

**Componentes a criar/modificar:**
- Modificar `Pricing.tsx` — Adicionar botões de checkout reais
- `src/pages/Billing.tsx` — Página de gestão de assinatura
- `src/components/billing/CurrentPlanCard.tsx` — Exibe plano atual
- `src/components/billing/InvoiceHistory.tsx` — Histórico via API Stripe

**Fluxo:**
1. Usuário clica "Assinar" no Pricing
2. Edge function cria sessão Stripe → redirect
3. Stripe webhook atualiza `user_subscriptions`
4. Usuário retorna com plano ativo

---

#### D.2 UI de Upselling e Limites

**Prioridade:** Média | **Esforço:** Baixo

**Componentes a criar:**
- `src/components/billing/UpgradePrompt.tsx` — Modal quando atinge limite
- `src/components/billing/UsageMeter.tsx` — Barra de uso (projetos, membros)
- Modificar `CreateProjectDialog.tsx` — Verificar limite antes de criar
- Modificar `InviteUserDialog.tsx` — Verificar limite antes de convidar

**Comportamento:**
- Soft block: exibe prompt de upgrade quando atinge 100%
- Warning: exibe badge quando atinge 80%
- Funções `check_*_limit` já existem no banco

---

### Fase E - Qualidade e Infra (Contínuo)

#### E.1 PWA Install Page

**Prioridade:** Alta | **Esforço:** Baixo

- `src/pages/Install.tsx` — Instruções visuais para instalar o PWA
- Detectar plataforma (iOS/Android/Desktop) e mostrar instruções específicas
- Adicionar link na Landing page e no menu do app

#### E.2 Export PDF de Relatórios

**Prioridade:** Baixa | **Esforço:** Alto

- `supabase/functions/generate-report-pdf/index.ts`
- Usar biblioteca como `jspdf` ou serviço de renderização
- Incluir gráficos como imagens base64

#### E.3 Error Boundaries

**Prioridade:** Média | **Esforço:** Baixo

- `src/components/ErrorBoundary.tsx`
- Envolver rotas principais
- Exibir tela amigável com opção de reload

#### E.4 Loading Skeletons Consistentes

**Prioridade:** Baixa | **Esforço:** Baixo

- Criar skeletons padrão para cards, listas e tabelas
- Aplicar em todas as páginas que usam queries assíncronas

---

## 📅 Cronograma Resumido

| Fase | Duração | Features Principais |
|------|---------|---------------------|
| A - Complementos | 1-2 sem | Labels, Export CSV, Activity Feed, Sprint Planning |
| B - UX Avançada | 2-3 sem | Swimlanes, Push Notifications |
| C - Diferenciais | 4-6 sem | IA Priorização, Forecast, Bottleneck, Templates, Webhooks |
| D - Monetização | 3-4 sem | Stripe, Upselling |
| E - Qualidade | Contínuo | PWA Install, PDF, Error Boundaries, Skeletons |

**Tempo Total Estimado:** ~12-17 semanas (3-4 meses)

---

## 🎯 Prioridade de Implementação Sugerida

### Sprint 1 (Semanas 1-2): Quick Wins ✅ CONCLUÍDA
1. ~~A.2 Export CSV~~ ✅
2. ~~A.3 Activity Feed Real~~ ✅
3. E.1 PWA Install Page ✅ (já existia)
4. ~~E.3 Error Boundaries~~ ✅
5. ~~A.1 Colunas Customizáveis~~ ✅
6. ~~A.4 Sprint Planning Dialog~~ ✅

### Sprint 2 (Semanas 3-4): Swimlanes + UX
1. B.1 Swimlanes por Sprint no Kanban

### Sprint 3 (Semanas 5-7): Push + IA
1. B.2 PWA Push Notifications
2. C.1 IA para Priorização

### Sprint 4 (Semanas 8-10): Analytics Avançado
1. C.2 Previsão de Entrega
2. C.3 Bottleneck Detection
3. D.2 UI de Upselling

### Sprint 5 (Semanas 11-14): Monetização + Extras
1. D.1 Integração Stripe
2. C.4 Templates de Projeto

### Sprint 6+ (Contínuo):
1. C.5 Webhooks
2. E.2 Export PDF
3. E.4 Loading Skeletons

---

## 📝 Notas Técnicas

### Decisões de Arquitetura
- **IA:** Usar Lovable AI (gemini-2.5-flash) via edge function — sem custo de API key para o usuário
- **Push Notifications:** VAPID + Web Push API — funciona em Android e iOS 16.4+ (PWA instalado)
- **Export CSV:** 100% client-side — sem edge function necessária
- **Stripe:** Checkout Sessions (hosted) — menor PCI scope

### Débitos Técnicos Identificados
1. ~~Refatorar hooks de tarefas~~ — Já organizados em hooks compostos
2. ~~Error Boundaries~~ — ✅ Implementado (`ErrorBoundary.tsx` envolvendo rotas)
3. Loading Skeletons — Pendente (Fase E)
4. Tipagem de responses — OK (types.ts auto-gerado)
5. ~~Documentação de componentes~~ — Deprioritizado (foco em features)

---

## 🏁 Conclusão

O projeto está em **estágio avançado** com ~85% do roadmap original concluído. Sprint 1 foi totalmente entregue. O foco agora é:

1. **Swimlanes por Sprint** no Kanban (Sprint 2)
2. **Push Notifications** (diferencial forte para PWA)
3. **IA e Analytics** (diferenciais competitivos — Priorização, Previsão, Bottleneck)
4. **Monetização** (Stripe para receita)

A estimativa restante é de ~2-3 meses para as sprints 2-5.
