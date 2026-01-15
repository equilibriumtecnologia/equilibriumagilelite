-- Fase 2: Sistema de Gerenciamento de Projetos

-- 1. Tabela de status de projetos
CREATE TYPE public.project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');

-- 2. Tabela de projetos
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  status public.project_status NOT NULL DEFAULT 'planning',
  deadline DATE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Tabela de membros do projeto (many-to-many)
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- 4. Tabela de tarefas
CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'review', 'completed');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status public.task_status NOT NULL DEFAULT 'todo',
  priority public.task_priority NOT NULL DEFAULT 'medium',
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date DATE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Habilitar RLS em todas as tabelas
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies para projects
-- Usuários podem ver projetos onde são membros
CREATE POLICY "Users can view projects they are members of"
  ON public.projects FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.project_members 
      WHERE project_id = projects.id
    )
    OR created_by = auth.uid()
  );

-- Usuários autenticados podem criar projetos
CREATE POLICY "Authenticated users can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Criadores e admins podem atualizar projetos
CREATE POLICY "Project creators can update their projects"
  ON public.projects FOR UPDATE
  USING (
    created_by = auth.uid() 
    OR public.has_role(auth.uid(), 'admin')
  );

-- Criadores e admins podem deletar projetos
CREATE POLICY "Project creators can delete their projects"
  ON public.projects FOR DELETE
  USING (
    created_by = auth.uid() 
    OR public.has_role(auth.uid(), 'admin')
  );

-- 7. RLS Policies para project_members
CREATE POLICY "Users can view members of their projects"
  ON public.project_members FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.project_members pm 
      WHERE pm.project_id = project_members.project_id
    )
  );

CREATE POLICY "Project creators can add members"
  ON public.project_members FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT created_by FROM public.projects 
      WHERE id = project_id
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Project creators can remove members"
  ON public.project_members FOR DELETE
  USING (
    auth.uid() IN (
      SELECT created_by FROM public.projects 
      WHERE id = project_id
    )
    OR public.has_role(auth.uid(), 'admin')
  );

-- 8. RLS Policies para tasks
CREATE POLICY "Users can view tasks from their projects"
  ON public.tasks FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.project_members 
      WHERE project_id = tasks.project_id
    )
  );

CREATE POLICY "Project members can create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.project_members 
      WHERE project_id = tasks.project_id
    )
  );

CREATE POLICY "Project members can update tasks"
  ON public.tasks FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.project_members 
      WHERE project_id = tasks.project_id
    )
  );

CREATE POLICY "Project members can delete tasks"
  ON public.tasks FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.project_members 
      WHERE project_id = tasks.project_id
    )
  );

-- 9. Triggers para updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Trigger para adicionar criador como membro automaticamente
CREATE OR REPLACE FUNCTION public.add_creator_as_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER add_creator_as_member_trigger
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.add_creator_as_member();

-- 11. Inserir categorias padrão
INSERT INTO public.categories (name, description, color, icon, is_default) VALUES
  ('Desenvolvimento', 'Projetos de desenvolvimento de software', 'bg-blue-500', 'Code', true),
  ('Design', 'Projetos de design e UI/UX', 'bg-purple-500', 'Palette', true),
  ('Marketing', 'Projetos de marketing e comunicação', 'bg-green-500', 'Megaphone', true),
  ('Vendas', 'Projetos relacionados a vendas', 'bg-yellow-500', 'DollarSign', true),
  ('Outros', 'Projetos diversos', 'bg-gray-500', 'Folder', true);