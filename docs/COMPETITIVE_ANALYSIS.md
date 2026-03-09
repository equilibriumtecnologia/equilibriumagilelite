# Análise Competitiva — ALE vs Mercado

**Data:** Março 2026  
**Versão:** 1.0  
**Base:** Levantamento de mercado (`SEARCH.md`), GAP Analysis original (`GAP_ANALYSIS.md`) e estado atual do projeto.

---

## 1. Resumo Executivo

O **Agile Lite Equilibrium (ALE)** evoluiu de ~22% de cobertura funcional (GAP original) para **~85%** do roadmap planejado. A maioria das funcionalidades classificadas como "Não Implementado" foram entregues, incluindo: Sprints completos, Backlog com IA, Reports avançados, WIP Limits, Story Points, Templates, Sistema de Planos com Stripe, PWA com Push Notifications e Downgrade com carência de 7 dias (CDC).

### Evolução por Categoria

```
Core MVP:           ██████████ 100%  (era 40%)
Rentabilidade:      █████████░  90%  (era 14%)
Diferenciais:       ██████░░░░  60%  (era 0%)
Dashboard:          █████████░  90%  (era 43%)
Board/Workspace:    ██████████ 100%  (era 50%)
Backlog:            █████████░  90%  (era 0%)
Reports:            █████████░  90%  (era 0%)
Configurações:      █████████░  90%  (era 33%)
```

---

## 2. Tabela Comparativa: ALE vs Concorrentes

### 2.1 Funcionalidades Core

| Feature               | ALE | Jira | Asana | ClickUp | Monday | Trello | Notion |
| --------------------- | --- | ---- | ----- | ------- | ------ | ------ | ------ |
| Kanban Board          | ✅  | ✅   | ✅    | ✅      | ✅     | ✅     | ✅     |
| Drag-and-Drop         | ✅  | ✅   | ✅    | ✅      | ✅     | ✅     | ✅     |
| Colunas customizáveis | ✅  | ✅   | ✅    | ✅      | ✅     | ✅     | ✅     |
| WIP Limits            | ✅  | ✅   | ❌    | ✅      | ❌     | ❌     | ❌     |
| Swimlanes por Sprint  | ✅  | ✅   | ❌    | ✅      | ❌     | ❌     | ❌     |
| Filtros no Board      | ✅  | ✅   | ✅    | ✅      | ✅     | 🟡     | ✅     |
| Mobile responsive     | ✅  | ✅   | ✅    | ✅      | ✅     | ✅     | ✅     |
| PWA (installable)     | ✅  | ❌   | ❌    | ❌      | ❌     | ❌     | ❌     |

### 2.2 Scrum & Sprints

| Feature                  | ALE | Jira | Asana | ClickUp | Monday | Trello | Notion |
| ------------------------ | --- | ---- | ----- | ------- | ------ | ------ | ------ |
| Sprint CRUD              | ✅  | ✅   | 🟡    | ✅      | 🟡     | ❌     | ❌     |
| Sprint Planning          | ✅  | ✅   | ❌    | ✅      | ❌     | ❌     | ❌     |
| Sprint Board + Swimlanes | ✅  | ✅   | ❌    | ✅      | ❌     | ❌     | ❌     |
| Story Points             | ✅  | ✅   | ❌    | ✅      | ❌     | 🟡     | ❌     |
| Velocity Tracking        | ✅  | ✅   | ❌    | ✅      | ❌     | ❌     | ❌     |
| Burndown Chart           | ✅  | ✅   | ❌    | ✅      | ❌     | ❌     | ❌     |

### 2.3 Backlog & Priorização

| Feature             | ALE | Jira | Asana | ClickUp | Monday | Trello | Notion |
| ------------------- | --- | ---- | ----- | ------- | ------ | ------ | ------ |
| Backlog priorizado  | ✅  | ✅   | ✅    | ✅      | 🟡     | ❌     | 🟡     |
| Drag para reordenar | ✅  | ✅   | ✅    | ✅      | ✅     | ✅     | ❌     |
| Mover para Sprint   | ✅  | ✅   | ❌    | ✅      | ❌     | ❌     | ❌     |
| IA para priorização | ✅  | 🟡   | ✅    | ✅      | 🟡     | ❌     | ✅     |
| Subtasks aninhadas  | ✅  | ✅   | ✅    | ✅      | ✅     | ✅     | ✅     |

