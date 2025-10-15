# 📚 Histórico de Desenvolvimento - TaskFlow

Este documento registra todas as implementações, mudanças e decisões técnicas do projeto TaskFlow. É atualizado continuamente conforme o projeto evolui.

---

## 📅 Índice por Fase

- [FASE 1: Fundação (Base Essencial)](#fase-1-fundação-base-essencial)
- [Próximas Fases](#próximas-fases)

---

## FASE 1: Fundação (Base Essencial)

**Data:** 12/01/2025  
**Status:** ✅ Concluída

### 🎯 Objetivos

Estabelecer a base funcional do sistema com autenticação, estrutura de dados e layout navegável.

### 🗄️ Estrutura do Banco de Dados

#### 1. ENUM `app_role`

Criado tipo enumerado para definir os três níveis de usuário do sistema:

```sql
CREATE TYPE public.app_role AS ENUM ('master', 'admin', 'user');
```

**Níveis:**
- `master` - Controle total, configura permissões de admins
- `admin` - Gerencia projetos/atividades com permissões configuráveis
- `user` - Visualiza e atualiza apenas tarefas atribuídas

#### 2. Tabela `profiles`

Armazena informações adicionais dos usuários além do `auth.users` (gerenciado pelo Supabase).

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Decisões técnicas:**
- Foreign key para `auth.users(id)` com `ON DELETE CASCADE` para limpeza automática
- `full_name` obrigatório (NOT NULL) para identificação
- `avatar_url` opcional para foto de perfil futura
- Timestamps automáticos para auditoria

**RLS Policies:**
- ✅ Todos usuários autenticados podem **VER** todos os perfis (necessário para atribuição de tarefas)
- ✅ Usuários só podem **EDITAR** o próprio perfil

#### 3. Tabela `user_roles`

Sistema de permissões separado dos perfis (padrão de segurança).

```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);
```

**Por que tabela separada?**
- ⚠️ **SEGURANÇA CRÍTICA:** Roles não podem estar na tabela `profiles` pois isso permite escalonamento de privilégios
- Um usuário pode ter múltiplas roles (ex: admin em um projeto, user em outro)
- Constraint `UNIQUE(user_id, role)` evita duplicatas

**RLS Policies:**
- ✅ Todos podem **VER** roles (necessário para verificações de permissão)
- ❌ Ninguém pode modificar diretamente (apenas via funções administrativas futuras)

#### 4. Tabela `categories`

Categorias globais para classificação de projetos (ex: Planejamento, Execução, Revisão).

```sql
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT NOT NULL DEFAULT 'bg-primary',
  icon TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Campos importantes:**
- `color` - Armazena classe CSS (ex: `bg-accent`, `bg-success`) para consistência com design system
- `is_default` - Marca categorias padrão do sistema (não podem ser deletadas)

**Categorias padrão inseridas:**
- 📌 Planejamento (bg-primary)
- 🛠️ Execução (bg-accent)
- 📝 Revisão (bg-warning)
- ✅ Concluído (bg-success)
- ⏸️ Em Espera (bg-muted)
- 🧠 Backlog (bg-secondary)

### 🔐 Funções de Segurança

#### `has_role(_user_id, _role)`

Função crucial para evitar **recursão infinita** em RLS policies.

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

**Por que é necessária?**

Sem esta função, policies que verificam roles causariam recursão:

```sql
-- ❌ ERRADO - Causa recursão infinita
CREATE POLICY "Admins podem editar"
ON some_table
USING (
  (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin'
);

-- ✅ CORRETO - Usa função com SECURITY DEFINER
CREATE POLICY "Admins podem editar"
ON some_table
USING (public.has_role(auth.uid(), 'admin'));
```

**Propriedades importantes:**
- `SECURITY DEFINER` - Executa com privilégios do criador (contorna RLS temporariamente)
- `STABLE` - Otimização: resultado consistente durante a query
- `SET search_path = public` - Evita ataques de injection via search_path

#### `handle_new_user()`

Trigger automático que cria perfil e role quando usuário se cadastra.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Criar perfil
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Atribuir role padrão 'user'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;
```

**Funcionamento:**
1. Usuário preenche formulário de cadastro com `full_name`
2. Supabase Auth cria registro em `auth.users`
3. Trigger dispara automaticamente
4. Função lê `raw_user_meta_data` (metadata do signup)
5. Cria perfil em `profiles` e role em `user_roles`

**Fallback:** Se `full_name` não for fornecido, usa `'Usuário'` como padrão.

#### `update_updated_at_column()`

Trigger para atualizar automaticamente `updated_at` em qualquer UPDATE.

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
```

Aplicado nas tabelas `profiles` e `categories`:

```sql
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

**Correção de segurança aplicada:** Adicionado `SET search_path = public` para eliminar warning de função com search_path mutável.

### 🔐 Sistema de Autenticação

#### Configuração do Supabase Auth

- ✅ **Auto-confirmação de email habilitada** (development)
- ✅ **Signups habilitados**
- ✅ **Anonymous users desabilitados**

#### Implementação - `AuthContext`

Context React que gerencia estado global de autenticação.

**Localização:** `src/contexts/AuthContext.tsx`

**Funcionalidades:**
- Estado de `user`, `session` e `loading`
- Listener de mudanças de autenticação (`onAuthStateChange`)
- Recuperação de sessão persistente
- Funções `signUp`, `signIn`, `signOut`

**Padrão de implementação correto:**

```typescript
useEffect(() => {
  // 1. Configurar listener PRIMEIRO
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    }
  );

  // 2. DEPOIS verificar sessão existente
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setUser(session?.user ?? null);
  });

  return () => subscription.unsubscribe();
}, []);
```

**⚠️ Ordem crítica:** Listener antes de `getSession()` para não perder eventos durante inicialização.

**SignUp com metadata:**

```typescript
const signUp = async (email: string, password: string, fullName: string) => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/dashboard`,
      data: { full_name: fullName } // Vai para raw_user_meta_data
    }
  });
  // ...
};
```

O `full_name` é capturado pelo trigger `handle_new_user()` e salvo em `profiles`.

#### Páginas de Autenticação

**Login** (`src/pages/auth/Login.tsx`)
- Formulário com email + senha
- Validação de erros amigável
- Redirecionamento para `/dashboard` após sucesso
- Link para signup

**Signup** (`src/pages/auth/Signup.tsx`)
- Formulário com nome completo, email, senha e confirmação
- Validação client-side:
  - Senhas devem coincidir
  - Mínimo 6 caracteres
- Toast notifications para feedback
- Redirecionamento automático para `/dashboard`

#### ProtectedRoute Component

Componente que envolve rotas protegidas e redireciona usuários não autenticados.

**Localização:** `src/components/ProtectedRoute.tsx`

```typescript
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

