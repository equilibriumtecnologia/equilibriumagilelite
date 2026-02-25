# Agile Lite Equilibrium - Relatório Completo do Projeto

## 📋 Visão Geral

**Agile Lite Equilibrium** é um sistema moderno de gestão de projetos e atividades, desenvolvido com foco em equipes ágeis e pequenas empresas. O projeto utiliza uma abordagem híbrida Kanban-Scrum, permitindo flexibilidade na gestão de tarefas e acompanhamento de progresso.

### Tecnologias Principais

| Categoria      | Tecnologia                 |
| -------------- | -------------------------- |
| Frontend       | React 18, TypeScript, Vite |
| Estilização    | Tailwind CSS, shadcn/ui    |
| Backend        | Supabase (Lovable Cloud)   |
| Autenticação   | Supabase Auth              |
| Banco de Dados | PostgreSQL (Supabase)      |
| Estado         | React Query, Context API   |
| Roteamento     | React Router v6            |
| Drag & Drop    | @dnd-kit                   |
| Validação      | Zod, React Hook Form       |

---

## 🗺️ Estrutura de Rotas

### Rotas Públicas

| Rota                 | Componente       | Descrição                                          |
| -------------------- | ---------------- | -------------------------------------------------- |
| `/`                  | Landing          | Página inicial pública com apresentação do sistema |
| `/login`             | Login            | Formulário de autenticação de usuários             |
| `/signup`            | Signup           | Cadastro de novos usuários                         |
| `/auth/callback`     | AuthCallback     | Callback para autenticação OAuth                   |
| `/accept-invitation` | AcceptInvitation | Aceite de convites para projetos/sistema           |

### Rotas Protegidas (Requer Autenticação)

| Rota            | Componente     | Descrição                            |
| --------------- | -------------- | ------------------------------------ |
| `/dashboard`    | Dashboard      | Painel principal com visão geral     |
| `/projects`     | Projects       | Lista e gestão de projetos           |
| `/projects/:id` | ProjectDetails | Detalhes de um projeto específico    |
| `/tasks`        | Activities     | Lista e gestão de atividades/tarefas |
| `/team`         | Team           | Gestão de membros da equipe          |
| `/invitations`  | Invitations    | Gerenciamento de convites enviados   |
| `/settings`     | Settings       | Configurações do usuário e sistema   |

---

## 📄 Detalhamento por Página

### 1. Landing Page (`/`)

**Arquivo:** `src/pages/Landing.tsx`

**Propósito:** Página de entrada pública para visitantes não autenticados.

**Funcionalidades:**

- Navegação com logo e botões de acesso (Entrar/Começar Grátis)
- Hero section com título, descrição e CTAs principais
- Imagem de demonstração do dashboard
- Seção de features destacando:
  - Dashboard Visual
  - Gestão de Equipes
  - Automação Inteligente
- Lista de benefícios do sistema
- CTA final para conversão
- Footer com copyright

**Elementos de UI:**

- Gradientes personalizados (hero, primary, accent)
- Cards com hover effects
- Botões com variantes (hero, outline, ghost)
- Layout responsivo (mobile-first)

---

### 2. Dashboard (`/dashboard`)

**Arquivo:** `src/pages/Dashboard.tsx`

**Propósito:** Visão geral consolidada de todos os projetos e atividades do usuário.

**Funcionalidades:**

1. **Cards de Estatísticas:**
   - Total de Projetos Ativos
   - Tarefas Concluídas (agregado de todos os projetos)
   - Tarefas Em Andamento
   - Projetos Próximos do Prazo (< 7 dias)

2. **Projetos Recentes:**
   - Lista dos 3 projetos mais recentes
   - Exibe nome, status e progresso (tarefas concluídas/total)
   - Navegação direta para detalhes do projeto

3. **Próximas Tarefas:**
   - Placeholder com link para página de Atividades

4. **Ações Rápidas:**
   - Botão "Criar Projeto" via dialog

**Dados Utilizados:**

- Hook `useProjects` para buscar todos os projetos do usuário
- Cálculos agregados de tarefas por status
- Filtro de prazos próximos (7 dias)

---

### 3. Projetos (`/projects`)

**Arquivo:** `src/pages/Projects.tsx`

**Propósito:** Listagem e gestão completa de todos os projetos.

**Funcionalidades:**

1. **Listagem de Projetos:**
   - Grid responsivo (1/2/3 colunas)
   - Cards com informações resumidas
   - Ordenação inteligente por criticidade e prazo