### 2.4 Reports & Analytics

| Feature               | ALE | Jira | Asana | ClickUp | Monday | Trello | Notion |
| --------------------- | --- | ---- | ----- | ------- | ------ | ------ | ------ |
| Burndown Chart        | ✅  | ✅   | ❌    | ✅      | ❌     | ❌     | ❌     |
| Velocity Chart        | ✅  | ✅   | ❌    | ✅      | ❌     | ❌     | ❌     |
| Cumulative Flow (CFD) | ✅  | ✅   | ❌    | ✅      | ❌     | ❌     | ❌     |
| Cycle Time            | ✅  | ✅   | ❌    | ✅      | ❌     | ❌     | ❌     |
| Team Performance      | ✅  | ✅   | ✅    | ✅      | ✅     | ❌     | ❌     |
| Delivery Forecast     | ✅  | 🟡   | ❌    | 🟡      | ❌     | ❌     | ❌     |
| Bottleneck Detection  | ✅  | 🟡   | ❌    | ❌      | ❌     | ❌     | ❌     |
| Export CSV            | ✅  | ✅   | ✅    | ✅      | ✅     | ✅     | ✅     |
| Export PDF            | ❌  | ✅   | ✅    | ✅      | ✅     | ❌     | ✅     |

### 2.5 Colaboração

| Feature                  | ALE | Jira | Asana | ClickUp | Monday | Trello | Notion |
| ------------------------ | --- | ---- | ----- | ------- | ------ | ------ | ------ |
| Comentários em tarefas   | ✅  | ✅   | ✅    | ✅      | ✅     | ✅     | ✅     |
| @menções                 | ✅  | ✅   | ✅    | ✅      | ✅     | ✅     | ✅     |
| Activity Feed            | ✅  | ✅   | ✅    | ✅      | ✅     | ✅     | ✅     |
| Notificações email       | ✅  | ✅   | ✅    | ✅      | ✅     | ✅     | ✅     |
| Push Notifications       | ✅  | ✅   | ✅    | ✅      | ✅     | ✅     | ✅     |
| Time Tracking            | ❌  | ✅   | ✅    | ✅      | ✅     | 🟡     | ❌     |
| Chat / mensagens diretas | ❌  | ❌   | ✅    | ✅      | ❌     | ❌     | ❌     |

### 2.6 Integrações & Plataforma

| Feature             | ALE | Jira | Asana | ClickUp | Monday | Trello | Notion |
| ------------------- | --- | ---- | ----- | ------- | ------ | ------ | ------ |
| GitHub/GitLab       | ❌  | ✅   | ✅    | ✅      | ✅     | ✅     | ❌     |
| Slack               | ❌  | ✅   | ✅    | ✅      | ✅     | ✅     | ✅     |
| SSO (SAML/OAuth)    | ❌  | ✅   | ✅    | ✅      | ✅     | ✅     | ✅     |
| API pública         | ❌  | ✅   | ✅    | ✅      | ✅     | ✅     | ✅     |
| Webhooks            | ❌  | ✅   | ✅    | ✅      | ✅     | ✅     | ❌     |
| Automações (rules)  | ❌  | ✅   | ✅    | ✅      | ✅     | 🟡     | 🟡     |
| Import de boards    | ❌  | ✅   | ✅    | ✅      | ✅     | ❌     | ❌     |
| Multi-idioma (i18n) | ❌  | ✅   | ✅    | ✅      | ✅     | ✅     | ✅     |

### 2.7 Monetização & Planos

