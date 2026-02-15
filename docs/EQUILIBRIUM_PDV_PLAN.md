# Equilibrium PDV + ERP + CRM — Plano de Implementação

## Adaptações à Stack Lovable

| Prompt Original | Adaptação Lovable |
|---|---|
| Vercel Serverless Functions | **Supabase Edge Functions** (Deno) |
| Drizzle/Prisma ORM | **Supabase Migrations SQL** |
| File-based routing | **react-router-dom** (já instalado) |
| Cookies HttpOnly (server) | **Supabase Edge Functions** setam cookies |
| .env server-only | **Supabase Secrets** (edge functions) |
| Next.js App Router | **Vite + React SPA** com layouts |

> **Nota**: O projeto atual (ALE - gestão de projetos) será **substituído** pelo Equilibrium PDV.

---

## Fases de Implementação

### FASE 0 — Fundação e Limpeza
**Objetivo**: Preparar o projeto, remover código do ALE, configurar base.

- [ ] Limpar páginas/componentes/hooks do ALE
- [ ] Manter: UI components (shadcn), AuthContext base, utils, configuração Tailwind
- [ ] Criar estrutura de pastas kebab-case
- [ ] Instalar dependências faltantes: `react-number-format`
- [ ] Criar `docs/cliente-setup.md` (template)
- [ ] Criar `.env.example` documentando variáveis

**Estrutura de pastas alvo**:
```
src/
  pages/
    access-key/        # /chave
    login/             # /entrar
    first-access/      # /primeiro-acesso
    onboarding/        # /onboarding
    dashboard/         # /dashboard
    pos/               # /pdv
    sales/             # /vendas
    customers/         # /clientes
    products/          # /produtos
    categories/        # /categorias
    inventory/         # /estoque
    cash-register/     # /caixa
    reports/           # /relatorios
    users/             # /usuarios
    settings/          # /configuracoes
  components/
    shared/            # componentes reutilizáveis
    layout/            # app-layout, auth-layout, sidebar, topbar
  hooks/
    queries/           # React Query hooks
    mutations/         # React Query mutation hooks
  lib/
    auth/              # jwt, cookies, guards, password
    permissions/       # matrix, guard
    calculations/      # costs, totals
    format/            # formatadores (moeda, data, etc)
    constants/         # enums, defaults
  actions/             # lógica de domínio (schemas + handlers)
    users/
    categories/
    products/
    stock/
    cash/
    sales/
    crm/
    loyalty/
    reports/
    jobs/
supabase/
  functions/
    validate-secret-key/
    auth-login/
    auth-logout/
    auth-me/
    auth-force-change-password/
    create-user/
    ... (demais endpoints)
  migrations/
```

---

### FASE 1 — Banco de Dados (Schema Completo)
**Objetivo**: Criar todas as tabelas, ENUMs, funções e RLS.

#### Tabelas a criar:

1. **`pdv_users`** — Usuários do PDV (separado de auth.users do Supabase)
   - id, name, email, role (enum: admin/manager/salesperson), employee_code (unique),
   - password_hash, must_change_password, token_version, is_active,
   - created_at, updated_at, deleted_at

2. **`permissions_matrix`** — Flags de permissão por usuário
   - id, user_id (FK pdv_users), flags_json (jsonb), updated_at

3. **`pdv_categories`** — Categorias de produtos
   - id, name, display_order, created_at

4. **`products`** — Produtos
   - id, category_id (FK), name, sku (unique), barcode (unique nullable),
   - characteristics_json, extra_costs_json, purchase_price, sale_price,
   - stock_qty, min_stock_enabled, min_stock_qty, is_active,
   - created_at, updated_at, deleted_at

5. **`stock_entries`** — Entradas de estoque
   - id, product_id (FK), qty_added, per_lot_costs_json, created_by (FK pdv_users), created_at

6. **`cash_sessions`** — Sessões de caixa
   - id, opened_by (FK), opened_at, initial_amount, status (enum: open/closed),
   - closed_at, closed_by, closing_summary_json, difference_amount

7. **`cash_movements`** — Movimentos de caixa (sangria/suprimento)
   - id, cash_session_id (FK), type (enum: withdrawal/supply/adjustment),
   - amount, reason, created_by (FK), created_at

8. **`sales`** — Vendas finalizadas
   - id, number (serial), status (enum: completed/cancelled/pending),
   - cash_session_id (FK), customer_id (FK nullable), totals_json,
   - created_by (FK), created_by_snapshot_json, created_at

