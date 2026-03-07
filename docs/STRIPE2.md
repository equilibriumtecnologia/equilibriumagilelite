# Guia de Configuração Stripe — Ambiente de Produção

> Última atualização: 2026-03-07

---

## 1. Pré-requisitos

- Conta Stripe **ativada** para produção (verificação de identidade concluída)
- Moeda padrão configurada: **BRL**
- Acesso ao painel de secrets do projeto Lovable Cloud

---

## 2. Obter Chaves de Produção

Acesse **Stripe Dashboard → Developers → API Keys** (certifique-se de que o toggle **"Test mode"** está **desligado**).

| Chave | Formato | Onde usar |
|-------|---------|-----------|
| **Publishable Key** | `pk_live_...` | Frontend (opcional, se usar Stripe.js) |
| **Secret Key** | `sk_live_...` | Secret `STRIPE_SECRET_KEY` no backend |

> ⚠️ **Nunca** exponha a Secret Key no frontend ou em repositórios públicos.

---

## 3. Criar Produtos e Preços

Acesse **Stripe Dashboard → Products → + Add product** e crie os 4 produtos abaixo:

### 3.1 — ALE Starter

| Campo | Valor |
|-------|-------|
| Nome | `ALE Starter` |
| Metadata | `plan_slug` = `starter`, `display_order` = `1` |
| Preço Mensal | R$ 19,00 — Recorrente, BRL |
| Preço Anual | R$ 205,00 — Recorrente, BRL |

### 3.2 — ALE Standard

| Campo | Valor |
|-------|-------|
| Nome | `ALE Standard` |
| Metadata | `plan_slug` = `standard`, `display_order` = `2` |
| Preço Mensal | R$ 49,00 — Recorrente, BRL |
| Preço Anual | R$ 529,00 — Recorrente, BRL |

### 3.3 — ALE Pro

| Campo | Valor |
|-------|-------|
| Nome | `ALE Pro` |
| Metadata | `plan_slug` = `pro`, `display_order` = `3` |
| Preço Mensal | R$ 119,00 — Recorrente, BRL |
| Preço Anual | R$ 1.285,00 — Recorrente, BRL |

### 3.4 — ALE Enterprise

| Campo | Valor |
|-------|-------|
| Nome | `ALE Enterprise` |
| Metadata | `plan_slug` = `enterprise`, `display_order` = `4` |
| Preço | Configuração manual (sob consulta) |

> **Importante:** Cada **Price** deve conter metadata `interval` = `month` ou `year`, e opcionalmente `discount_label` = `10% de desconto` nos preços anuais.

---

## 4. Configurar Webhook de Produção

Acesse **Stripe Dashboard → Developers → Webhooks → + Add endpoint**.

| Campo | Valor |
|-------|-------|
| **URL do endpoint** | `https://oteqziddtpjosoacjfwq.supabase.co/functions/v1/stripe-webhook` |
| **Eventos** | `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted` |

Após criar, copie o **Webhook Signing Secret** (`whsec_...`).

---

## 5. Configurar Customer Portal

Acesse **Stripe Dashboard → Settings → Billing → Customer portal**.

| Configuração | Valor |
|--------------|-------|
| Cancelamento | ✅ Permitido |
| Upgrade/Downgrade | ✅ Permitido |
| Atualização de pagamento | ✅ Permitido |
| URL de retorno | `https://agilelite.equilibriumtecnologia.com.br/settings` |

---

## 6. Atualizar Secrets no Projeto

No painel do projeto Lovable, atualize os seguintes secrets com as chaves de **produção**:

| Secret | Valor de Teste (substituir) | Valor de Produção |
|--------|----------------------------|-------------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (teste) | `whsec_...` (produção) |

> **Nota:** Se utilizar `STRIPE_PUBLISHABLE_KEY` no frontend, atualize também para `pk_live_...`.

---

## 7. Checklist de Migração

- [ ] Conta Stripe verificada para produção
- [ ] 4 produtos criados com metadata correta (`plan_slug`, `display_order`)
- [ ] 7 preços configurados (3 mensais + 3 anuais + Enterprise manual)
- [ ] Webhook de produção criado com todos os 7 eventos
- [ ] Webhook Signing Secret copiado
- [ ] Customer Portal configurado com URL de retorno de produção
- [ ] Secret `STRIPE_SECRET_KEY` atualizado para `sk_live_...`
- [ ] Secret `STRIPE_WEBHOOK_SECRET` atualizado para `whsec_...` de produção
- [ ] Teste de checkout completo em produção com valor real (ou cupom de 100% para teste)

---

## 8. Validação Pós-Migração

Após atualizar as chaves, valide os seguintes fluxos:

1. **Pricing page carrega preços do Stripe** — Acesse `/pricing` e confirme que os valores são exibidos corretamente
2. **Checkout funciona** — Clique em "Assinar" e complete um pagamento (use um cupom de 100% para evitar cobrança real durante teste)
3. **Webhook processa eventos** — Verifique nos logs da Edge Function `stripe-webhook` que o evento `checkout.session.completed` foi recebido
4. **Customer Portal acessível** — Em Settings, clique em "Gerenciar Plano" e confirme que o portal Stripe abre
5. **Cancelamento e downgrade** — Cancele a assinatura pelo portal e confirme que o sistema processa o downgrade para Free

---

## 9. Rollback para Teste

Caso precise reverter para ambiente de teste:

1. Substitua `STRIPE_SECRET_KEY` por `sk_test_...`
2. Substitua `STRIPE_WEBHOOK_SECRET` pelo `whsec_...` de teste
3. Os produtos de teste e produção são independentes — nenhuma alteração é necessária nos produtos

---

## 10. Segurança

- **Nunca** commite chaves `sk_live_...` ou `whsec_...` em código-fonte
- Secrets são armazenados de forma segura via Lovable Cloud
- Rotacione a Secret Key periodicamente em **Stripe Dashboard → Developers → API Keys → Roll key**
- Monitore eventos de webhook em **Stripe Dashboard → Developers → Webhooks → Logs**