| Feature                  | ALE | Jira | Asana | ClickUp | Monday | Trello | Notion |
| ------------------------ | --- | ---- | ----- | ------- | ------ | ------ | ------ |
| Plano gratuito           | ✅  | ✅   | ✅    | ✅      | ✅     | ✅     | ✅     |
| Planos pagos escalonados | ✅  | ✅   | ✅    | ✅      | ✅     | ✅     | ✅     |
| Enterprise customizado   | ✅  | ✅   | ✅    | ✅      | ✅     | ✅     | ✅     |
| Stripe integrado         | ✅  | N/A  | N/A   | N/A     | N/A    | N/A    | N/A    |
| Downgrade com carência   | ✅  | ❌   | ❌    | ❌      | ❌     | ❌     | ❌     |
| Cobrança em BRL          | ✅  | ❌   | ❌    | ❌      | ❌     | ❌     | ❌     |

---

## 3. Features Implementadas (Atualização do GAP)

### ✅ Totalmente Implementadas

| #   | Feature                                 | Componentes Principais                                                    |
| --- | --------------------------------------- | ------------------------------------------------------------------------- |
| 1   | Kanban com drag-and-drop                | `KanbanBoard`, `KanbanColumn`, `KanbanTaskCard`, `@dnd-kit`               |
| 2   | Colunas customizáveis (label, cor, WIP) | `ColumnCustomizeDialog`, `board_settings` table                           |
| 3   | WIP Limits por coluna                   | `WIPLimitBadge`, `WIPLimitSettings`, `BottleneckIndicator`                |
| 4   | Filtros no Kanban                       | `KanbanFilters` (responsável, prioridade, busca)                          |
| 5   | Swimlanes por Sprint                    | `KanbanSwimlane`, `SprintBoardHeader`                                     |
| 6   | Sprints CRUD completo                   | `CreateSprintDialog`, `EditSprintDialog`, `DeleteSprintDialog`            |
| 7   | Sprint Planning                         | `SprintPlanningDialog` com capacidade e story points                      |
| 8   | Backlog priorizado                      | `Backlog` page, `BacklogItem`, drag para reordenar                        |
| 9   | Mover para Sprint                       | `MoveToSprintDialog`                                                      |
| 10  | IA para priorização de backlog          | `AIPrioritizeButton`, `AISuggestionsPanel`, edge function `ai-prioritize` |
| 11  | Story Points                            | `StoryPointsSelector`, `StoryPointsBadge`                                 |
| 12  | Burndown Chart                          | `BurndownChart` com ideal vs real                                         |
| 13  | Velocity Chart                          | `VelocityChart` com média móvel                                           |
| 14  | Cumulative Flow Diagram                 | `CumulativeFlowChart`                                                     |
| 15  | Cycle Time Chart                        | `CycleTimeChart`                                                          |
| 16  | Team Performance                        | `TeamPerformance` com métricas por membro                                 |
| 17  | Delivery Forecast                       | `DeliveryForecastReport`, `DeliveryForecastCard`                          |
| 18  | Bottleneck Detection                    | `BottleneckAlerts`, `BottleneckIndicator`, `useBottleneckDetection`       |
| 19  | Comentários com @menções                | `MentionTextarea`, `useMentions`, `task_history` (comment_added)          |
| 20  | Notificações email + push               | `NotificationsPopover`, `usePushSubscription`, edge functions             |
| 21  | Activity Feed                           | `ActivityFeed`, `ActivityItem`, `useActivityFeed`                         |
| 22  | Export CSV                              | `ExportButton`, `exportCsv.ts`                                            |
| 23  | Templates de projeto                    | `TemplateSelector`, `SaveAsTemplateDialog`, `project_templates` table     |
| 24  | Sistema de planos (5 tiers)             | `subscription_plans` table, `useUserPlan`, `get_user_plan` RPC            |
| 25  | Stripe Checkout + Webhook               | `stripe-create-checkout`, `stripe-webhook`, `stripe-sync-subscription`    |
| 26  | Portal de gerenciamento Stripe          | `stripe-customer-portal`                                                  |
| 27  | Downgrade com carência de 7 dias        | `process-downgrade`, `enforce-downgrade-queue`, `DowngradeQueueBanner`    |
| 28  | Export de workspace (backup)            | `export-workspace-data` edge function                                     |
| 29  | Swap de itens no downgrade              | `swap-downgrade-items`, `ManageDowngrade` page                            |
| 30  | Restauração ao fazer upgrade            | `restore-downgrade` edge function                                         |
| 31  | PWA com install page                    | `InstallBanner`, `Install` page, `useInstallPrompt`, Service Worker       |
| 32  | Subtasks                                | `SubTasksList`, `sub_tasks` table                                         |
| 33  | Task History completo                   | `TaskHistoryPanel`, `task_history` table                                  |
| 34  | Task Time Metrics                       | `TaskTimeMetrics`, `useTaskMetrics`                                       |
| 35  | Permissões granulares                   | `user_permissions` table, `PermissionsManagement`, `useReadOnly`          |
| 36  | Roles (Master, Admin, User, Viewer)     | `user_roles`, `workspace_role`, `project_role`                            |
| 37  | Convites com token                      | `InviteUserDialog`, `AcceptInvitation`, `invitations` table               |
| 38  | Workspaces múltiplos                    | `CreateWorkspaceDialog`, `WorkspaceContext`, limites por plano            |
| 39  | Categorias de projeto                   | `CategoriesManagement`, `categories` table                                |
| 40  | Enterprise "Fale Conosco"               | `EnterpriseContact` page, `send-enterprise-contact` edge function         |
| 41  | Página de Pricing pública               | `Pricing` page com preços dinâmicos do Stripe                             |
| 42  | Dashboard com reports compactos         | `DashboardReportCards` com velocity, CFD, cycle time, performance         |

