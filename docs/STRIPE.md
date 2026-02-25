# Plano de Integração Stripe — ALE (Agile Lite Equilibrium)

> Última atualização: 2026-02-25

---

## 1. Visão Geral

Toda a lógica de preços e cobrança será gerenciada **exclusivamente no Stripe**. O app nunca armazena valores monetários localmente — busca `product_id` e `price_id` do Stripe em tempo real para renderizar a página de Pricing e iniciar o Checkout.

### Princípios
- **Single source of truth**: Stripe é a fonte de preços. Alterar valores no Stripe reflete automaticamente no app.
- **Segurança**: Checkout Session é criado server-side (Edge Function). O frontend nunca manipula valores.
- **Webhook-driven**: Mudanças de status (pagamento, cancelamento, upgrade) são processadas via webhook.

---

## 2. Produtos e Preços no Stripe

### 2.1 Produtos (Products)

| Produto       | Stripe Product Name     | Metadata                     |
|---------------|-------------------------|------------------------------|
| Starter       | `ALE Starter`           | `plan_slug: starter`         |
| Professional  | `ALE Professional`      | `plan_slug: professional`    |
| Enterprise    | `ALE Enterprise`        | `plan_slug: enterprise`      |

> O plano **Free** não tem produto no Stripe (é o padrão sem assinatura ativa).

### 2.2 Preços (Prices) por Produto

| Produto       | Intervalo | Valor       | Desconto | Stripe Price ID (exemplo)     |
|---------------|-----------|-------------|----------|-------------------------------|
| Starter       | Mensal    | R$ 29/mês   | —        | `price_starter_monthly`       |
| Starter       | Anual     | R$ 313/ano  | 10%      | `price_starter_yearly`        |
| Professional  | Mensal    | R$ 79/mês   | —        | `price_professional_monthly`  |
| Professional  | Anual     | R$ 853/ano  | 10%      | `price_professional_yearly`   |
| Enterprise    | Mensal    | Sob consulta| —        | Configuração manual           |

> **Cálculo anual**: `(valor_mensal × 12) × 0.90`, arredondado.
> - Starter: 29 × 12 × 0.90 = R$ 313,20 → R$ 313
> - Professional: 79 × 12 × 0.90 = R$ 854,00 → R$ 853 (ou R$ 854)

### 2.3 Metadata nos Products (obrigatório)

Cada Product no Stripe **deve** conter:
```json
{
  "plan_slug": "starter",        // Mapeia para subscription_plans.slug
  "display_order": "1"           // Ordem de exibição no Pricing
}
```

Cada Price no Stripe **deve** conter:
```json
{
  "interval": "month",           // ou "year"
  "discount_label": ""           // ou "10% de desconto"
}
```

---

## 3. Arquitetura Técnica

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Frontend    │────▶│  Edge Functions   │────▶│   Stripe    │
│  (React)     │◀────│  (Deno)          │◀────│   API       │
└─────────────┘     └──────────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Database    │
                    │  (Lovable    │
                    │   Cloud)     │
                    └──────────────┘
```

### 3.1 Edge Functions Necessárias

| Função                    | Responsabilidade                                      |
|---------------------------|-------------------------------------------------------|
| `stripe-get-prices`       | Busca produtos/preços ativos do Stripe                |
| `stripe-create-checkout`  | Cria Checkout Session para assinatura                 |
| `stripe-webhook`          | Processa eventos do Stripe (webhook)                  |
| `stripe-customer-portal`  | Cria sessão do Customer Portal para gerenciar plano   |
| `stripe-cancel`           | Cancela assinatura (via Customer Portal ou direto)    |

### 3.2 Secrets Necessários

| Secret Name              | Descrição                                   |
|--------------------------|---------------------------------------------|
| `STRIPE_SECRET_KEY`      | Chave secreta da conta Stripe               |
| `STRIPE_WEBHOOK_SECRET`  | Secret para validar webhooks                |
| `STRIPE_PUBLISHABLE_KEY` | Chave pública (pode ficar no frontend)      |

---

## 4. Fluxo de Checkout

### 4.1 Página de Pricing (Dinâmica)

```
1. Frontend monta página de Pricing
2. Chama Edge Function `stripe-get-prices`
3. Edge Function busca Products + Prices ativos no Stripe
4. Retorna lista formatada com: name, slug, prices[], features
5. Frontend renderiza cards com toggle Mensal/Anual
6. Valores vêm 100% do Stripe (não hardcoded)
```

### 4.2 Fluxo de Assinatura

```
1. Usuário clica "Assinar" em um plano
2. Frontend chama `stripe-create-checkout` com:
   - price_id (do Stripe)
   - user_id (auth)
   - success_url / cancel_url
