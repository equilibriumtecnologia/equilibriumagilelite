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

## 2. Produtos e Preços no Stripe

### 2.1 Produtos (Products)

| Produto       | Stripe Product Name     | Metadata                     |
|---------------|-------------------------|------------------------------|
| Starter       | `ALE Starter`           | `plan_slug: starter`         |
| Standard      | `ALE Standard`          | `plan_slug: standard`        |
| Pro           | `ALE Pro`               | `plan_slug: pro`             |
| Enterprise    | `ALE Enterprise`        | `plan_slug: enterprise`      |

> O plano **Free** não tem produto no Stripe (é o padrão sem assinatura ativa).

### 2.2 Preços (Prices) por Produto

| Produto       | Intervalo | Valor         | Desconto | Stripe Price ID (exemplo)     |
|---------------|-----------|---------------|----------|-------------------------------|
| Starter       | Mensal    | R$ 19/mês     | —        | `price_starter_monthly`       |
| Starter       | Anual     | R$ 205/ano    | 10%      | `price_starter_yearly`        |
| Standard      | Mensal    | R$ 49/mês     | —        | `price_standard_monthly`      |
| Standard      | Anual     | R$ 529/ano    | 10%      | `price_standard_yearly`       |
| Pro           | Mensal    | R$ 119/mês    | —        | `price_pro_monthly`           |
| Pro           | Anual     | R$ 1.285/ano  | 10%      | `price_pro_yearly`            |
| Enterprise    | Mensal    | Sob consulta  | —        | Configuração manual           |

> **Cálculo anual**: `(valor_mensal × 12) × 0.90`, arredondado.
> - Starter: 19 × 12 × 0.90 = R$ 205,20 → R$ 205
> - Standard: 49 × 12 × 0.90 = R$ 529,20 → R$ 529
> - Pro: 119 × 12 × 0.90 = R$ 1.285,20 → R$ 1.285

### 2.3 Resumo de Limites por Plano

| Recurso                     | Free | Starter | Standard | Pro  | Enterprise |
|-----------------------------|------|---------|----------|------|------------|
| WS padrão                   | 1    | 1       | 1        | 1    | Custom     |
| WS criados                  | 0    | 1       | 2        | 4    | Ilimitados |
| WS como convidado            | 1    | 1       | 2        | 4    | Ilimitados |
| Projetos por WS             | 1    | 1       | 2        | 4    | Ilimitados |
| Convites por WS             | 0    | 1       | 2        | 4    | Ilimitados |
| Usuários por WS             | 1    | 2       | 4        | 8    | Ilimitados |
| IA (Priorização)            | ❌   | ❌      | ✅       | ✅   | ✅         |
| Relatórios avançados        | ❌   | ❌      | ✅       | ✅   | ✅         |

### 2.4 Metadata nos Products (obrigatório)

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

## 3. ⚠️ Checklist Pré-Implementação

### Passo a passo que o usuário deve realizar ANTES de prosseguir:

#### 3.1 — Configuração da Conta Stripe
- [ ] Ter conta Stripe ativa (modo teste ou produção)
- [ ] Configurar moeda padrão: **BRL**
- [ ] Anotar as chaves:
  - `Publishable Key` (pk_test_... ou pk_live_...)
  - `Secret Key` (sk_test_... ou sk_live_...)

#### 3.2 — Criar os 4 Products no Stripe Dashboard
Para cada produto, acessar **Stripe Dashboard → Products → + Add product**:

1. **ALE Starter**
   - Nome: `ALE Starter`
   - Metadata: `plan_slug` = `starter`, `display_order` = `1`
   - Preço mensal: R$ 19,00 (recorrente, BRL)
   - Preço anual: R$ 205,00 (recorrente, BRL)

2. **ALE Standard**
   - Nome: `ALE Standard`
   - Metadata: `plan_slug` = `standard`, `display_order` = `2`
   - Preço mensal: R$ 49,00 (recorrente, BRL)
   - Preço anual: R$ 529,00 (recorrente, BRL)

3. **ALE Pro**
   - Nome: `ALE Pro`
   - Metadata: `plan_slug` = `pro`, `display_order` = `3`
   - Preço mensal: R$ 119,00 (recorrente, BRL)
   - Preço anual: R$ 1.285,00 (recorrente, BRL)

4. **ALE Enterprise**
   - Nome: `ALE Enterprise`
   - Metadata: `plan_slug` = `enterprise`, `display_order` = `4`
   - Preço: configuração manual (sob consulta)

#### 3.3 — Configurar Webhook
- [ ] Acessar **Stripe Dashboard → Developers → Webhooks → + Add endpoint**
- [ ] URL do endpoint: `https://oteqziddtpjosoacjfwq.supabase.co/functions/v1/stripe-webhook`
- [ ] Selecionar os eventos:
  - `checkout.session.completed`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- [ ] Anotar o `Webhook Signing Secret` (whsec_...)

