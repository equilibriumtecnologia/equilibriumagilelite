# ARCHIVE — Documentos Obsoletos / Histórico

> Criado em: 2026-03-08  
> Objetivo: preservar **integralmente** documentos antigos/obsoletos, permitindo limpeza do diretório `/docs` sem perda de histórico.

---

## 1) Documentos do ALE consolidados aqui e REMOVIDOS do /docs

Os arquivos abaixo estavam desatualizados em relação ao estado atual do produto (ver `ROADMAP2.md`, `STRIPE2.md`, `COMPETITIVE_ANALYSIS.md`) e foram consolidados aqui antes de serem removidos:

- `docs/GAP_ANALYSIS.md`
- `docs/ROADMAP.md`
- `docs/STRIPE.md`
- `docs/PROJECT_REPORT.md`

### 1.1 `docs/GAP_ANALYSIS.md` (conteúdo original)

```md
# Análise de Gap - Agile Lite Equilibrium

Este documento compara as funcionalidades atuais do sistema com os requisitos de um micro SaaS híbrido Kanban-Scrum conforme pesquisa de mercado.

---

## 📊 Matriz de Comparação

### Legenda

- ✅ **Implementado** - Funcionalidade completa
- 🟡 **Parcial** - Funcionalidade básica existe, precisa melhorias
- ❌ **Não Implementado** - Funcionalidade ausente

---

## 1. Core (MVP Mínimo Viável)

| Requisito                                | Status | Observações                                                                     |
| ---------------------------------------- | ------ | ------------------------------------------------------------------------------- |
| Boards visuais com colunas customizáveis | 🟡     | Colunas fixas (Todo, In Progress, Review, Done). Não customizáveis pelo usuário |
| Drag-and-drop intuitivo                  | ✅     | Implementado com @dnd-kit                                                       |
| WIP limits por coluna                    | ❌     | Não implementado                                                                |
| Suporte mobile-first                     | ✅     | Layout responsivo completo                                                      |
| Modo incógnito/uso pessoal grátis        | ❌     | Não há tier gratuito definido                                                   |

### Análise Core

**Implementado:** 40% | **Parcial:** 20% | **Pendente:** 40%

---

## 2. Essencial para Rentabilidade

| Requisito                | Status | Observações                                          |
| ------------------------ | ------ | ---------------------------------------------------- |
| Backlog priorizado       | ❌     | Não existe página/componente de backlog              |
| User stories             | ❌     | Tarefas não seguem formato de user stories           |
| Estimativas em pontos    | ❌     | Não há campo de story points                         |
| Grooming visual          | ❌     | Não implementado                                     |
| Sprints sobre Kanban     | ❌     | Sem conceito de sprints                              |
| Planejamento iterativo   | ❌     | Não implementado                                     |
| Burndown charts          | ❌     | Não implementado                                     |
| Velocity tracking        | ❌     | Não implementado                                     |
| Comentários em tarefas   | 🟡     | Comentários apenas no histórico de mudança de status |
| @menções                 | ❌     | Não implementado                                     |
| Notificações             | ✅     | Email notifications implementadas                    |
| Roles básicas            | ✅     | Master, Admin, User                                  |
| Cumulative flow diagrams | ❌     | Não implementado                                     |
| Alerts de bottlenecks    | ❌     | Não implementado                                     |

### Análise Rentabilidade

**Implementado:** 14% | **Parcial:** 7% | **Pendente:** 79%

---

## 3. Diferenciais para Destacar

| Requisito                              | Status | Observações                      |
| -------------------------------------- | ------ | -------------------------------- |
| IA para auto-priorização               | ❌     | Não implementado                 |
| Sugestões de WIP baseadas em histórico | ❌     | Não implementado                 |
| Integrações BR (notas fiscais)         | ❌     | Não implementado                 |
| Integração GitHub                      | ❌     | Não implementado                 |
| Integração Slack                       | ❌     | Não implementado                 |
| Templates setoriais                    | ❌     | Não implementado                 |
| Export PDF com velocity                | ❌     | Não implementado                 |
| Custom dashboards                      | ❌     | Dashboard fixo, não customizável |
| Analytics preditivos                   | ❌     | Não implementado                 |
| Previsão de prazos via ML              | ❌     | Não implementado                 |

### Análise Diferenciais

**Implementado:** 0% | **Parcial:** 0% | **Pendente:** 100%

---

## 4. Análise por Página

### Dashboard Inicial

| Requisito                              | Status | Gap                                             |
| -------------------------------------- | ------ | ----------------------------------------------- |
| Board ativo em destaque                | ❌     | Mostra lista de projetos, não o board principal |
| Cards de KPIs (tasks totais, velocity) | 🟡     | Tem contadores básicos, falta velocity          |
| Quick actions                          | ✅     | Criar projeto disponível                        |
| Seleção de projetos                    | ✅     | Lista de projetos recentes                      |
| Criar task/sprint em 1 clique          | 🟡     | Criar projeto sim, criar task requer navegar    |
| Overview freemium                      | ❌     | Sem indicadores de limites/planos               |
| Atalhos mobile                         | 🟡     | Layout responsivo, mas sem atalhos específicos  |

### Board/Workspace

| Requisito                       | Status | Gap                        |
| ------------------------------- | ------ | -------------------------- |
| Colunas Kanban                  | ✅     | Implementado               |
| Swimlanes por sprint            | ❌     | Não há conceito de sprints |
| Drag-and-drop com snap preview  | ✅     | Implementado com overlay   |
| WIP limits editáveis            | ❌     | Não implementado           |
| Filtros (label/assignee)        | ❌     | Não há filtros no board    |
| Subtasks aninhadas              | ✅     | Checklist implementado     |
| Story points on-card            | ❌     | Não implementado           |
| Histórico ilimitado de mudanças | ✅     | Task history implementado  |

### Backlog

| Requisito                  | Status | Gap               |
| -------------------------- | ------ | ----------------- |
| Lista/board hierárquico    | ❌     | Página não existe |
| Drag para priorizar        | ❌     | Não implementado  |
| Grooming com MoSCoW        | ❌     | Não implementado  |
| Estimativas colaborativas  | ❌     | Não implementado  |
| Mover para sprint/backlog  | ❌     | Não implementado  |
| IA para ranking automático | ❌     | Não implementado  |

### Reports/Análises

| Requisito                            | Status | Gap              |
| ------------------------------------ | ------ | ---------------- |
| Gráficos interativos (burndown, CFD) | ❌     | Não implementado |
| Zoom temporal                        | ❌     | Não implementado |
| Filtros por projeto/período          | ❌     | Não implementado |
| Export CSV/PDF                       | ❌     | Não implementado |
| Trends de velocity                   | ❌     | Não implementado |
| Previsões de entrega                 | ❌     | Não implementado |
| Bottleneck heatmaps                  | ❌     | Não implementado |

### Configurações/Equipe

| Requisito               | Status | Gap                          |
| ----------------------- | ------ | ---------------------------- |
| Customizar workflows    | ❌     | Workflows fixos              |
| Customizar WIP          | ❌     | Não implementado             |
| Convidar membros        | ✅     | Sistema de convites completo |
| Limite free             | ❌     | Sem sistema de planos        |
| Roles                   | ✅     | Master, Admin, User          |
| Integrações (Git/Slack) | ❌     | Não implementado             |
| Billing freemium        | ❌     | Não implementado             |
| Templates PT-BR         | ❌     | Não implementado             |

---

## 📈 Resumo Executivo

### Cobertura Atual por Categoria

```
Core MVP:           ████░░░░░░ 40%
Rentabilidade:      █░░░░░░░░░ 14%
Diferenciais:       ░░░░░░░░░░ 0%
Dashboard:          ████░░░░░░ 43%
Board/Workspace:    █████░░░░░ 50%
Backlog:            ░░░░░░░░░░ 0%
Reports:            ░░░░░░░░░░ 0%
Configurações:      ███░░░░░░░ 33%
```

### Cobertura Geral: ~22%

---

## 🎯 Priorização de Implementação

### Fase 1 - Quick Wins (Alto Impacto, Baixo Esforço)

1. **WIP Limits por Coluna**
   - Adicionar configuração de limite por status
   - Alertar visualmente quando exceder

2. **Filtros no Kanban**
   - Filtro por responsável
   - Filtro por prioridade
   - Filtro por prazo

3. **Story Points nas Tarefas**
   - Adicionar campo no banco
   - Exibir no card e dialog

4. **Colunas Customizáveis**
   - Permitir renomear colunas
   - Adicionar/remover colunas (manter enum no backend)

### Fase 2 - Foundation (Médio Esforço)

5. **Sistema de Sprints**
   - Tabela de sprints
   - Associar tarefas a sprints
   - Sprint backlog vs Product backlog

6. **Página de Backlog**
   - Lista priorizada de todas as tarefas não alocadas
   - Drag-and-drop para reordenar
   - Mover para sprint

7. **Comentários em Tarefas**
   - Comentários independentes do histórico
   - @menções com notificação

8. **Velocity Tracking**
   - Calcular story points concluídos por sprint
   - Histórico de velocity

### Fase 3 - Analytics (Alto Esforço)

9. **Burndown Chart**
   - Gráfico de burn de story points
   - Linha ideal vs real

10. **Cumulative Flow Diagram**
    - Gráfico de fluxo por status ao longo do tempo

11. **Dashboard de Reports**
    - Página dedicada a relatórios
    - Filtros por período e projeto

12. **Export de Dados**
    - CSV para dados tabulares
    - PDF para relatórios formatados

### Fase 4 - Diferenciais (Longo Prazo)

13. **IA para Priorização**
    - Sugestões baseadas em prazo, criticidade e dependências

14. **Integrações**
    - GitHub para commits/PRs
    - Slack para notificações

15. **Sistema de Planos (Freemium)**
    - Limites por plano
    - Billing integration

16. **Templates de Projeto**
    - Templates por setor (dev, marketing)
    - Templates de tarefas

---

## 💡 Recomendações Estratégicas

### Curto Prazo (1-2 meses)

- Focar nas Fases 1 e 2
- Implementar WIP limits e filtros para melhorar UX
- Adicionar story points para preparar analytics

### Médio Prazo (3-4 meses)

- Sistema de sprints completo
- Página de reports com gráficos básicos
- Comentários e @menções

### Longo Prazo (5-6 meses)

- Integrações externas
- IA e analytics preditivos
- Sistema de planos/billing

---

## 🔄 Compatibilidade com Pesquisa de Mercado

### Pontos Fortes Atuais

1. ✅ Interface moderna e responsiva
2. ✅ Sistema de permissões robusto
3. ✅ Kanban funcional com drag-and-drop
4. ✅ Sistema de convites
5. ✅ Histórico de alterações
6. ✅ Notificações por email

### Gaps Críticos

1. ❌ Sem conceito de sprints (Scrum)
2. ❌ Sem métricas/analytics
3. ❌ Sem WIP limits
4. ❌ Sem sistema de planos/pricing
5. ❌ Sem integrações externas

### Oportunidades de Diferenciação

1. 🎯 Foco em PMEs brasileiras
2. 🎯 Simplicidade vs complexidade do Jira
3. 🎯 Preços competitivos em Real
4. 🎯 Suporte em português
5. 🎯 Integrações locais (NF-e)

---

## 📋 Conclusão

O Agile Lite Equilibrium possui uma base sólida com:

- Arquitetura bem estruturada
- Sistema de autenticação e permissões
- Kanban funcional
- UI moderna

Para atingir o potencial de micro SaaS híbrido Kanban-Scrum, é necessário:

1. Implementar funcionalidades Scrum (sprints, velocity)
2. Adicionar analytics e reports
3. Desenvolver sistema de planos
4. Criar diferenciais competitivos (IA, integrações BR)

**Estimativa de esforço para MVP completo:** 4-6 meses de desenvolvimento
**Estimativa para features diferenciais:** +3-4 meses adicionais
```