3. Edge Function:
   a. Verifica se user já tem stripe_customer_id
   b. Se não, cria Customer no Stripe com email do user
   c. Cria Checkout Session (mode: 'subscription')
   d. Retorna session.url
4. Frontend redireciona para Stripe Checkout
5. Após pagamento, Stripe redireciona para success_url
6. Webhook processa `checkout.session.completed`
```

### 4.3 Webhook Events a Processar

| Evento                                | Ação no Backend                                       |
|---------------------------------------|-------------------------------------------------------|
| `checkout.session.completed`          | Criar/atualizar `user_subscriptions` com plan ativo   |
| `invoice.payment_succeeded`           | Renovar `current_period_end`                          |
| `invoice.payment_failed`              | Marcar status como `past_due`                         |
| `customer.subscription.updated`       | Atualizar plano (upgrade/downgrade)                   |
| `customer.subscription.deleted`       | Marcar como `cancelled`, aplicar grace period 7 dias  |

---

## 5. Implementação Detalhada

### 5.1 Edge Function: `stripe-get-prices`

```typescript
// Pseudocódigo
GET /stripe-get-prices

1. Buscar todos os Products ativos com metadata.plan_slug
2. Para cada Product, buscar Prices ativos
3. Mapear para formato:
   {
     products: [
       {
         name: "Starter",
         slug: "starter",
         stripe_product_id: "prod_xxx",
         prices: [
           {
             stripe_price_id: "price_xxx",
             interval: "month",
             amount: 2900,        // centavos
             currency: "brl",
             formatted: "R$ 29"
           },
           {
             stripe_price_id: "price_yyy",
             interval: "year",
             amount: 31300,
             currency: "brl",
             formatted: "R$ 313",
             discount_label: "10% de desconto"
           }
         ],
         features: [...] // do metadata ou DB local
       }
     ]
   }
4. Cachear resposta por 5 minutos (opcional)
```

### 5.2 Edge Function: `stripe-create-checkout`

```typescript
// Pseudocódigo
POST /stripe-create-checkout
Body: { price_id, success_url, cancel_url }

1. Autenticar usuário (JWT)
2. Buscar/criar Stripe Customer
3. Criar Checkout Session:
   - mode: 'subscription'
   - customer: stripe_customer_id
   - line_items: [{ price: price_id, quantity: 1 }]
   - success_url com ?session_id={CHECKOUT_SESSION_ID}
   - cancel_url
   - metadata: { user_id, plan_slug }
   - payment_method_types: ['card']
   - locale: 'pt-BR'
   - allow_promotion_codes: true
4. Salvar stripe_customer_id em user_subscriptions (se novo)
5. Retornar { url: session.url }
```

### 5.3 Edge Function: `stripe-webhook`

```typescript
// Pseudocódigo
POST /stripe-webhook