---

## 4. Features Sugeridas — Ainda Não Implementadas

### 4.1 Integrações Externas

#### GitHub Integration

- **Prioridade:** Alta
- **Impacto:** Vincular commits/PRs a tarefas; auto-mover status ao mergear PR
- **Como implementar:**
  - Edge function `github-webhook` para receber eventos (push, PR opened/merged)
  - Tabela `integrations` com `{ workspace_id, provider, config, access_token }`
  - OAuth flow via Lovable Cloud connector ou configuração manual de webhook URL
  - UI: Campo "GitHub PR" no card da tarefa; botão de link no `TaskDetailsDialog`
- **Impacto Stripe:** Gated por plano (Professional+). Adicionar `"github_integration": true` no JSON `features` dos planos.

#### Slack Integration

- **Prioridade:** Média
- **Impacto:** Notificações de mudanças em canal Slack; comandos `/ale status`
- **Como implementar:**
  - Edge function `slack-notify` usando Slack Incoming Webhooks (mais simples) ou Bot API (mais robusto)
  - Configuração por workspace: URL do webhook ou Bot Token
  - Disparar junto com `send-task-notification` existente
- **Impacto Stripe:** Gated por plano (Starter+). Feature flag no `features` JSON.

### 4.2 SSO Corporativo

- **Prioridade:** Média-Alta (Enterprise)
- **Impacto:** Login via provedor corporativo (Google Workspace, Azure AD, Okta)
- **Como implementar:**
  - Lovable Cloud já suporta OAuth (Google, GitHub, Azure) via configuração de auth
  - Para SAML: requer configuração avançada no provedor de auth
  - UI: Seção "SSO" em Settings do Workspace
- **Impacto Stripe:** Exclusivo Enterprise. Configurado manualmente conforme `docs/ENTERPRISE.md`.

### 4.3 Time Tracking Nativo

- **Prioridade:** Alta
- **Impacto:** Timer integrado na tarefa; relatórios de horas; produtividade
- **Como implementar:**
  - Nova tabela `time_entries`:
    ```sql
    CREATE TABLE public.time_entries (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
      user_id uuid NOT NULL,
      started_at timestamptz NOT NULL,
      ended_at timestamptz,
      duration_minutes integer,
      description text,
      created_at timestamptz DEFAULT now()
    );
    ```
  - Hook `useTimeTracking` com timer local + sync ao pausar/parar
  - Componente `TaskTimer` no `TaskDetailsDialog` e `KanbanTaskCard`
  - Reports: Relatório de horas por membro, projeto, sprint
- **Impacto Stripe:** Gated por plano (Professional+). Adicionar `"time_tracking": true` no `features` JSON.
- **Novas permissões:** `can_track_time`, `can_view_time_reports` no `user_permissions`.