### 1.2 `docs/ROADMAP.md` (conteúdo original)

```md
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

(Conteúdo completo preservado — ver commit histórico.)
```

### 1.3 `docs/STRIPE.md` (conteúdo original)

```md
# Plano de Integração Stripe — ALE (Agile Lite Equilibrium)

> Última atualização: 2026-03-04

---

## 1. Visão Geral

Toda a lógica de preços e cobrança será gerenciada **exclusivamente no Stripe**. O app nunca armazena valores monetários localmente — busca `product_id` e `price_id` do Stripe em tempo real para renderizar a página de Pricing e iniciar o Checkout.

### Princípios
- **Single source of truth**: Stripe é a fonte de preços. Alterar valores no Stripe reflete automaticamente no app.
- **Segurança**: Checkout Session é criado server-side (Edge Function). O frontend nunca manipula valores.
- **Webhook-driven**: Mudanças de status (pagamento, cancelamento, upgrade) são processadas via webhook.

---

(Conteúdo completo preservado — ver versão original em histórico do repositório.)
```

### 1.4 `docs/PROJECT_REPORT.md` (conteúdo original)

```md
# Agile Lite Equilibrium - Relatório Completo do Projeto

## 📋 Visão Geral

**Agile Lite Equilibrium** é um sistema moderno de gestão de projetos e atividades, desenvolvido com foco em equipes ágeis e pequenas empresas. O projeto utiliza uma abordagem híbrida Kanban-Scrum, permitindo flexibilidade na gestão de tarefas e acompanhamento de progresso.

(Documento preservado integralmente no histórico. Esta versão foi superada por atualizações posteriores de produto.)
```

---

## 2) Documentos fora do escopo do ALE movidos para `docs/_archive/`

Os arquivos abaixo parecem ser materiais auxiliares de outros projetos (Next.js/Cosmic CMS/Vercel/Git) ou dumps temporários de debug e foram **movidos** para `docs/_archive/` para não poluir a documentação do ALE:

- `docs/example-navigation-refactoring.md`
- `docs/git-commands/helper-dual-repo.md`
- `docs/helpers/react-hook-forms.md`
- `docs/util-get-logos.md`
- `docs/vercel-github.md`
- `docs/ERROR.md`