2. **Busca e Filtros:**
   - Campo de busca por nome
   - Botão de filtros (placeholder para expansão)

3. **Criação de Projetos:**
   - Dialog para criar novo projeto
   - Campos: nome, descrição, categoria, prazo, criticidade

4. **Ordenação Inteligente:**
   - Projetos urgentes (< 5 dias) são priorizados
   - Criticidade efetiva calculada dinamicamente
   - Ordenação secundária por nome

**Componentes Utilizados:**

- `CreateProjectDialog`
- `ProjectCard`

---

### 4. Detalhes do Projeto (`/projects/:id`)

**Arquivo:** `src/pages/ProjectDetails.tsx`

**Propósito:** Visualização completa de um projeto específico com gestão de tarefas e equipe.

**Funcionalidades:**

1. **Cabeçalho:**
   - Nome do projeto com ações (editar, excluir)
   - Descrição do projeto
   - Botão "Nova Tarefa"

2. **Cards de Informação:**
   - Tarefas (concluídas/total)
   - Membros da equipe
   - Status do projeto (badge colorido)
   - Prazo com formatação brasileira

3. **Barra de Progresso:**
   - Cálculo percentual de conclusão
   - Atualização em tempo real

4. **Visualização de Tarefas (Tabs):**
   - **Kanban:** Board visual com drag-and-drop
   - **Lista:** Visualização em cards verticais

5. **Gestão de Equipe:**
   - Lista de membros com avatar e role
   - Adicionar novos membros
   - Remover membros (exceto owner)

**Componentes Utilizados:**

- `KanbanBoard`, `TaskCard`
- `AddMemberDialog`, `RemoveMemberDialog`
- `EditProjectDialog`, `DeleteProjectDialog`
- `CreateTaskDialog`

---

### 5. Atividades (`/tasks`)

**Arquivo:** `src/pages/Activities.tsx`

**Propósito:** Visualização centralizada de todas as tarefas do usuário.

**Funcionalidades:**

1. **Listagem de Tarefas:**
   - Todas as tarefas de todos os projetos
   - Suporte a filtro por projeto via query param

2. **Filtros:**
   - Busca por título ou descrição
   - Filtro por prioridade (Baixa, Média, Alta, Urgente)
   - Tabs por status (Todas, A Fazer, Em Progresso, Revisão, Concluídas)

3. **Criação de Tarefas:**
   - Dialog para nova atividade
   - Seleção de projeto obrigatória

4. **Contadores:**
   - Exibe quantidade de tarefas por status nas tabs

**Componentes Utilizados:**

- `TaskCard`
- `CreateTaskDialog`

---

### 6. Equipe (`/team`)

**Arquivo:** `src/pages/Team.tsx`

**Propósito:** Gestão de membros da equipe e visualização de estatísticas de desempenho.

**Funcionalidades:**

1. **Estatísticas Gerais:**
   - Total de Membros
   - Projetos Ativos (agregado)
   - Tarefas Concluídas/Total
   - Taxa Média de Conclusão

2. **Listagem de Membros:**
   - Cards com avatar, nome e role
   - Estatísticas individuais (projetos, tarefas)

3. **Filtros:**
   - Busca por nome
   - Filtro por role (Master, Admin, Usuário)
   - Tabs: Todos, Ativos, Inativos

4. **Convites:**
   - Botão para convidar novos usuários (admin/master)

**Componentes Utilizados:**

- `TeamMemberCard`
- `InviteUserDialog`

---

### 7. Convites (`/invitations`)

**Arquivo:** `src/pages/Invitations.tsx`

**Propósito:** Gerenciamento de convites enviados pelo usuário.

**Funcionalidades:**

- Lista de convites pendentes, aceitos e expirados
- Status e data de envio
- Cancelamento de convites pendentes

---

### 8. Configurações (`/settings`)

**Arquivo:** `src/pages/Settings.tsx`

**Propósito:** Configurações pessoais e do sistema.

**Funcionalidades:**

1. **Tab Perfil:**
   - Edição de nome completo
   - URL do avatar
   - Botão salvar com feedback

2. **Tab Conta:**
   - Visualização de email (readonly)
   - Visualização de role (readonly)

3. **Tab Categorias (Admin/Master):**
   - CRUD de categorias de projetos
   - Nome, descrição, cor e ícone

4. **Tab Usuários (Master apenas):**
   - Lista de todos os usuários
   - Alteração de roles
   - Visualização de estatísticas

**Componentes Utilizados:**

- `CategoriesManagement`
- `UsersManagement`

---

## 🧩 Componentes Principais

### Kanban Board