### 4.4 Automações (Rules Engine)

- **Prioridade:** Média
- **Impacto:** "Quando X acontecer, faça Y" (ex: mover para Done → notificar owner)
- **Como implementar:**
  - Nova tabela `automation_rules`:
    ```sql
    CREATE TABLE public.automation_rules (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
      project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
      name text NOT NULL,
      trigger_event text NOT NULL, -- 'task_status_changed', 'task_assigned', etc.
      conditions jsonb DEFAULT '{}',
      actions jsonb NOT NULL, -- [{ "type": "notify", "config": {...} }]
      is_active boolean DEFAULT true,
      created_by uuid NOT NULL,
      created_at timestamptz DEFAULT now()
    );
    ```
  - Edge function `run-automation` chamada por database trigger ou via hook
  - UI: Página "Automações" com builder visual (trigger → condition → action)
- **Impacto Stripe:** Gated por plano. Free: 0 automações. Starter: 5. Professional: 25. Enterprise: ilimitado.
- **Novas permissões:** `can_manage_automations` no `user_permissions`.

### 4.5 Custom Dashboards

- **Prioridade:** Baixa
- **Impacto:** Dashboards montáveis com widgets drag-and-drop
- **Como implementar:**
  - Tabela `dashboard_layouts` com config JSON (widgets, posições, tamanhos)
  - Usar `react-grid-layout` ou `react-resizable-panels` (já instalado)
  - Widgets disponíveis: os mesmos charts compactos que já existem
- **Impacto Stripe:** Gated por plano (Professional+). Dashboards custom como feature premium.

### 4.6 Importador de Boards (Trello/Asana)

- **Prioridade:** Média-Alta
- **Impacto:** Reduz barreira de entrada; facilita migração de concorrentes
- **Como implementar:**
  - Edge function `import-board` que aceita JSON exportado do Trello (`.json`) ou CSV do Asana
  - Parser que mapeia:
    - Trello lists → ALE columns
    - Trello cards → ALE tasks
    - Trello labels → ALE categories
    - Trello checklists → ALE subtasks
  - UI: Botão "Importar" na página de projetos com upload de arquivo
- **Impacto Stripe:** Disponível para todos os planos (incentiva adoção). Sem impacto no Stripe.

### 4.7 Templates Setoriais Expandidos

- **Prioridade:** Baixa
- **Impacto:** Onboarding mais rápido; percepção de valor imediato
- **Como implementar:**
  - Expandir seed data no trigger `seed_default_templates_for_workspace`
  - Adicionar templates para: Agência Digital, Consultoria, Produto SaaS, Operações, RH, Suporte
  - Cada template com: colunas, categorias, WIP limits e tarefas exemplo
- **Impacto Stripe:** Sem impacto. Templates básicos para todos; templates premium para planos pagos.

### 4.8 Export PDF

- **Prioridade:** Média
- **Impacto:** Relatórios profissionais para stakeholders
- **Como implementar:**
  - Edge function `generate-pdf-report` usando `jspdf` ou serviço headless (Puppeteer)
  - Gerar PDF server-side com os mesmos dados do `useReportData`
  - Incluir: logo, gráficos (como imagens estáticas), tabelas, métricas
  - Alternativa mais simples: usar `window.print()` com CSS `@media print` otimizado
- **Impacto Stripe:** Gated por plano (Starter+). Adicionar `"pdf_export": true` no `features`.

### 4.9 Multi-idioma (i18n)

- **Prioridade:** Média-Alta
- **Impacto:** Abertura para mercado internacional; profissionalismo
- **Como implementar:**
  - Instalar `react-i18next` + `i18next`
  - Criar arquivos de tradução: `src/locales/pt-BR.json`, `src/locales/en.json`
  - Wrapper `I18nProvider` no `App.tsx`
  - Substituir strings hardcoded por `t('key')` progressivamente
  - Seletor de idioma no header ou Settings
- **Impacto Stripe:** Sem impacto direto. Feature disponível para todos.
- **Esforço:** Alto (centenas de strings para traduzir), mas pode ser feito incrementalmente.

