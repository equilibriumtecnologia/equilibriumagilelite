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
| 2.4 Swimlanes por Sprint | ✅ Feito | `KanbanSwimlane.tsx`, `KanbanBoard.tsx` (toggle flat/swimlanes) |

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

### ✅ Fase 5 - Diferenciais Competitivos (60% Concluída)

| Feature | Status |
|---------|--------|
| 5.1 IA para Priorização | ✅ Feito |
| 5.2 Previsão de Entrega | ✅ Feito |
| 5.3 Bottleneck Detection | ✅ Feito |
| 5.4 Templates de Projeto | ✅ Feito |
| 5.5 Integrações (Webhooks) | ❌ Não feito |

### ⚠️ Fase 6 - Monetização (80% Concluída)

| Feature | Status | Evidência |
|---------|--------|-----------|
| 6.1 Sistema de Planos | ✅ Feito | `subscription_plans`, `user_subscriptions`, `useUserPlan.ts` |
| 6.2 Integração Stripe | ❌ Não feito | Sem edge functions de checkout/webhook |
| 6.3 Limite de Uso e Upselling | ✅ Feito | `useUserPlan.ts`, indicadores no Sidebar, verificação em `CreateProjectDialog`, `InviteUserDialog`, botão upgrade para owner |

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

### ✅ Fase B - Swimlanes e UX Avançada (100% Concluída)

#### B.1 Swimlanes por Sprint no Kanban ✅

**Prioridade:** Média | **Esforço:** Médio | **Status:** ✅ Concluído

**Implementado:**
- Toggle "Flat / Swimlanes" no toolbar do Kanban
- `KanbanSwimlane.tsx` — Seções expansíveis/colapsáveis por sprint
- Grupo "Sem Sprint" para tarefas órfãs
- Badges de status da sprint (Ativa, Planejamento, Concluída)
- Contadores de tarefas e story points por swimlane
- Preferência persistida no `localStorage`
- Sprints ativas e "Sem Sprint" expandidas por padrão

---

#### B.2 PWA Push Notifications ✅

**Prioridade:** Alta | **Esforço:** Alto | **Status:** ✅ Concluído

