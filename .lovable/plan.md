
# Plano: Introduzir Workspaces ao Schema

## Resumo

Criar uma entidade **workspace** que se torna o "dono" de todos os recursos do sistema (projetos, categorias, convites, membros). Isso desacopla a propriedade dos dados de um usuario especifico, permitindo transferencia de responsabilidade e continuidade mesmo se o usuario original perder acesso.

## Modelo Conceitual

```text
+-------------------+
|    workspaces     |
|-------------------|
| id                |
| name              |
| slug (unique)     |
| description       |
| created_at        |
| updated_at        |
+-------------------+
         |
         | 1:N
         v
+------------------------+         +-------------------+
|  workspace_members     |-------->|    profiles        |
|------------------------|         +-------------------+
| workspace_id (FK)      |
| user_id (FK)           |
| role (enum)            | <-- owner / admin / member / viewer
| joined_at              |
+------------------------+
         |
         | O workspace agrega:
         v
  projects, categories, invitations
  (todos ganham workspace_id)
```

## Mudancas no Banco de Dados

### 1. Novo enum e tabela `workspaces`

- Criar enum `workspace_role` com valores: `owner`, `admin`, `member`, `viewer`
- Criar tabela `workspaces` (id, name, slug UNIQUE, description, created_at, updated_at)
- Criar tabela `workspace_members` (workspace_id, user_id, role, joined_at) com UNIQUE(workspace_id, user_id)

### 2. Adicionar `workspace_id` nas tabelas existentes

- `projects` ganha coluna `workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE`
- `categories` ganha coluna `workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE`
- `invitations` ganha coluna `workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE`

### 3. Migracao de dados existentes

- Para cada usuario que possui projetos (distinct `created_by` em `projects`), criar um workspace automatico ("Workspace de [nome]")
- Adicionar esse usuario como `owner` em `workspace_members`
- Preencher `workspace_id` nos projetos, categorias e convites existentes
- Adicionar todos os `project_members` como `member` no workspace correspondente (deduplicando)

### 4. Tornar `workspace_id` NOT NULL

- Apos a migracao de dados, alterar a coluna para NOT NULL nas tres tabelas

### 5. Funcoes auxiliares e RLS

- Criar funcao `is_workspace_member(_user_id, _workspace_id)` SECURITY DEFINER
- Criar funcao `has_workspace_role(_user_id, _workspace_id, _role)` SECURITY DEFINER
- Atualizar RLS de `projects` para considerar membership no workspace
- Criar RLS para `workspaces` (membros podem ver, owners/admins podem editar)
- Criar RLS para `workspace_members` (membros podem ver, owners podem gerenciar)
- Ajustar RLS de `categories` para escopo de workspace
- Ajustar RLS de `invitations` para escopo de workspace

### 6. Transferencia de workspace

- Criar funcao `transfer_workspace_ownership(_workspace_id, _new_owner_id)` que:
  - Rebaixa o owner atual para admin
  - Promove o novo usuario para owner
  - So pode ser executada pelo owner atual

## Mudancas no Frontend

### Novo contexto: WorkspaceContext

- Criar `src/contexts/WorkspaceContext.tsx`
- Armazena workspace ativo do usuario
- Persiste selecao no localStorage
- Fornece `currentWorkspace`, `workspaces`, `switchWorkspace`

### Novos hooks

- `src/hooks/useWorkspaces.ts` - CRUD de workspaces
- `src/hooks/useWorkspaceMembers.ts` - Gerenciamento de membros do workspace

### Selecao de workspace

- Adicionar seletor de workspace no `AppSidebar.tsx` (dropdown no topo)
- Redirecionar para workspace padrao ao fazer login
- Exibir nome do workspace no header

### Ajuste em queries existentes

- `useProjects` - filtrar por `workspace_id` do contexto
- `useCategories` - filtrar por `workspace_id` do contexto
- `useInvitations` - filtrar por `workspace_id` do contexto
- `useTeam` - listar membros do workspace (em vez de todos os profiles)
- `CreateProjectDialog` - incluir `workspace_id` ao criar projeto

### Nova pagina de configuracoes do workspace

- Gerenciar nome/descricao do workspace
- Gerenciar membros e roles do workspace
- Transferir propriedade do workspace
- Listar workspaces do usuario

### Ajustar `useUserRole`

- Manter roles globais (`master`, `admin`, `user`) para controle do sistema
- Adicionar `workspace_role` no contexto para permissoes dentro do workspace
- Hierarquia: roles globais (`master`) sobrescrevem roles de workspace

## Impacto nas funcionalidades existentes

- **Dashboard**: Mostra dados apenas do workspace ativo
- **Projetos**: Filtrados por workspace
- **Equipe**: Mostra membros do workspace (nao todos os usuarios)
- **Convites**: Escopo de workspace
- **Sprints/Backlog**: Sem mudanca (ja sao por projeto)
- **Kanban**: Sem mudanca (ja e por projeto)

## Detalhes tecnicos

### Migracao SQL (resumo)

A migracao sera dividida em etapas dentro de um unico arquivo:
1. Criar enum + tabelas
2. Popular workspaces a partir de dados existentes
3. Adicionar foreign keys
4. Alterar para NOT NULL
5. Criar funcoes auxiliares
6. Criar/atualizar RLS policies
7. Habilitar realtime para workspaces

### Ordem de implementacao sugerida

1. Migracao do banco de dados (uma unica migracao)
2. Criar WorkspaceContext e hook useWorkspaces
3. Adicionar seletor de workspace no sidebar
4. Atualizar queries (useProjects, useCategories, useInvitations, useTeam)
5. Atualizar dialogs de criacao (projeto, convite)
6. Criar pagina de configuracoes do workspace
7. Implementar transferencia de propriedade