### 4.10 Modo Offline (PWA Enhanced)

- **Prioridade:** Baixa
- **Impacto:** Uso sem internet; sync ao reconectar
- **Como implementar:**
  - Workbox `StaleWhileRevalidate` para assets estáticos (já parcial no SW)
  - `NetworkFirst` para API calls com fallback para IndexedDB
  - Queue de ações offline (criar task, mover, comentar) → sync ao reconectar
  - Biblioteca: `workbox-background-sync` (já tem `workbox-precaching`)
- **Impacto Stripe:** Feature premium (Professional+).

### 4.11 API Pública

- **Prioridade:** Média
- **Impacto:** Integrações custom; automações externas; ecossistema
- **Como implementar:**
  - Edge functions com autenticação via API Key (nova tabela `api_keys`)
  - Endpoints REST: `/tasks`, `/projects`, `/sprints`, `/members`
  - Rate limiting via counter no banco
  - Documentação OpenAPI/Swagger auto-gerada
- **Impacto Stripe:** Gated por plano. Free: sem API. Starter: 100 req/dia. Professional: 5.000/dia. Enterprise: ilimitado.

### 4.12 Webhooks Outgoing

- **Prioridade:** Baixa-Média
- **Impacto:** Notificar sistemas externos sobre eventos no ALE
- **Como implementar:**
  - Tabela `webhook_endpoints` com `{ url, events[], secret, workspace_id }`
  - Trigger/function que dispara POST para URLs registradas ao ocorrer evento
  - Retry com backoff exponencial via edge function
- **Impacto Stripe:** Gated por plano (Professional+).

---

## 5. Análise de Impacto no Stripe / Produção

### 5.1 Features que NÃO afetam planos (disponível para todos)

| Feature                     | Razão                        |
| --------------------------- | ---------------------------- |
| Importador de boards        | Incentiva adoção e migração  |
| Templates setoriais básicos | Melhora onboarding           |
| Multi-idioma (i18n)         | Experiência base do produto  |
| Melhorias de UI/UX          | Valor para todos os usuários |

### 5.2 Features que devem ser GATED por plano

| Feature            | Free | Starter     | Professional  | Enterprise |
| ------------------ | ---- | ----------- | ------------- | ---------- |
| Time Tracking      | ❌   | ❌          | ✅            | ✅         |
| GitHub Integration | ❌   | ❌          | ✅            | ✅         |
| Slack Integration  | ❌   | ✅          | ✅            | ✅         |
| Automações         | 0    | 5           | 25            | Ilimitado  |
| Export PDF         | ❌   | ✅          | ✅            | ✅         |
| Custom Dashboards  | ❌   | ❌          | ✅            | ✅         |
| API Pública        | ❌   | 100 req/dia | 5.000 req/dia | Ilimitado  |
| Webhooks Outgoing  | ❌   | ❌          | ✅            | ✅         |
| Modo Offline       | ❌   | ❌          | ✅            | ✅         |
| SSO (SAML)         | ❌   | ❌          | ❌            | ✅         |

**Implementação no Stripe:** Adicionar flags ao JSON `features` da tabela `subscription_plans`. Exemplo:

```json
{
  "time_tracking": true,
  "github_integration": true,
  "max_automations": 25,
  "pdf_export": true,
  "api_requests_per_day": 5000,
  "offline_mode": true
}
```

**Não é necessário criar novos produtos no Stripe** — apenas atualizar os metadados de features nos planos existentes na tabela `subscription_plans`.

### 5.3 Features que podem virar ADD-ONS no Stripe

Para cenários futuros onde o cliente quer uma feature específica sem mudar de plano:

| Add-on             | Preço sugerido      | Implementação                                              |
| ------------------ | ------------------- | ---------------------------------------------------------- |
| Time Tracking Pack | +R$5/user/mês       | Novo produto no Stripe com metadata `addon: time_tracking` |
| GitHub Integration | +R$10/workspace/mês | Novo produto no Stripe                                     |
| API Access         | +R$15/workspace/mês | Novo produto no Stripe                                     |

**Nota:** Add-ons requerem lógica adicional no webhook para gerenciar múltiplas subscriptions por usuário.

