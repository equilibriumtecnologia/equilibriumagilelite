# Agile Lite Equilibrium

Sistema completo de gestão de projetos baseado em metodologias ágeis (Kanban e Scrum), desenvolvido para equipes e pequenas empresas que buscam organização, produtividade e acompanhamento visual de progresso.

---

## 🚀 O que é o ALE?

O **Agile Lite Equilibrium (ALE)** é uma plataforma web de gestão de projetos e atividades que combina o melhor do Kanban e do Scrum em uma interface moderna e intuitiva. Ele foi projetado para equipes que precisam de controle sem a complexidade de ferramentas enterprise.

### Principais funcionalidades

- **Board Kanban** com drag & drop, limites WIP e filtros por responsável, prioridade e sprint
- **Sprints** com planejamento, metas, velocidade e acompanhamento de progresso
- **Backlog** priorizado com ordenação manual e movimentação para sprints
- **Tarefas** com subtarefas, story points, prioridades, prazos, histórico completo e comentários com menções
- **Relatórios visuais** — Burndown, Velocity, Cumulative Flow (CFD), Cycle Time e desempenho da equipe
- **Dashboard** com cards de resumo e gráficos compactos para visão rápida do projeto
- **Workspaces** para separar times, clientes ou departamentos
- **Gestão de equipe** com papéis (Owner, Admin, Member, Viewer) e permissões granulares configuráveis
- **Convites** por e-mail com link de aceite e controle de limites por plano
- **Notificações** em tempo real para atribuições, menções e prazos
- **Categorias** personalizáveis para classificar projetos
- **Planos de assinatura** com limites de workspaces, projetos, convites e membros

### Para quem é?

- Equipes de desenvolvimento de software
- Agências e consultorias
- Freelancers gerenciando múltiplos clientes
- Pequenas empresas que querem organizar demandas sem complexidade

---

## 🛠️ Parte Técnica

### Tecnologias

| Camada | Stack |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| UI | TailwindCSS + shadcn/ui |
| Backend | Lovable Cloud (Supabase) |
| Autenticação | Supabase Auth |
| Banco de Dados | PostgreSQL |
| Formulários | React Hook Form + Zod |
| Roteamento | React Router v6 |
| Estado servidor | TanStack Query (React Query) |
| Drag & Drop | dnd-kit |
| Gráficos | Recharts |

### Pré-requisitos

- Node.js 18+ e npm/bun
- Conta no Lovable (para deploy e backend)

### Instalação local

```bash
# 1. Clonar o repositório
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# 2. Instalar dependências
npm install

# 3. Executar
npm run dev
```

O projeto estará disponível em `http://localhost:8080`.

> **Nota:** O arquivo `.env` é gerado automaticamente pelo Lovable Cloud e contém `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_SUPABASE_PROJECT_ID`.

### Estrutura do projeto

```
src/
├── assets/              # Imagens e assets estáticos
├── components/
│   ├── backlog/         # Backlog e priorização
│   ├── comments/        # Menções e comentários
│   ├── dashboard/       # Cards e gráficos do dashboard
│   ├── invitations/     # Convites por e-mail
│   ├── kanban/          # Board Kanban (colunas, cards, filtros, WIP)
│   ├── layout/          # AppLayout, Sidebar
│   ├── notifications/   # Popover de notificações
│   ├── projects/        # CRUD de projetos e membros
│   ├── reports/         # Gráficos de relatórios
│   ├── settings/        # Categorias, permissões, usuários
│   ├── sprints/         # CRUD de sprints
│   ├── tasks/           # CRUD de tarefas, subtarefas, histórico
│   ├── team/            # Cards de membros e roles
│   ├── ui/              # Componentes shadcn/ui
│   └── workspace/       # Criação e configuração de workspaces
├── contexts/            # AuthContext, WorkspaceContext
├── hooks/               # Custom hooks (useTasks, useSprints, useTeam, etc.)
├── integrations/        # Cliente Supabase (gerado automaticamente)
├── lib/                 # Utilitários
├── pages/               # Páginas da aplicação
│   └── auth/            # Login, Signup, AuthCallback
└── App.tsx              # Rotas e componente raiz

supabase/
├── functions/           # Edge Functions (notificações, convites, tarefas)
└── config.toml          # Configuração (gerado automaticamente)

docs/
├── DEVELOPMENT.md       # Histórico completo de implementações
├── STRIPE.md            # Plano de integração Stripe
├── TRAINING.md          # Script para treinamento em vídeo
├── ROADMAP.md           # Roadmap de funcionalidades
└── ...                  # Outros documentos auxiliares
```

### Sistema de permissões

| Role | Escopo | Descrição |
|---|---|---|
| `master` | Global | Controle total do sistema |
| `admin` | Global | Gerencia projetos e atividades |
| `user` | Global | Usuário padrão |
| `viewer` | Global | Apenas visualização |
| `owner` | Workspace | Dono do workspace |
| `admin` | Workspace | Administrador do workspace |
| `member` | Workspace | Membro do workspace |
| `owner` | Projeto | Criador do projeto |
| `admin` | Projeto | Administrador do projeto |
| `member` | Projeto | Membro do projeto |
| `viewer` | Projeto | Apenas visualização do projeto |

Permissões granulares são configuráveis por workspace na tabela `user_permissions`.

### Scripts disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # ESLint
```

### Deploy

- **Via Lovable:** Clique em **Publish** no canto superior direito do editor
- **Via Vercel/Netlify:** Configure as variáveis de ambiente do backend na plataforma escolhida (veja `docs/vercel-github.md`)

### Documentação adicional

- [Histórico de Desenvolvimento](./docs/DEVELOPMENT.md)
- [Integração Stripe](./docs/STRIPE.md)
- [Script de Treinamento](./docs/TRAINING.md)
- [Roadmap](./docs/ROADMAP.md)
- [Deploy via Vercel + GitHub](./docs/vercel-github.md)

---

**Desenvolvido com ❤️ usando [Lovable](https://lovable.dev)**

📝 Projeto proprietário. Todos os direitos reservados.