#### 3.4 — Configurar Customer Portal
- [ ] Acessar **Stripe Dashboard → Settings → Billing → Customer portal**
- [ ] Permitir: cancelamento, upgrade, downgrade, atualização de pagamento
- [ ] Definir URL de retorno: URL do app (ex: `https://seudominio.com/settings`)

#### 3.5 — Informações a fornecer ao Lovable
Após completar os passos acima, informe ao Lovable:
1. ✅ "Produtos criados no Stripe"
2. As 3 chaves:
   - `STRIPE_SECRET_KEY` (sk_test_... ou sk_live_...)
   - `STRIPE_WEBHOOK_SECRET` (whsec_...)
   - `STRIPE_PUBLISHABLE_KEY` (pk_test_... ou pk_live_...) — opcional, se usar Stripe.js

---

## 4. Arquitetura Técnica

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

### 4.1 Edge Functions Necessárias

| Função                    | Responsabilidade                                      |
|---------------------------|-------------------------------------------------------|
| `stripe-get-prices`       | Busca produtos/preços ativos do Stripe                |
| `stripe-create-checkout`  | Cria Checkout Session para assinatura                 |
| `stripe-webhook`          | Processa eventos do Stripe (webhook)                  |
| `stripe-customer-portal`  | Cria sessão do Customer Portal para gerenciar plano   |

### 4.2 Secrets Necessários

| Secret Name              | Descrição                                   |
|--------------------------|---------------------------------------------|
| `STRIPE_SECRET_KEY`      | Chave secreta da conta Stripe               |
| `STRIPE_WEBHOOK_SECRET`  | Secret para validar webhooks                |
| `STRIPE_PUBLISHABLE_KEY` | Chave pública (pode ficar no frontend)      |

---

## 5. Fluxo de Checkout

### 5.1 Página de Pricing (Dinâmica)

```
1. Frontend monta página de Pricing
2. Chama Edge Function `stripe-get-prices`
3. Edge Function busca Products + Prices ativos no Stripe
4. Retorna lista formatada com: name, slug, prices[], features
5. Frontend renderiza cards com toggle Mensal/Anual
6. Valores vêm 100% do Stripe (não hardcoded)
```

### 5.2 Fluxo de Assinatura

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

### 5.3 Webhook Events a Processar

| Evento                                | Ação no Backend                                       |
|---------------------------------------|-------------------------------------------------------|
| `checkout.session.completed`          | Criar/atualizar `user_subscriptions` com plan ativo   |
| `invoice.payment_succeeded`           | Renovar `current_period_end`                          |
| `invoice.payment_failed`              | Marcar status como `past_due`                         |
| `customer.subscription.updated`       | Atualizar plano (upgrade/downgrade)                   |
| `customer.subscription.deleted`       | Marcar como `cancelled`, grace period 7 dias          |

---

## 6. Segurança

### 6.1 Regras Críticas

1. **Nunca expor `STRIPE_SECRET_KEY`** no frontend
2. **Sempre validar webhook signature** antes de processar
3. **Checkout Session server-side only** — frontend recebe apenas a URL
4. **Verificar user_id** no webhook via metadata (não confiar em dados do cliente)
5. **Idempotência**: Processar cada evento webhook apenas uma vez (usar `event.id`)
6. **Validar price_id** no checkout — não aceitar IDs arbitrários

### 6.2 IA restrita por plano

- A funcionalidade de IA (priorização) está bloqueada no frontend e backend para planos Free e Starter
- Apenas Standard, Pro e Master têm acesso

---

## 7. Plano de Execução (após configuração do Stripe)

### Sprint 1 — Fundação (2-3 dias)
1. Habilitar Stripe no projeto (via ferramenta Lovable)
2. Configurar secrets (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
3. Atualizar `subscription_plans` no banco com novos planos (Standard, Pro)
4. Criar Edge Function `stripe-get-prices`
5. Criar hook `useStripePrices`

### Sprint 2 — Checkout (2-3 dias)
1. Criar Edge Function `stripe-create-checkout`
2. Refatorar `Pricing.tsx` para usar preços dinâmicos do Stripe
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

---

## 8. Cenários de Teste

| # | Cenário                              | Resultado Esperado                              |
|---|--------------------------------------|--------------------------------------------------|
| 1 | Novo user assina Starter mensal      | Subscription ativa, plano atualizado no DB       |
| 2 | User faz upgrade Starter → Standard  | Plano atualizado, cobrança pro-rata              |
| 3 | User faz upgrade Standard → Pro      | Plano atualizado, cobrança pro-rata              |
| 4 | User troca de mensal para anual      | Novo price_id, desconto 10% aplicado             |
| 5 | Pagamento falha                      | Status `past_due`, notificação enviada           |
| 6 | User cancela assinatura              | Grace period 7 dias, depois downgrade para Free  |
| 7 | Alterar preço no Stripe              | Pricing page reflete novo valor automaticamente  |
| 8 | User tenta checkout com price falso  | Erro 400, checkout rejeitado                     |
| 9 | Webhook duplicado                    | Processado apenas uma vez (idempotência)         |
| 10| User Free tenta usar IA             | Bloqueado no front e backend com msg de upgrade  |