---

## 6. Posicionamento de Preço vs Mercado

### Comparação de preços (USD/usuário/mês)

| Tier          | ALE (BRL→USD aprox.) | Jira   | Asana  | ClickUp | Monday | Trello |
| ------------- | -------------------- | ------ | ------ | ------- | ------ | ------ |
| Free          | $0                   | $0     | $0     | $0      | $0     | $0     |
| Starter/Basic | ~$4-6                | $8.60  | $10.99 | $7      | $14    | $5     |
| Standard/Pro  | ~$7-10               | —      | $24.99 | $12     | $27    | $10    |
| Professional  | ~$12-15              | —      | —      | —       | —      | $17.50 |
| Enterprise    | Custom               | Custom | Custom | Custom  | Custom | Custom |

### Vantagens competitivas de preço

1. **Preço em BRL** — elimina flutuação cambial para clientes brasileiros
2. **Sem mínimo de assentos** — Monday exige mínimo de 3; ALE aceita 1
3. **Downgrade com carência de 7 dias** — nenhum concorrente oferece isso (CDC brasileiro)
4. **Scrum+Kanban nativo** — Trello e Notion não oferecem; Asana é limitado
5. **PWA installable** — nenhum concorrente é PWA

---

## 7. Roadmap Sugerido — Próximas Fases

### Fase 5 — Integrações & Migração (Impacto alto, esforço médio)

| #   | Feature                          | Esforço  | Prioridade |
| --- | -------------------------------- | -------- | ---------- |
| 1   | Importador Trello/Asana          | 2-3 dias | 🔴 Alta    |
| 2   | Multi-idioma (i18n) - pt-BR + en | 5-7 dias | 🔴 Alta    |
| 3   | Export PDF                       | 2-3 dias | 🟡 Média   |
| 4   | Templates setoriais expandidos   | 1-2 dias | 🟡 Média   |

### Fase 6 — Produtividade (Impacto alto, esforço alto)

| #   | Feature              | Esforço   | Prioridade |
| --- | -------------------- | --------- | ---------- |
| 5   | Time Tracking nativo | 5-7 dias  | 🔴 Alta    |
| 6   | Automações básicas   | 7-10 dias | 🟡 Média   |
| 7   | GitHub Integration   | 5-7 dias  | 🟡 Média   |
| 8   | Slack Integration    | 3-5 dias  | 🟡 Média   |

### Fase 7 — Enterprise & Escala (Impacto médio, esforço alto)

| #   | Feature               | Esforço   | Prioridade |
| --- | --------------------- | --------- | ---------- |
| 9   | API Pública           | 7-10 dias | 🟡 Média   |
| 10  | SSO Corporativo       | 3-5 dias  | 🟢 Baixa   |
| 11  | Custom Dashboards     | 7-10 dias | 🟢 Baixa   |
| 12  | Webhooks Outgoing     | 3-5 dias  | 🟢 Baixa   |
| 13  | Modo Offline Enhanced | 7-10 dias | 🟢 Baixa   |

### Estimativa total: 8-12 semanas (Fases 5-7)

---

## 8. Conclusão

O ALE alcançou **paridade funcional com Trello** e **supera Notion/Monday em funcionalidades Scrum**. Está próximo de competir com Jira/ClickUp em features core, com os diferenciais de:

- ✅ **Preço em BRL** (único no mercado)
- ✅ **Downgrade com carência CDC** (diferencial regulatório)
- ✅ **PWA installable** (experiência mobile superior)
- ✅ **IA para priorização** (diferencial tecnológico)
- ✅ **Interface em PT-BR** (foco no mercado brasileiro)

Os **gaps principais** vs líderes de mercado são:

- ❌ Integrações (GitHub, Slack)
- ❌ Time Tracking
- ❌ Automações
- ❌ Multi-idioma
- ❌ API pública

A prioridade recomendada é **Fase 5** (Importador + i18n + PDF), que gera alto impacto na adoção com esforço moderado, seguida por **Fase 6** (Time Tracking + Automações), que agrega valor premium para justificar planos pagos.