9. **`sale_items`** — Itens de venda
   - id, sale_id (FK), product_id (FK), qty, unit_price, discount, totals_json

10. **`sale_payments`** — Pagamentos de venda
    - id, sale_id (FK), method_key, method_label, amount, metadata_json

11. **`sale_intents`** — Intenções de venda (persistência forte)
    - id, idempotency_key (unique), payload_json, status (enum: pending/processed/failed),
    - created_at, processed_at, error_message

12. **`customers`** — Clientes CRM
    - id, name, email, whatsapp, birthday_day, birthday_month,
    - created_at, updated_at, deleted_at

13. **`loyalty_config`** — Configuração de fidelidade
    - id, enabled_features_json, rules_json, updated_at

14. **`loyalty_ledger`** — Registro de pontos/cashback
    - id, customer_id (FK), type, payload_json, created_at

15. **`jobs_queue`** — Fila de jobs
    - id, type, payload_json, status (enum: pending/processing/completed/failed),
    - attempts, next_run_at, locked_at, created_at

16. **`audit_logs`** — Logs de auditoria
    - id, actor_user_id (FK), action, entity, entity_id, payload_json, created_at

17. **`system_settings`** — Configurações globais
    - id, key (unique), value_json, updated_at

#### ENUMs:
- `pdv_user_role`: admin, manager, salesperson
- `cash_session_status`: open, closed
- `cash_movement_type`: withdrawal, supply, adjustment
- `sale_status`: pending, completed, cancelled
- `sale_intent_status`: pending, processed, failed
- `job_status`: pending, processing, completed, failed

#### RLS Strategy:
- **Todas as tabelas**: RLS enabled
- **Auth via Edge Functions**: As edge functions usam `SUPABASE_SERVICE_ROLE_KEY` para bypass de RLS
- **Client não acessa banco diretamente** — tudo via Edge Functions
- RLS policies básicas como fallback de segurança

#### Funções SQL:
- `generate_sku()`: gera SKU automático
- `generate_sale_number()`: gera número sequencial de venda
- `calculate_unit_cost()`: calcula custo unitário com extras

---

### FASE 2 — Autenticação e Segurança
**Objetivo**: Auth completo com JWT em cookies via Edge Functions.

#### Edge Functions:
1. **`validate-secret-key`** — POST
   - Recebe `{ key }`, valida contra secret `ACCESS_SECRET_KEY`
   - Retorna cookie `pre_auth` HttpOnly (token curto, 1h)

2. **`auth-login`** — POST
   - Valida cookie `pre_auth`
   - Recebe `{ employee_code, password }`
   - Verifica bcrypt, user ativo, token_version
   - Gera JWT com claims: sub, employee_code, role, permissions_version, must_change_password
   - Seta cookie `session` HttpOnly
   - Retorna claims sanitizados

3. **`auth-logout`** — POST
   - Limpa cookies `session` e `pre_auth`

4. **`auth-me`** — GET
   - Lê cookie `session`, valida JWT
   - Retorna claims sanitizados (para UI)

5. **`auth-force-change-password`** — POST
   - Valida sessão, recebe nova senha
   - Atualiza hash, incrementa token_version, must_change_password=false
   - Gera novo JWT

#### Secrets necessários:
- `ACCESS_SECRET_KEY` — chave pré-login do cliente
- `JWT_SECRET` — chave de assinatura JWT
- `DEFAULT_PASSWORD` — senha padrão para novos usuários

#### Guards (frontend):
- `PreAuthGuard` — verifica cookie pre_auth via `/auth-me` endpoint
- `AuthGuard` — verifica sessão JWT via `/auth-me`
- `FirstAccessGuard` — redireciona para troca de senha se must_change_password
- `OnboardingGuard` — bloqueia rotas até onboarding completo

---

### FASE 3 — Layout, Rotas e Permissões
**Objetivo**: Estrutura de navegação e controle de acesso.

#### Rotas:
```
/chave                → AccessKeyPage (pública)
/entrar               → LoginPage (requer pre_auth)
/primeiro-acesso      → FirstAccessPage (requer auth + must_change)
/onboarding           → OnboardingPage (requer auth, admin)
/dashboard            → DashboardPage
/pdv                  → POSPage
/vendas               → SalesPage
/clientes             → CustomersPage
/produtos             → ProductsPage
/categorias           → CategoriesPage
/estoque              → InventoryPage
/caixa                → CashRegisterPage
/relatorios           → ReportsPage
/usuarios             → UsersPage
/configuracoes        → SettingsPage
```

