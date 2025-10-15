# TaskFlow - Sistema de Gestão de Projetos e Atividades

Sistema completo de gestão de projetos baseado em metodologias ágeis (Kanban/Scrum), desenvolvido para equipes e pequenas empresas. Oferece controle granular de permissões, gestão de atividades e acompanhamento visual de progresso.

## 🚀 Tecnologias

- **Frontend:** React 18 + TypeScript + Vite
- **UI:** TailwindCSS + shadcn/ui
- **Backend:** Lovable Cloud (Supabase)
- **Autenticação:** Supabase Auth
- **Banco de Dados:** PostgreSQL (Supabase)
- **Formulários:** React Hook Form + Zod
- **Roteamento:** React Router v6
- **Gerenciamento de Estado:** React Query (TanStack Query)

## 📋 Pré-requisitos

- Node.js 18+ e npm
- Conta no Lovable (para deploy e backend)

## 🛠️ Instalação Local

### 1. Clonar o repositório

```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

O arquivo `.env` é gerado automaticamente pelo Lovable Cloud quando você conecta o backend. 

**Importante:** Você NÃO precisa criar manualmente o arquivo `.env`. Ele contém:

```env
VITE_SUPABASE_URL=<seu-projeto-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<sua-chave-publica>
VITE_SUPABASE_PROJECT_ID=<seu-project-id>
```

### 4. Executar o projeto

```bash
npm run dev
```

O projeto estará disponível em `http://localhost:8080`

## 📁 Estrutura do Projeto

```
src/
├── assets/              # Imagens e assets estáticos
├── components/          # Componentes React
│   ├── ui/             # Componentes shadcn/ui
│   ├── layout/         # Layout (Sidebar, Header)
│   └── ProtectedRoute.tsx
├── contexts/           # Contexts React (Auth)
├── hooks/              # Custom hooks
├── integrations/       # Integrações (Supabase - gerado automaticamente)
├── lib/                # Utilitários
├── pages/              # Páginas da aplicação
│   ├── auth/          # Login, Signup
│   ├── Landing.tsx    # Landing page
│   ├── Dashboard.tsx  # Dashboard principal
│   └── Projects.tsx   # Listagem de projetos
└── App.tsx            # Componente raiz

supabase/
├── migrations/        # Migrações do banco de dados
└── config.toml       # Configuração do Supabase (gerado automaticamente)
```

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

**profiles** - Perfis de usuário
- `id` (UUID, PK) - Referência ao auth.users
- `full_name` (TEXT) - Nome completo
- `avatar_url` (TEXT, nullable) - URL do avatar
- `created_at`, `updated_at` (TIMESTAMPTZ)

**user_roles** - Roles e permissões
- `id` (UUID, PK)
- `user_id` (UUID, FK → profiles)
- `role` (app_role ENUM: master, admin, user)
- `created_at` (TIMESTAMPTZ)
- Constraint: UNIQUE(user_id, role)

**categories** - Categorias globais de projetos
- `id` (UUID, PK)
- `name` (TEXT, UNIQUE)
- `description` (TEXT)
- `color` (TEXT) - Classe CSS para cor
- `icon` (TEXT, nullable)
- `is_default` (BOOLEAN) - Se é categoria padrão do sistema
- `created_at`, `updated_at` (TIMESTAMPTZ)

### Funções de Segurança

**has_role(_user_id, _role)** - Verifica se usuário possui determinada role (evita recursão em RLS policies)

**handle_new_user()** - Trigger que cria automaticamente perfil e role ao registrar novo usuário

### Row Level Security (RLS)

Todas as tabelas possuem RLS habilitado com policies apropriadas:
- **profiles:** Todos podem visualizar, apenas donos podem editar
- **user_roles:** Todos autenticados podem visualizar
- **categories:** Todos autenticados podem visualizar

## 🔐 Sistema de Autenticação

### Configuração

- Auto-confirmação de email habilitada (development)
- Suporte a email + senha
- Sessões persistentes via localStorage
- Redirecionamento automático após login/signup

### Fluxo de Autenticação

1. Usuário acessa `/signup` e cria conta
2. Sistema cria automaticamente:
   - Registro em `auth.users`
   - Perfil em `profiles`
   - Role padrão em `user_roles`
3. Usuário é redirecionado para `/dashboard`
4. Rotas protegidas verificam autenticação via `ProtectedRoute`

### Primeiro Usuário Master

O primeiro usuário deve ter sua role alterada manualmente para `master`:

```sql
-- Atualizar role do primeiro usuário para master
UPDATE user_roles 
SET role = 'master' 
WHERE user_id = '<user-id>';
```

Acesse o backend pelo Lovable Cloud para executar esta query.

## 📦 Scripts Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build de produção
npm run lint         # Executa ESLint
```

## 🚀 Deploy

### Deploy via Lovable

1. Acesse o projeto no [Lovable](https://lovable.dev)
2. Clique em **Publish** no canto superior direito
3. Seu app será publicado em `<seu-projeto>.lovable.app`

### Deploy Manual (outras plataformas)

O projeto é uma aplicação React + Vite padrão e pode ser hospedado em:

- Vercel
- Netlify
- Railway
- Render
- Cloudflare Pages

**Importante:** Configure as variáveis de ambiente do Supabase na plataforma escolhida.

## 🔗 Links Úteis

- **Documentação Lovable:** [https://docs.lovable.dev](https://docs.lovable.dev)
- **shadcn/ui:** [https://ui.shadcn.com](https://ui.shadcn.com)
- **Supabase Docs:** [https://supabase.com/docs](https://supabase.com/docs)
- **React Router:** [https://reactrouter.com](https://reactrouter.com)

## 📄 Documentação de Desenvolvimento

Para histórico detalhado de todas as implementações e mudanças, consulte o arquivo [DEVELOPMENT.md](./DEVELOPMENT.md).

## 🤝 Contribuindo

Este é um projeto privado. Para contribuir:

1. Crie uma branch feature: `git checkout -b feature/nova-funcionalidade`
2. Commit suas mudanças: `git commit -m 'feat: adiciona nova funcionalidade'`
3. Push para a branch: `git push origin feature/nova-funcionalidade`
4. Abra um Pull Request

## 📝 Licença

Projeto proprietário. Todos os direitos reservados.

---

**Desenvolvido com ❤️ usando [Lovable](https://lovable.dev)**