1. Validar assinatura do webhook (STRIPE_WEBHOOK_SECRET)
2. Switch no event.type:

   case 'checkout.session.completed':
     - Extrair customer, subscription, metadata.user_id
     - Buscar subscription details do Stripe
     - Mapear price → plan via metadata.plan_slug no Product
     - Upsert em user_subscriptions:
       {
         user_id,
         plan_id: (SELECT id FROM subscription_plans WHERE slug = plan_slug),
         stripe_customer_id,
         stripe_subscription_id,
         status: 'active',
         current_period_start,
         current_period_end
       }

   case 'invoice.payment_succeeded':
     - Atualizar current_period_end
     - Garantir status = 'active'

   case 'invoice.payment_failed':
     - Atualizar status = 'past_due'
     - (Opcional) Enviar email de notificação

   case 'customer.subscription.updated':
     - Verificar se houve mudança de price/plan
     - Atualizar plan_id e período

   case 'customer.subscription.deleted':
     - Atualizar status = 'cancelled'
     - Registrar data de cancelamento
     - Grace period: manter acesso por 7 dias
     - Após 7 dias: downgrade para Free (via cron ou check)
```

### 5.4 Edge Function: `stripe-customer-portal`

```typescript
// Pseudocódigo
POST /stripe-customer-portal

1. Autenticar usuário
2. Buscar stripe_customer_id do user
3. Criar Billing Portal Session:
   - customer: stripe_customer_id
   - return_url: URL do app
4. Retornar { url: session.url }
```

---

## 6. Alterações no Frontend

### 6.1 Página de Pricing Dinâmica

**Antes**: Preços hardcoded em `src/pages/Pricing.tsx`  
**Depois**: Preços buscados via `stripe-get-prices`

```
Componentes:
├── src/pages/Pricing.tsx          (refatorado)
├── src/hooks/useStripePrices.ts   (novo - busca preços)
├── src/components/pricing/
│   ├── PricingHeader.tsx          (novo)
│   ├── PricingCard.tsx            (novo)
│   ├── PricingToggle.tsx          (novo - toggle mensal/anual)
│   └── PricingCTA.tsx             (novo)
```

### 6.2 Toggle Mensal/Anual

- Switch/Toggle no topo da seção de planos
- Ao alternar, os cards mostram o preço correspondente
- Badge "Economia de 10%" no modo anual
- Animação suave na troca de valores

### 6.3 Fluxo Pós-Login

- Sidebar: botão "Upgrade" para users no plano Free
- Settings: seção "Plano & Faturamento" com:
  - Plano atual
  - Próxima cobrança
  - Botão "Gerenciar Plano" → Stripe Customer Portal
  - Botão "Fazer Upgrade" → Pricing page

### 6.4 Success Page

- `/checkout/success?session_id=xxx`
- Verificar status da sessão
- Mostrar confirmação com detalhes do plano
- Redirecionar para dashboard após 5s

---

## 7. Mapeamento Stripe ↔ Database

### 7.1 Tabela `subscription_plans` (já existe)

Campos relevantes para Stripe:
```sql
-- Adicionar campos de referência ao Stripe
ALTER TABLE subscription_plans
  ADD COLUMN stripe_product_id TEXT UNIQUE,
  ADD COLUMN stripe_price_monthly_id TEXT,
  ADD COLUMN stripe_price_yearly_id TEXT;