#### Layout:
- **AuthLayout**: telas /chave, /entrar, /primeiro-acesso (sem sidebar)
- **AppLayout**: telas logadas (sidebar + topbar)
  - Sidebar: itens filtrados por permissões
  - Topbar: nome do usuário, role, status do caixa, busca rápida

#### Hooks de permissão:
- `useCurrentUser()` — retorna dados do JWT (via /auth-me)
- `usePermissions()` — retorna flags de permissão do usuário
- `usePermissionGuard(flag)` — verifica permissão específica
- `useDataScope()` — retorna escopo de dados (all/team/own)

---

### FASE 4 — Onboarding e Usuários
**Objetivo**: Fluxo de primeiro acesso e gestão de usuários.

- [ ] Tela de troca de senha obrigatória
- [ ] Checklist de onboarding (admin)
- [ ] CRUD de usuários (edge functions)
- [ ] UI de matriz de permissões
- [ ] Edge functions: create-user, update-user, update-permissions

---

### FASE 5 — Categorias e Produtos
**Objetivo**: CRUD completo com barcode, soft delete, filtros.

- [ ] CRUD categorias
- [ ] CRUD produtos com:
  - Geração automática de SKU
  - Validação de barcode único (modal de conflito)
  - Características dinâmicas (key/value)
  - Custos extras (per_unit/per_lot)
  - Soft delete + reativação
  - Toggle lista/grid
  - Filtros: nome, sku, barcode, categoria, estoque baixo, status

---

### FASE 6 — Estoque
**Objetivo**: Entradas, ajustes, alertas de estoque baixo.

- [ ] Tela de estoque com ações
- [ ] Adicionar estoque (qty)
- [ ] Ajustar estoque (delta + motivo)
- [ ] Registrar custo por lote (rateio)
- [ ] Cálculo de unit_total_cost
- [ ] Alertas de estoque baixo (dashboard + filtro)

---

### FASE 7 — Caixa
**Objetivo**: Sessão de operador, movimentos, fechamento.

- [ ] Abrir caixa (operador + valor inicial)
- [ ] Movimentos: sangria/suprimento/ajuste
- [ ] Fechar caixa:
  - Resumo por forma de pagamento
  - Valores contados vs sistema
  - Divergência
- [ ] Audit log obrigatório
- [ ] Bloqueio: vendas só com caixa aberto

---

### FASE 8 — PDV
**Objetivo**: Carrinho, barcode scanner, multi-pagamento, troco.

- [ ] Entrada de produtos (barcode + manual)
- [ ] Carrinho: itens, qty, remover
- [ ] Descontos/cupom (conforme permissão)
- [ ] Ocultar margem/lucro para vendedor
- [ ] Checkout:
  - Seleção de pagamentos (pix, crédito, débito, dinheiro)
  - Dinheiro: cash_received + cálculo de troco
  - Cliente opcional
- [ ] Persistência forte: sale_intent → sale
- [ ] Impressão 80mm (window.print + CSS)

---

### FASE 9 — CRM e Fidelidade
**Objetivo**: CRUD de clientes, programa de fidelidade.

- [ ] CRUD clientes (soft delete)
- [ ] Config de fidelidade (admin/manager):
  - Pontuação
  - Vale-compra após X compras
  - Cashback (expirável ou não)
- [ ] Ledger de fidelidade
- [ ] Comprovante: gerar para copiar/baixar
- [ ] Canhoto imprimível

---

### FASE 10 — Dashboard e Relatórios
**Objetivo**: Cards, gráficos, filtros por role.

- [ ] Dashboard:
  - Resumo dia/semana/mês
  - Alertas (estoque baixo, vendas pendentes, caixa aberto)
  - Filtros por role/escopo
- [ ] Relatórios:
  - Vendas no tempo (linha)
  - Vendas por pagamento (barra/pizza)
  - Produtos mais vendidos (barra)
  - Ticket médio (linha)
  - Horários de pico (barras)
  - Clientes recorrentes vs novos
  - Margem/lucro (apenas com permissão)

---

### FASE 11 — Jobs, Audit e Polimento
**Objetivo**: Reprocessamento, logs, UX final.

- [ ] Jobs queue: reprocessar sale_intents pendentes
- [ ] Audit logs completos
- [ ] Polimento de UX
- [ ] Documentação TSDoc
- [ ] Manual de implementação final