**Arquivos:**

- `src/components/kanban/KanbanBoard.tsx`
- `src/components/kanban/KanbanColumn.tsx`
- `src/components/kanban/KanbanTaskCard.tsx`
- `src/components/kanban/StatusChangeDialog.tsx`

**Funcionalidades:**

- 4 colunas: A Fazer, Em Progresso, Em Revisão, Concluído
- Drag-and-drop com @dnd-kit
- Validação de mudança de status com comentário obrigatório
- Registro no histórico de tarefas
- Badge de progresso de sub-tarefas

### Task Details Dialog

**Arquivo:** `src/components/tasks/TaskDetailsDialog.tsx`

**Funcionalidades:**

- Visualização completa da tarefa
- Tabs: Detalhes, Checklist (Sub-tarefas), Histórico
- Métricas de tempo
- Edição e exclusão da tarefa

### Sub-Tasks (Checklist)

**Arquivo:** `src/components/tasks/SubTasksList.tsx`

**Funcionalidades:**

- Criação de sub-tarefas
- Toggle com confirmação
- Exclusão com confirmação
- Cálculo de progresso

---

## 🔐 Sistema de Permissões

### Roles Disponíveis

| Role     | Descrição           | Permissões                             |
| -------- | ------------------- | -------------------------------------- |
| `master` | Administrador geral | Acesso total, gestão de usuários       |
| `admin`  | Administrador       | Gestão de categorias, convites globais |
| `user`   | Usuário padrão      | Projetos próprios e atribuídos         |

### RLS Policies Principais

- **Projetos:** Visíveis apenas para membros ou criador
- **Tarefas:** Acessíveis por membros do projeto
- **Sub-tarefas:** Permissões baseadas na tarefa pai
- **Categorias:** Visualização pública, edição restrita a admin/master
- **Convites:** Gerenciados por admin/master ou criador do projeto

---

## 📊 Banco de Dados

### Tabelas Principais

| Tabela            | Descrição                         |
| ----------------- | --------------------------------- |
| `profiles`        | Perfis de usuários (nome, avatar) |
| `user_roles`      | Roles dos usuários no sistema     |
| `categories`      | Categorias de projetos            |
| `projects`        | Projetos                          |
| `project_members` | Membros de cada projeto           |
| `tasks`           | Tarefas dos projetos              |
| `sub_tasks`       | Sub-tarefas (checklist)           |
| `task_history`    | Histórico de alterações           |
| `invitations`     | Convites de acesso                |

### Funções do Banco

- `has_role()` - Verifica role do usuário
- `is_project_member()` - Verifica participação em projeto
- `shares_project_with()` - Verifica projetos em comum
- `accept_invitation()` - Processa aceite de convite
- `get_user_email_for_notification()` - Busca email para notificações

---

## 🔔 Sistema de Notificações

### Edge Functions

**`send-invitation-email`**

- Envia email de convite com link de aceite
- Template HTML estilizado

**`send-task-notification`**

- Notifica sobre atribuição de tarefas
- Notifica sobre mudanças de status

---

## 📱 Responsividade

O sistema é totalmente responsivo com breakpoints:

- Mobile: 1 coluna
- Tablet (md): 2 colunas
- Desktop (lg): 3-4 colunas

Sidebar colapsável em dispositivos móveis via `SidebarProvider`.

---

## 🎨 Design System

### Cores Semânticas

- `--primary` / `--primary-foreground`
- `--secondary` / `--secondary-foreground`
- `--accent` / `--accent-foreground`
- `--muted` / `--muted-foreground`
- `--success` / `--warning` / `--destructive`

### Gradientes

- `bg-gradient-primary`
- `bg-gradient-hero`
- `bg-gradient-accent`
- `bg-gradient-card`

### Componentes UI

Baseados em shadcn/ui com customizações:

- Button (variantes: default, hero, outline, ghost)
- Card, Badge, Avatar
- Dialog, Tabs, Select
- Toast, Sonner

---

## 📝 Conclusão

O Agile Lite Equilibrium é um sistema robusto e bem estruturado para gestão de projetos, oferecendo:

1. **Autenticação completa** com controle de acesso granular
2. **Gestão de projetos** com categorias e criticidade
3. **Kanban interativo** com drag-and-drop
4. **Sistema de tarefas** com sub-tarefas e histórico
5. **Gestão de equipe** com convites e roles
6. **Notificações por email** automatizadas
7. **Interface moderna** e responsiva

O código segue boas práticas de organização, com hooks customizados, componentes reutilizáveis e separação clara de responsabilidades.