**Uso:**

```typescript
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <AppLayout>
        <Dashboard />
      </AppLayout>
    </ProtectedRoute>
  }
/>
```

### 🎨 Layout e Navegação

#### AppLayout Component

Layout principal com sidebar colapsável.

**Localização:** `src/components/layout/AppLayout.tsx`

**Estrutura:**
```
<SidebarProvider>
  <AppSidebar /> <!-- Navegação lateral -->
  <main>
    <header> <!-- Botão toggle sidebar -->
    <content> <!-- Páginas -->
  </main>
</SidebarProvider>
```

**Características:**
- Sidebar responsiva (colapsa em telas pequenas)
- Header fixo com botão de toggle
- Background consistente com design system

#### AppSidebar Component

Sidebar com navegação e perfil do usuário.

**Localização:** `src/components/layout/AppSidebar.tsx`

**Menu Items:**
- 📊 Dashboard (`/dashboard`)
- 📁 Projetos (`/projects`)
- ✅ Atividades (`/activities`)
- 👥 Equipe (`/team`)
- ⚙️ Configurações (`/settings`)

**Footer:**
- Exibe email do usuário
- Botão de logout
- Adapta ao estado collapsed/expanded

**Active state:** Usa `NavLink` do React Router com classe condicional para highlight da rota ativa.

### 🎨 Design System

Atualizado em `src/index.css` e `tailwind.config.ts` com:

**Cores:**
- Primary: Azul profissional (`230 60% 45%`)
- Accent: Ciano vibrante (`185 75% 45%`)
- Success: Verde (`142 71% 45%`)
- Warning: Laranja (`38 92% 50%`)

**Gradientes:**
- `gradient-primary` - Azul → Azul claro
- `gradient-accent` - Ciano → Ciano claro
- `gradient-hero` - Azul → Ciano (para CTAs)

