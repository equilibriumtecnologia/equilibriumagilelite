# Guia: Configuração de Plano Enterprise Customizado

> Última atualização: 2026-03-07

---

## Visão Geral

Este guia descreve o passo a passo para configurar um plano Enterprise customizado após o contato comercial, criação do produto no Stripe e pagamento pelo cliente.

---

## 1. Criar o Produto no Stripe

Acesse **Stripe Dashboard → Products → + Add product**.

| Campo        | Valor                                                        |
| ------------ | ------------------------------------------------------------ |
| Nome         | `ALE Enterprise - [Nome da Empresa]`                         |
| Metadata     | `plan_slug` = `enterprise_[slug_unico]`, `display_order` = `99` |
| Preço        | Valor acordado — Recorrente, BRL (mensal e/ou anual)         |

> **Importante:** O `plan_slug` deve ser único e começar com `enterprise_`. Exemplo: `enterprise_acme`.

---

## 2. Criar o Plano na Tabela `subscription_plans`

Execute a seguinte SQL no banco (via Lovable Cloud → Database):

```sql
INSERT INTO public.subscription_plans (
  name, slug, 
  max_workspaces, max_created_workspaces, max_guest_workspaces,
  max_projects_per_workspace, max_invites_per_workspace, max_users_per_workspace,
  price_monthly_cents, price_yearly_cents,
  features, is_active
) VALUES (
  'Enterprise - Acme Corp',     -- nome visível
  'enterprise_acme',            -- slug (deve bater com plan_slug do Stripe)
  20,                           -- max_workspaces (total)
  10,                           -- max_created_workspaces
  10,                           -- max_guest_workspaces
  20,                           -- max_projects_per_workspace
  20,                           -- max_invites_per_workspace
  20,                           -- max_users_per_workspace
  59900,                        -- preço mensal em centavos (R$ 599,00)
  647100,                       -- preço anual em centavos (R$ 6.471,00)
  '{"support":"dedicated","advanced_reports":true,"custom_permissions":true,"ai_prioritization":true}'::jsonb,
  true
);
```

> **Ajuste os valores** de limites e preços conforme a proposta comercial acordada.

---

## 3. Enviar Link de Pagamento ao Cliente

Após criar o produto no Stripe, gere um **Payment Link** ou envie o checkout manualmente:

1. **Stripe Dashboard → Products → [Produto Enterprise] → Create payment link**
2. Envie o link ao cliente por email
3. Após o pagamento, o webhook `checkout.session.completed` será acionado automaticamente

---

## 4. Fluxo Automático Pós-Pagamento

Quando o cliente efetuar o pagamento via Stripe:

1. O webhook `stripe-webhook` recebe o evento `checkout.session.completed`
2. A Edge Function identifica o `plan_slug` nos metadados do produto
3. Busca o plano correspondente na tabela `subscription_plans` pelo `slug`
4. Cria/atualiza o registro em `user_subscriptions` com:
   - `plan_id` → ID do plano na tabela `subscription_plans`
   - `stripe_customer_id` → ID do cliente no Stripe
   - `stripe_subscription_id` → ID da assinatura
   - `status` → `active`
   - `current_period_start` / `current_period_end` → datas da assinatura

> **Resultado:** O sistema automaticamente aplica os limites do plano (workspaces, projetos, convites, usuários) para o usuário.

---

## 5. Verificar se o Webhook Processa Corretamente

### Checklist:

- [ ] Produto criado no Stripe com `plan_slug` nos metadados
- [ ] Plano inserido na tabela `subscription_plans` com o mesmo `slug`
- [ ] Payment Link enviado ao cliente
- [ ] Cliente efetuou o pagamento
- [ ] Verificar nos logs da Edge Function `stripe-webhook` se o evento foi processado
- [ ] Verificar na tabela `user_subscriptions` se o registro foi criado/atualizado
- [ ] Testar login do cliente e confirmar que os limites estão corretos

---

## 6. Função `get_user_plan` 

A função `get_user_plan` já busca dinamicamente o plano ativo do usuário na tabela `subscription_plans`. Desde que o `slug` esteja corretamente configurado, os limites serão aplicados automaticamente em todas as verificações:

- `check_can_create_workspace`
- `check_project_limit`
- `check_invite_limit`
- `check_workspace_user_limit`

**Nenhuma alteração de código é necessária** — basta inserir o plano no banco com os limites corretos.

---

## 7. Cancelamento / Downgrade

Quando o cliente cancelar via Stripe Customer Portal:

1. O webhook `customer.subscription.deleted` é acionado
2. A Edge Function atualiza `user_subscriptions.status` para `canceled`
3. O sistema de downgrade automático entra em ação (carência de 7 dias)
4. O processo segue a política padrão documentada em `docs/STRIPE2.md`

---

## 8. Exemplos de Configurações Comuns

### Enterprise Pequeno (até 10 usuários)
```sql
-- max_created_workspaces: 5, max_projects: 10, max_users: 10
```

### Enterprise Médio (até 50 usuários)
```sql
-- max_created_workspaces: 15, max_projects: 30, max_users: 50
```

### Enterprise Grande (ilimitado)
```sql
-- max_created_workspaces: 999, max_projects: 999, max_users: 999
```

---

## Resumo do Fluxo

```
Lead via formulário → Proposta comercial → Criar produto Stripe + plano no banco
→ Enviar Payment Link → Cliente paga → Webhook ativa automaticamente → Limites aplicados
```