**Implementado:**
- Tabela `push_subscriptions` com RLS (SELECT/INSERT/DELETE por user)
- Chaves VAPID geradas e armazenadas como secrets (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`)
- `supabase/functions/send-push-notification/index.ts` — Disparo via Web Push com autenticação service_role
- `supabase/functions/send-task-notification/index.ts` — Notificação multicanal (e-mail Resend + Web Push)
- `src/sw.ts` — Service Worker com `injectManifest`, handlers de `push` e `notificationclick`
- `src/hooks/usePushSubscription.ts` — Registro de subscription, pedido de permissão, unsubscribe
- Limpeza automática de endpoints expirados (410/404)
- Suporte iOS 16.4+ (PWA instalado na Tela de Início)


---

### Fase C - Diferenciais Competitivos (4-6 semanas)

#### C.1 IA para Priorização ✅

**Prioridade:** Alta | **Esforço:** Alto | **Status:** ✅ Concluído

**Implementado:**
- `supabase/functions/ai-prioritize/index.ts` — Edge function com Lovable AI (google/gemini-3-flash-preview) e tool calling para saída estruturada
- `src/hooks/useAIPrioritization.ts` — Hook com state management para chamada e resultado
- `src/components/ai/AIPrioritizeButton.tsx` — Botão "🤖 Sugerir Prioridades" com tooltip
- `src/components/ai/AISuggestionsPanel.tsx` — Painel de sugestões com reordenação, badges de prioridade e tooltips de raciocínio
- Integrado no Backlog e no SprintBoardHeader

**Algoritmo (prompt) considera:**
- Prazo (due_date) e proximidade
- Prioridade atual e story points
- Status e tempo parado
- Criticidade do projeto
- Padrões de nomes e dependências implícitas

**UI:**
- Botão no Backlog e Sprint Board: "🤖 Sugerir Prioridades"
- Lista reordenada com setas ↑↓ indicando movimentação
- Tooltip por tarefa explica o raciocínio da IA
- Botões Aceitar (reordena) ou Descartar

---

#### C.2 Previsão de Entrega ✅

**Prioridade:** Média | **Esforço:** Médio | **Status:** ✅ Concluído

**Implementado:**
- `src/hooks/useDeliveryForecast.ts` — Hook com cálculo baseado em velocity média/min/max
- `src/components/dashboard/DeliveryForecastCard.tsx` — Card no Dashboard com progresso e 3 cenários
- `src/components/reports/DeliveryForecastReport.tsx` — Aba "Previsão" nos Reports com gráfico de projeção

**Cálculo:**
- Story points restantes / velocity (min, média, max) = sprints restantes
- Data estimada = hoje + (sprints_restantes × duração_média_sprint)
- 3 cenários: Otimista (velocity máxima), Realista (velocity média), Pessimista (velocity mínima)
- Requer pelo menos 2 sprints concluídas com velocity registrada

---

#### C.3 Bottleneck Detection ✅

**Prioridade:** Média | **Esforço:** Médio | **Status:** ✅ Concluído

**Implementado:**
- `src/hooks/useBottleneckDetection.ts` — Hook com 4 critérios de detecção
- `src/components/kanban/BottleneckIndicator.tsx` — Badge animado nas colunas do Kanban com tooltip detalhado
- `src/components/dashboard/BottleneckAlerts.tsx` — Card de alertas no Dashboard

**Critérios de Detecção:**
1. **WIP excedido** — Coluna com mais tarefas que o limite configurado
2. **Tarefas paradas** — Sem atualização há 3+ dias (configurável)
3. **Coluna sem saída** — Acúmulo sem conclusões nos últimos 7 dias
4. **Assignee sobrecarregado** — Membro com 5+ tarefas em progresso/revisão

**Severidades:** warning (amarelo) e critical (vermelho) com thresholds progressivos

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

#### D.2 UI de Upselling e Limites ✅

**Prioridade:** Média | **Esforço:** Baixo | **Status:** ✅ Concluído

**Implementado:**
- `useUserPlan.ts` — Hook centralizado com validação de limites via RPCs `check_*_limit`
- Indicadores de consumo no Sidebar (PlanUsage) — visíveis apenas para Master e Owner
- Verificação de limites em `CreateProjectDialog.tsx` e `InviteUserDialog.tsx`
- Botão de upgrade permanente para Owner no sidebar (plano Free)
- Bloqueio preventivo na UI ao atingir 100% do limite
- Funções `check_can_create_workspace`, `check_can_join_workspace`, `check_project_limit`, `check_invite_limit` no banco

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

### Sprint 2 (Semanas 3-4): Swimlanes + UX ✅ CONCLUÍDA
1. ~~B.1 Swimlanes por Sprint no Kanban~~ ✅

### Sprint 3 (Semanas 5-7): IA + Analytics — ✅ CONCLUÍDA
1. C.3 Bottleneck Detection ✅
2. C.2 Previsão de Entrega ✅
3. C.1 IA para Priorização ✅

### Sprint 4 (Semanas 8-10): Push + Monetização ✅ CONCLUÍDA
1. ~~B.2 PWA Push Notifications~~ ✅
2. ~~D.2 UI de Upselling~~ ✅

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
- **IA:** Usar Lovable AI (google/gemini-3-flash-preview) via edge function com tool calling — sem custo de API key para o usuário
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

O projeto está em **estágio avançado** com ~90% do roadmap original concluído. Sprints 1 e 2 foram totalmente entregues. O foco agora é:

1. **IA para Priorização** com streaming (Sprint 3)
2. **Previsão de Entrega e Bottleneck Detection** (Sprint 3)
3. **Monetização via Stripe** conforme STRIPE.md (Sprint 4)

A estimativa restante é de ~1-2 meses para as sprints 3-4.