```

### 7.2 Tabela `user_subscriptions` (já existe)

Campos já existentes e mapeados:
- `stripe_customer_id` ✅
- `stripe_subscription_id` ✅
- `plan_id` ✅ (FK para subscription_plans)
- `status` ✅
- `current_period_start` ✅
- `current_period_end` ✅

### 7.3 Fluxo de Sincronização

```
Stripe Product.metadata.plan_slug  ←→  subscription_plans.slug
Stripe Price.id                    →   stripe_price_monthly_id / stripe_price_yearly_id
Stripe Customer.id                 →   user_subscriptions.stripe_customer_id
Stripe Subscription.id             →   user_subscriptions.stripe_subscription_id
```

---

## 8. Segurança

### 8.1 Regras Críticas

1. **Nunca expor `STRIPE_SECRET_KEY`** no frontend
2. **Sempre validar webhook signature** antes de processar
3. **Checkout Session server-side only** — frontend recebe apenas a URL
4. **Verificar user_id** no webhook via metadata (não confiar em dados do cliente)
5. **Idempotência**: Processar cada evento webhook apenas uma vez (usar `event.id`)

### 8.2 RLS para `user_subscriptions`

- Users só visualizam a própria subscription ✅ (já implementado)
- Writes só via service_role (webhook) ✅

### 8.3 Validação de Price ID

- No `stripe-create-checkout`, validar que o `price_id` recebido:
  - Pertence a um Product ativo
  - Está na lista de preços permitidos
  - Não aceitar price_ids arbitrários

---

## 9. Configuração no Stripe Dashboard

### 9.1 Checklist de Setup

- [ ] Criar conta Stripe (ou usar existente)
- [ ] Configurar moeda padrão: **BRL**
- [ ] Criar Products com metadata `plan_slug`
- [ ] Criar Prices (mensal e anual) para cada Product
- [ ] Configurar Webhook endpoint apontando para Edge Function
- [ ] Selecionar eventos do webhook (seção 4.3)
- [ ] Configurar Customer Portal (permitir cancelamento, upgrade)
- [ ] Copiar chaves para Secrets do projeto:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PUBLISHABLE_KEY` (opcional, se usar Stripe.js)

### 9.2 Webhook URL

```
https://<project-id>.supabase.co/functions/v1/stripe-webhook
```

### 9.3 Eventos do Webhook

Selecionar no Stripe Dashboard:
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

---

## 10. Plano de Execução (Sprints)

### Sprint 1 — Fundação (2-3 dias)
1. Habilitar Stripe no projeto (via ferramenta Lovable)
2. Configurar secrets (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
3. Criar migration para adicionar campos Stripe em `subscription_plans`
4. Criar Edge Function `stripe-get-prices`
5. Criar hook `useStripePrices`

### Sprint 2 — Checkout (2-3 dias)
1. Criar Edge Function `stripe-create-checkout`
2. Refatorar `Pricing.tsx` para usar preços dinâmicos
3. Implementar toggle Mensal/Anual
4. Criar página de sucesso `/checkout/success`

### Sprint 3 — Webhook & Sync (2-3 dias)
1. Criar Edge Function `stripe-webhook`
2. Implementar processamento de todos os eventos
3. Testar fluxo completo com Stripe Test Mode
4. Garantir idempotência no webhook

### Sprint 4 — Portal & UX (1-2 dias)
1. Criar Edge Function `stripe-customer-portal`
2. Adicionar seção "Plano & Faturamento" em Settings
3. Implementar botão "Gerenciar Plano"
4. Adicionar indicadores visuais de plano no sidebar

### Sprint 5 — Testes & Go-live (1-2 dias)
1. Testar todos os cenários (upgrade, downgrade, cancelamento)
2. Testar grace period de 7 dias
3. Trocar para chaves de produção
4. Monitorar primeiros pagamentos

---

## 11. Cenários de Teste

| # | Cenário                              | Resultado Esperado                              |
|---|--------------------------------------|--------------------------------------------------|
| 1 | Novo user assina Starter mensal      | Subscription ativa, plano atualizado no DB       |
| 2 | User faz upgrade para Professional   | Plano atualizado, cobrança pro-rata              |
| 3 | User troca de mensal para anual      | Novo price_id, desconto 10% aplicado             |
| 4 | Pagamento falha                      | Status `past_due`, notificação enviada           |
| 5 | User cancela assinatura              | Grace period 7 dias, depois downgrade para Free  |
| 6 | Alterar preço no Stripe              | Pricing page reflete novo valor automaticamente  |
| 7 | User tenta checkout com price falso  | Erro 400, checkout rejeitado                     |
| 8 | Webhook duplicado                    | Processado apenas uma vez (idempotência)         |

---

## 12. Métricas de Receita (Futuro)

Após go-live, implementar dashboard Master com:
- **MRR** (Monthly Recurring Revenue)
- **Churn Rate**
- **LTV** (Lifetime Value)
- **Conversão Free → Paid**
- **Distribuição por plano**

Dados extraídos via Stripe API + dados locais.