---

## Mapeamento de Permissões por Role

### Permissões Default

| Permissão | Admin | Manager | Salesperson |
|---|---|---|---|
| **Acesso Geral** | | | |
| can_access_dashboard | ✅ | ✅ | ✅ |
| can_access_reports | ✅ | ✅ | ❌ |
| can_access_pdv | ✅ | ✅ | ✅ |
| can_access_products | ✅ | ✅ | ✅ (somente leitura) |
| can_access_categories | ✅ | ✅ | ❌ |
| can_access_crm | ✅ | ✅ | ❌ |
| can_access_cash | ✅ | ✅ | ✅ |
| can_access_users | ✅ | ❌ | ❌ |
| can_access_settings | ✅ | ❌ | ❌ |
| **PDV** | | | |
| can_create_sale | ✅ | ✅ | ✅ |
| can_apply_discount | ✅ | ✅ | ❌ |
| can_use_coupon | ✅ | ✅ | ❌ |
| can_cancel_sale | ✅ | ✅ | ❌ |
| can_edit_cart_items | ✅ | ✅ | ✅ |
| **Caixa** | | | |
| can_open_cash_session | ✅ | ✅ | ✅ |
| can_close_cash_session | ✅ | ✅ | ✅ |
| can_register_cash_movement | ✅ | ✅ | ❌ |
| can_view_cash_summary | ✅ | ✅ | ❌ |
| **Produtos/Estoque** | | | |
| can_create_product | ✅ | ✅ | ❌ |
| can_edit_product | ✅ | ✅ | ❌ |
| can_soft_delete_product | ✅ | ✅ | ❌ |
| can_manage_min_stock | ✅ | ✅ | ❌ |
| can_adjust_stock | ✅ | ✅ | ❌ |
| **Custos e Lucro** | | | |
| can_view_cost | ✅ | ✅ | ❌ |
| can_edit_cost | ✅ | ❌ | ❌ |
| can_view_margin | ✅ | ✅ | ❌ |
| can_view_profit_reports | ✅ | ✅ | ❌ |
| **CRM** | | | |
| can_create_customer | ✅ | ✅ | ❌ |
| can_edit_customer | ✅ | ✅ | ❌ |
| can_delete_customer | ✅ | ❌ | ❌ |
| can_configure_loyalty_rules | ✅ | ❌ | ❌ |
| **Usuários** | | | |
| can_create_user | ✅ | ❌ | ❌ |
| can_edit_user | ✅ | ❌ | ❌ |
| can_disable_user | ✅ | ❌ | ❌ |
| can_manage_permissions_matrix | ✅ | ❌ | ❌ |
| **Escopo de Dados** | | | |
| can_view_all_employees_data | ✅ | ❌ | ❌ |
| can_view_team_data | ❌ | ✅ | ❌ |
| can_view_own_data_only | ❌ | ❌ | ✅ |

### Regras de Visualização (Dashboard/Relatórios)
- **Admin**: filtra por qualquer funcionário ou vê tudo
- **Manager**: vê dados próprios + vendedores (não outros managers/admins)
- **Salesperson**: somente dados próprios

---

## Secrets Necessários

| Secret | Uso | Onde |
|---|---|---|
| `ACCESS_SECRET_KEY` | Chave pré-login do cliente | Edge Functions |
| `JWT_SECRET` | Assinatura de JWT | Edge Functions |
| `DEFAULT_PASSWORD` | Senha padrão novos usuários | Edge Functions |

> Secrets existentes (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, etc.) serão reutilizados.

---

## Progresso

| Fase | Status | Data Início | Data Conclusão |
|---|---|---|---|
| 0 - Fundação | 🔲 Pendente | | |
| 1 - Banco de Dados | 🔲 Pendente | | |
| 2 - Autenticação | 🔲 Pendente | | |
| 3 - Layout e Rotas | 🔲 Pendente | | |
| 4 - Onboarding/Usuários | 🔲 Pendente | | |
| 5 - Categorias/Produtos | 🔲 Pendente | | |
| 6 - Estoque | 🔲 Pendente | | |
| 7 - Caixa | 🔲 Pendente | | |
| 8 - PDV | 🔲 Pendente | | |
| 9 - CRM/Fidelidade | 🔲 Pendente | | |
| 10 - Dashboard/Relatórios | 🔲 Pendente | | |
| 11 - Jobs/Audit/Polimento | 🔲 Pendente | | |
