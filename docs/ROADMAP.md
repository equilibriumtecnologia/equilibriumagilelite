# Roadmap de Implementação - Agile Lite Equilibrium

Este documento detalha as novas funcionalidades a serem implementadas, organizadas por fases e prioridade.

---

## 📋 Índice

1. [Fase 1 - Quick Wins](#fase-1---quick-wins)
2. [Fase 2 - Sistema de Sprints](#fase-2---sistema-de-sprints)
3. [Fase 3 - Analytics e Reports](#fase-3---analytics-e-reports)
4. [Fase 4 - Colaboração Avançada](#fase-4---colaboração-avançada)
5. [Fase 5 - Diferenciais Competitivos](#fase-5---diferenciais-competitivos)
6. [Fase 6 - Monetização](#fase-6---monetização)

---

## Fase 1 - Quick Wins

**Objetivo:** Melhorias de alta prioridade com baixo esforço de implementação.
**Prazo Estimado:** 2-3 semanas

### 1.1 WIP Limits por Coluna

**Descrição:** Implementar limite de Work In Progress por coluna do Kanban.

**Mudanças no Banco de Dados:**
```sql
-- Adicionar tabela de configuração de board
CREATE TABLE public.board_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  column_id TEXT NOT NULL, -- 'todo', 'in_progress', 'review', 'completed'
  wip_limit INTEGER DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, column_id)
);
```

**Componentes a Criar:**
- `src/components/kanban/WipLimitBadge.tsx` - Badge visual do limite
- `src/components/kanban/WipLimitDialog.tsx` - Dialog para configurar limites
- `src/hooks/useBoardSettings.ts` - Hook para gerenciar configurações

**Comportamento:**
- Exibir badge com `X/Y` onde X é atual e Y é limite
- Mudar cor para warning quando atingir 80%
- Mudar cor para error quando exceder
- Bloquear drag opcional quando exceder (configurável)

---

### 1.2 Story Points nas Tarefas

**Descrição:** Adicionar campo de estimativa em pontos para cada tarefa.

**Mudanças no Banco de Dados:**
```sql
ALTER TABLE public.tasks
ADD COLUMN story_points INTEGER DEFAULT NULL;

-- Adicionar ao histórico
-- Valor 'story_points_changed' já pode usar old_value/new_value existentes
```

**Componentes a Modificar:**
- `CreateTaskDialog.tsx` - Adicionar campo story_points
- `EditTaskDialog.tsx` - Adicionar campo story_points
- `TaskDetailsDialog.tsx` - Exibir story_points
- `KanbanTaskCard.tsx` - Badge de pontos
- `TaskCard.tsx` - Exibir pontos

**Escala de Pontos:**
- Fibonacci: 1, 2, 3, 5, 8, 13, 21
- Seletor visual com cards clicáveis

---

### 1.3 Filtros Avançados no Kanban

**Descrição:** Adicionar barra de filtros no Kanban Board.

**Componentes a Criar:**
- `src/components/kanban/KanbanFilters.tsx`

**Filtros Disponíveis:**
- Por responsável (multi-select)
- Por prioridade (multi-select)
- Por prazo (vencidas, hoje, esta semana, futuras)
- Por story points (range)
- Busca por texto

**Comportamento:**
- Filtros persistem na URL (query params)
- Contador de filtros ativos
- Botão "Limpar filtros"

---

### 1.4 Colunas Customizáveis (Labels)

**Descrição:** Permitir customizar nomes e cores das colunas.

**Mudanças no Banco de Dados:**
```sql
ALTER TABLE public.board_settings
ADD COLUMN label TEXT DEFAULT NULL,
ADD COLUMN color TEXT DEFAULT NULL;
```

**Comportamento:**
- Manter status enum no backend
- Exibir label customizado na UI
- Cores personalizáveis por projeto

---

## Fase 2 - Sistema de Sprints

**Objetivo:** Implementar funcionalidades Scrum sobre o Kanban existente.
**Prazo Estimado:** 3-4 semanas

### 2.1 Tabela de Sprints

**Mudanças no Banco de Dados:**
```sql
CREATE TYPE sprint_status AS ENUM ('planning', 'active', 'completed', 'cancelled');

CREATE TABLE public.sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  goal TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status sprint_status DEFAULT 'planning',
  velocity INTEGER DEFAULT NULL, -- Calculado ao fechar
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar referência na task
ALTER TABLE public.tasks
ADD COLUMN sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL;
```

**Componentes a Criar:**
- `src/pages/Sprints.tsx` - Página de gestão de sprints
- `src/components/sprints/SprintCard.tsx`
- `src/components/sprints/CreateSprintDialog.tsx`
- `src/components/sprints/SprintBoardHeader.tsx`
- `src/hooks/useSprints.ts`

---

### 2.2 Página de Backlog

**Descrição:** Área centralizada para tarefas não alocadas em sprints.

**Componentes a Criar:**
- `src/pages/Backlog.tsx`
- `src/components/backlog/BacklogList.tsx`
- `src/components/backlog/BacklogItem.tsx`
- `src/components/backlog/BacklogFilters.tsx`

**Funcionalidades:**
- Lista vertical de todas as tarefas sem sprint
- Drag-and-drop para reordenar prioridade
- Seleção múltipla para mover para sprint
- Filtros por projeto, prioridade, responsável
- Estimativa total de pontos selecionados

**Campo de Ordenação:**
```sql
ALTER TABLE public.tasks
ADD COLUMN backlog_order INTEGER DEFAULT 0;
```

---

### 2.3 Sprint Planning View

**Descrição:** Interface para planejamento de sprint.

**Componentes a Criar:**
- `src/components/sprints/SprintPlanningDialog.tsx`
- `src/components/sprints/SprintCapacity.tsx`

**Funcionalidades:**
- Split view: Backlog | Sprint
- Drag tasks do backlog para sprint
- Exibir capacity (pontos planejados vs média de velocity)
- Definir goal da sprint
- Confirmar e iniciar sprint

---

### 2.4 Swimlanes por Sprint

**Descrição:** Opção de visualizar board agrupado por sprint.

**Modificações:**
- `KanbanBoard.tsx` - Adicionar modo swimlane
- Agrupar tarefas por sprint_id
- Expandir/colapsar swimlanes

---

## Fase 3 - Analytics e Reports

**Objetivo:** Dashboard analítico com métricas de performance.
**Prazo Estimado:** 4-5 semanas

### 3.1 Página de Reports

**Componentes a Criar:**
- `src/pages/Reports.tsx`
- `src/components/reports/ReportFilters.tsx`
- `src/components/reports/DateRangePicker.tsx`

**Filtros Globais:**
- Período (últimos 7/30/90 dias, custom)
- Projeto(s)
- Membro(s)

---

### 3.2 Burndown Chart

**Componentes a Criar:**
- `src/components/reports/BurndownChart.tsx`

**Dados Necessários:**
```sql
-- View para burndown
CREATE VIEW sprint_burndown AS
SELECT 
  sprint_id,
  DATE(created_at) as date,
  SUM(story_points) FILTER (WHERE status != 'completed') as remaining_points
FROM tasks
WHERE sprint_id IS NOT NULL
GROUP BY sprint_id, DATE(created_at);
```

**Visualização:**
- Linha ideal (linear do total até 0)
- Linha real (pontos restantes por dia)
- Área de scope creep se houver adições

---

### 3.3 Velocity Chart

**Componentes a Criar:**
- `src/components/reports/VelocityChart.tsx`

**Dados:**
- Pontos concluídos por sprint
- Média móvel das últimas 3-5 sprints
- Tendência (crescente/estável/decrescente)

---

### 3.4 Cumulative Flow Diagram (CFD)

**Componentes a Criar:**
- `src/components/reports/CumulativeFlowChart.tsx`

**Dados Necessários:**
```sql
-- Snapshot diário de status
CREATE TABLE public.task_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  snapshot_date DATE NOT NULL,
  todo_count INTEGER DEFAULT 0,
  in_progress_count INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Edge function para criar snapshot diário
```

**Visualização:**
- Área empilhada por status ao longo do tempo
- Identificar gargalos (áreas que crescem sem drenar)

---

### 3.5 Cycle Time e Lead Time

**Componentes a Criar:**
- `src/components/reports/CycleTimeChart.tsx`
- `src/components/reports/LeadTimeChart.tsx`

**Métricas:**
- **Lead Time:** Tempo desde criação até conclusão
- **Cycle Time:** Tempo desde início (in_progress) até conclusão

**Visualização:**
- Histograma de distribuição
- Média, mediana e percentis (p85, p95)
- Tendência ao longo do tempo

---

### 3.6 Team Performance Dashboard

**Componentes a Criar:**
- `src/components/reports/TeamPerformance.tsx`

**Métricas por Membro:**
- Tarefas concluídas
- Story points entregues
- Cycle time médio
- Taxa de conclusão

---

### 3.7 Export de Relatórios

**Componentes a Criar:**
- `src/components/reports/ExportDialog.tsx`
- `supabase/functions/generate-report-pdf/index.ts`

**Formatos:**
- CSV (dados tabulares)
- PDF (relatório formatado com gráficos)

---

## Fase 4 - Colaboração Avançada

**Objetivo:** Melhorar a colaboração entre membros da equipe.
**Prazo Estimado:** 2-3 semanas

### 4.1 Comentários em Tarefas

**Mudanças no Banco de Dados:**
```sql
CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES task_comments(id), -- Para replies
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Componentes a Criar:**
- `src/components/tasks/TaskComments.tsx`
- `src/components/tasks/CommentItem.tsx`
- `src/components/tasks/CommentInput.tsx`
- `src/hooks/useTaskComments.ts`

---

### 4.2 Sistema de @Menções

**Comportamento:**
- Autocomplete ao digitar @
- Listar membros do projeto
- Criar notificação ao mencionar
- Highlight de menções no texto

**Componentes a Criar:**
- `src/components/ui/mention-input.tsx`

---

### 4.3 Notificações In-App

**Mudanças no Banco de Dados:**
```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  type TEXT NOT NULL, -- 'mention', 'assignment', 'status_change', etc.
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Componentes a Criar:**
- `src/components/layout/NotificationBell.tsx`
- `src/components/layout/NotificationDropdown.tsx`
- `src/hooks/useNotifications.ts`

**Tipos de Notificação:**
- Menção em comentário
- Atribuição de tarefa
- Mudança de status
- Tarefa próxima do prazo
- Sprint iniciando/finalizando

---

### 4.4 Activity Feed

**Componentes a Criar:**
- `src/components/activity/ActivityFeed.tsx`
- `src/components/activity/ActivityItem.tsx`

**Localização:**
- Dashboard (atividade recente global)
- Projeto (atividade do projeto)
- Tarefa (já existe como histórico)

---

## Fase 5 - Diferenciais Competitivos

**Objetivo:** Funcionalidades que diferenciam dos concorrentes.
**Prazo Estimado:** 6-8 semanas

### 5.1 IA para Priorização

**Descrição:** Sugestões automáticas de priorização baseadas em padrões.

**Componentes a Criar:**
- `src/components/ai/PrioritySuggestion.tsx`
- `supabase/functions/ai-prioritize/index.ts`

**Algoritmo considera:**
- Prazo da tarefa
- Criticidade do projeto
- Story points
- Dependências implícitas (menções)
- Padrões históricos de conclusão

**UI:**
- Badge "IA Suggest" na tarefa
- Tooltip explicando raciocínio
- Botão para aceitar/rejeitar sugestão

---

### 5.2 Previsão de Entrega

**Componentes a Criar:**
- `src/components/reports/DeliveryForecast.tsx`

**Baseado em:**
- Velocity histórica
- Story points restantes
- Tendência de velocity

**Exibição:**
- Data estimada de conclusão
- Intervalo de confiança (pessimista/otimista)
- Simulação Monte Carlo opcional

---

### 5.3 Bottleneck Detection

**Componentes a Criar:**
- `src/components/reports/BottleneckAlert.tsx`
- `src/components/kanban/ColumnHealthIndicator.tsx`

**Detecção:**
- Colunas com crescimento sem saída
- Tarefas paradas há muito tempo
- Membros sobrecarregados

**Alertas:**
- Banner no board
- Notificação in-app
- Email semanal de health check

---

### 5.4 Templates de Projeto

**Mudanças no Banco de Dados:**
```sql
CREATE TABLE public.project_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'development', 'marketing', 'custom'
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  config JSONB NOT NULL, -- Estrutura de colunas, tarefas padrão, etc.
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Templates Iniciais:**
- **Desenvolvimento:** Sprints, code review, deploy
- **Marketing:** Campanhas, conteúdo, social media
- **Genérico:** Básico Kanban

---

### 5.5 Integrações (Webhooks Base)

**Mudanças no Banco de Dados:**
```sql
CREATE TABLE public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL, -- ['task.created', 'task.completed', etc.]
  is_active BOOLEAN DEFAULT true,
  secret TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Edge Function:**
- `supabase/functions/webhook-dispatcher/index.ts`

**Eventos Disponíveis:**
- `task.created`, `task.updated`, `task.deleted`
- `task.status_changed`, `task.assigned`
- `sprint.started`, `sprint.completed`
- `comment.added`

---

## Fase 6 - Monetização

**Objetivo:** Implementar sistema de planos e billing.
**Prazo Estimado:** 4-5 semanas

### 6.1 Sistema de Planos

**Planos Propostos:**

| Recurso | Free | Pro | Business |
|---------|------|-----|----------|
| Projetos | 3 | 10 | Ilimitado |
| Membros por projeto | 3 | 10 | Ilimitado |
| Histórico | 30 dias | 1 ano | Ilimitado |
| Sprints | ❌ | ✅ | ✅ |
| Reports | Básico | Completo | Completo + Export |
| Integrações | ❌ | 3 | Ilimitado |
| IA | ❌ | ❌ | ✅ |
| Suporte | Community | Email | Prioritário |

**Mudanças no Banco de Dados:**
```sql
CREATE TYPE plan_type AS ENUM ('free', 'pro', 'business', 'enterprise');

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) UNIQUE,
  plan plan_type DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  projects_count INTEGER DEFAULT 0,
  members_count INTEGER DEFAULT 0,
  storage_bytes BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 6.2 Integração Stripe

**Componentes a Criar:**
- `src/pages/Pricing.tsx`
- `src/pages/Billing.tsx`
- `src/components/billing/PlanCard.tsx`
- `src/components/billing/UpgradeDialog.tsx`
- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/stripe-webhook/index.ts`

**Fluxo:**
1. Usuário seleciona plano
2. Redirect para Stripe Checkout
3. Webhook atualiza subscription
4. Usuário retorna com acesso liberado

---

### 6.3 Limite de Uso e Upselling

**Componentes a Criar:**
- `src/components/billing/UsageMeter.tsx`
- `src/components/billing/UpgradePrompt.tsx`

**Comportamento:**
- Mostrar uso atual vs limite
- Soft block quando atingir limite
- CTA para upgrade

---

## 📅 Cronograma Resumido

| Fase | Duração | Início | Features Principais |
|------|---------|--------|---------------------|
| 1 | 2-3 sem | Imediato | WIP, Points, Filtros |
| 2 | 3-4 sem | +3 sem | Sprints, Backlog |
| 3 | 4-5 sem | +7 sem | Reports, Charts |
| 4 | 2-3 sem | +12 sem | Comments, @Mentions |
| 5 | 6-8 sem | +15 sem | IA, Templates |
| 6 | 4-5 sem | +22 sem | Billing, Planos |

**Tempo Total Estimado:** ~27 semanas (6-7 meses)

---

## 🎯 Métricas de Sucesso

### KPIs por Fase

| Fase | Métrica | Target |
|------|---------|--------|
| 1 | Engajamento Kanban | +30% uso diário |
| 2 | Adoção Sprints | 50% projetos com sprint |
| 3 | Visualização Reports | 40% usuários ativos |
| 4 | Comentários/Semana | 5+ por projeto ativo |
| 5 | Uso IA Priorização | 30% tarefas com sugestão |
| 6 | Conversão Free→Paid | 5-10% |

---

## 📝 Notas de Implementação

### Prioridades Técnicas

1. **Performance:** Implementar paginação e virtualização para listas grandes
2. **Real-time:** Usar Supabase Realtime para updates colaborativos
3. **Caching:** React Query com stale-while-revalidate
4. **Testes:** Adicionar testes E2E para fluxos críticos
5. **Acessibilidade:** WCAG 2.1 AA compliance

### Débitos Técnicos a Resolver

1. Refatorar hooks de tarefas para melhor composição
2. Implementar error boundaries
3. Adicionar loading skeletons consistentes
4. Melhorar tipagem de responses do Supabase
5. Documentar componentes com Storybook

---

## 🚀 Conclusão

Este roadmap transforma o Agile Lite Equilibrium de um sistema Kanban básico em uma plataforma completa de gestão ágil híbrida, competindo com soluções como Jira e Trello, mas com foco em:

1. **Simplicidade** - Interface limpa e intuitiva
2. **Flexibilidade** - Kanban + Scrum configurável
3. **Mercado Local** - Foco em PMEs brasileiras
4. **IA Assistiva** - Priorização e previsões inteligentes

A implementação em fases permite:
- Entregar valor incremental
- Validar funcionalidades com usuários
- Ajustar prioridades conforme feedback
- Manter qualidade técnica
