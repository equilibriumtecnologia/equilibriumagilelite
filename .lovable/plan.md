

# Plano: Documento Comparativo ALE vs Concorrentes + Correção de Build Errors

## Contexto

O projeto **Agile Lite Equilibrium (ALE)** evoluiu significativamente desde o GAP_ANALYSIS.md original. Muitas funcionalidades que estavam como "Não Implementado" já foram entregues. Além disso, existem **2 problemas de build** que precisam ser corrigidos junto com a criação do documento.

## O que será feito

### 1. Correção dos Build Errors

**Problema 1**: 9 edge functions usam `npm:@supabase/supabase-js@2.57.2` que não é resolvido no ambiente Deno. Trocar para import via `https://esm.sh/@supabase/supabase-js@2`.

**Problema 2**: `stripe-get-prices/index.ts` tem parâmetros `p` sem tipo. Adicionar tipo `Stripe.Price`.

**Arquivos afetados** (9 functions):
- `enforce-downgrade-queue`, `export-workspace-data`, `restore-downgrade`, `process-downgrade`, `swap-downgrade-items`, `stripe-create-checkout`, `stripe-webhook`, `stripe-sync-subscription`, `stripe-customer-portal`
- `stripe-get-prices` (erro de tipagem)

### 2. Criar `docs/COMPETITIVE_ANALYSIS.md`

Documento completo comparando:

**Estrutura do documento:**

1. **Resumo Executivo** — Cobertura atual atualizada (~85% do roadmap vs 22% do GAP original)

2. **Comparação por Concorrente** — Tabela funcionalidade a funcionalidade:
   - ALE vs Jira, Asana, ClickUp, Monday.com, Trello, Notion
   - Colunas: Feature | ALE | Jira | Asana | ClickUp | Monday | Trello | Notion

3. **Features Implementadas** (atualização do GAP):
   - Kanban com drag-and-drop, colunas customizáveis, WIP limits
   - Sprints completos (CRUD, planning, swimlanes)
   - Backlog com priorização e IA
   - Reports (Burndown, Velocity, CFD, Cycle Time, Team Performance, Delivery Forecast)
   - Comentários com @menções
   - Notificações (email + push PWA)
   - Bottleneck detection
   - Story points
   - Templates de projeto
   - Sistema de planos (Free/Starter/Standard/Pro/Enterprise)
   - Integração Stripe (checkout, webhook, portal, sincronização)
   - Downgrade com carência de 7 dias (CDC)
   - Export CSV
   - Activity Feed
   - PWA com install page

4. **Features Sugeridas pelo SEARCH.md ainda não implementadas** — com impacto e sugestão técnica:
   - Integrações (GitHub, Slack) — Webhooks base + OAuth connectors
   - SSO corporativo — Supabase Auth com SAML/OAuth enterprise
   - Time tracking nativo — Nova tabela + timer na UI da task
   - Automações (rules engine) — Tabela de regras + edge function dispatcher
   - Custom dashboards — Layout builder com widgets drag-and-drop
   - Importador de boards (Trello/Asana) — Edge function parser de JSON/CSV
   - Templates setoriais (seed data) — Expandir templates existentes
   - Export PDF — Edge function com jspdf
   - Multi-idioma (i18n) — react-intl ou i18next
   - Modo offline (PWA enhanced) — Workbox strategies + sync queue

5. **Análise de Impacto no Stripe/Produção** — O que muda em cada feature sugerida:
   - Features que não afetam planos (ex: i18n, importador)
   - Features que devem ser gated por plano (ex: automações, SSO, time tracking)
   - Features que requerem novos produtos no Stripe (ex: add-ons)

6. **Posicionamento de Preço Atualizado** — Comparação com valores do SEARCH.md

7. **Roadmap Sugerido** — Próximas fases priorizadas

### Impacto

- **Nenhuma mudança funcional** no app — apenas documentação e fix de build
- Os build errors serão corrigidos trocando o import pattern nas edge functions
- O documento servirá como guia estratégico para decisões de produto