**Shadows:**
- `shadow-glow` - Sombra com efeito glow para botões hero
- `shadow-accent-glow` - Sombra colorida para elementos accent

**Variantes de Botão:**
```typescript
// Button variants adicionadas
hero: "bg-gradient-hero text-white hover:shadow-glow"
accent: "bg-accent text-accent-foreground hover:shadow-accent-glow"
success: "bg-success text-success-foreground"
```

### 🔄 Rotas Configuradas

```typescript
// Públicas
/ → Landing
/login → Login
/signup → Signup

// Protegidas (requerem autenticação)
/dashboard → Dashboard (com AppLayout)
/projects → Projects (com AppLayout)
```

**Padrão de proteção:**
```typescript
<Route path="/rota" element={
  <ProtectedRoute>
    <AppLayout>
      <Component />
    </AppLayout>
  </ProtectedRoute>
} />
```

### 📝 Decisões Técnicas Importantes

1. **Separação de roles da tabela profiles**
   - Previne privilege escalation
   - Permite múltiplas roles por usuário
   - Facilita auditoria

2. **Uso de SECURITY DEFINER functions**
   - Evita recursão em RLS policies
   - Centraliza lógica de verificação de permissões
   - Melhora performance de queries

3. **Auto-confirmação de email em development**
   - Acelera testes durante desenvolvimento
   - Deve ser desabilitado em produção
   - Facilita iteração rápida

4. **Trigger automático de criação de perfil**
   - Garante consistência de dados
   - Elimina necessidade de lógica client-side
   - Captura metadata do signup

5. **Context de autenticação global**
   - Single source of truth para auth state
   - Facilita acesso em qualquer componente
   - Gerencia listener e sessão automaticamente

### 🔧 Como Testar a FASE 1

1. **Criar primeiro usuário:**
   ```bash
   npm run dev
   # Acessar http://localhost:8080/signup
   # Preencher formulário e criar conta
   ```

2. **Promover a Master (via Lovable Cloud):**
   ```sql
   -- Buscar ID do usuário
   SELECT id, email FROM auth.users;
   
   -- Atualizar role
   UPDATE user_roles 
   SET role = 'master' 
   WHERE user_id = '<user-id-do-passo-anterior>';
   ```

3. **Testar funcionalidades:**
   - ✅ Signup cria perfil e role automaticamente
   - ✅ Login redireciona para dashboard
   - ✅ Rotas protegidas bloqueiam acesso sem auth
   - ✅ Sidebar funciona e colapsa corretamente
   - ✅ Logout limpa sessão e redireciona para landing

### 📊 Estado Atual

**Tabelas criadas:** 3
- `profiles`
- `user_roles`
- `categories`

**Funções criadas:** 3
- `has_role()`
- `handle_new_user()`
- `update_updated_at_column()`

**Triggers criados:** 3
- `on_auth_user_created`
- `update_profiles_updated_at`
- `update_categories_updated_at`

**Páginas implementadas:** 5
- Landing (pública)
- Login (pública)
- Signup (pública)
- Dashboard (protegida)
- Projects (protegida)

**Componentes de layout:** 3
- `AuthContext`
- `ProtectedRoute`
- `AppLayout` + `AppSidebar`

### ⚠️ Conhecidos Issues / TODOs

1. **Master inicial manual:** Primeiro usuário precisa ser promovido manualmente via SQL
   - **Solução futura:** Criar interface de setup inicial

2. **Páginas placeholder:** `/activities`, `/team`, `/settings` ainda não implementadas
   - **Próxima fase:** FASE 2 e 3

3. **Sem recuperação de senha:** Fluxo não implementado ainda
   - **Próxima fase:** Adicionar reset password

4. **Categorias fixas:** Não há CRUD de categorias ainda
   - **Próxima fase:** Interface de gerenciamento

---

## Próximas Fases

### FASE 2: Gestão de Projetos
- Tabela `projects` com foreign keys
- CRUD completo de projetos
- Upload de imagens (storage buckets)
- Filtros e busca
- **Previsão:** Próxima implementação

### FASE 3: Sistema de Atividades/Tarefas
- Tabela `activities`
- Board Kanban
- Atribuição de responsáveis
- Comentários e histórico
- **Previsão:** A definir

---

**Última atualização:** 12/01/2025  
**Versão:** FASE 1 completa
