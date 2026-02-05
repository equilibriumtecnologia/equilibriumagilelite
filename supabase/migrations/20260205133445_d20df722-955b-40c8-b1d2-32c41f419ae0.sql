-- Criar enum para status de sprint
CREATE TYPE sprint_status AS ENUM ('planning', 'active', 'completed', 'cancelled');

-- Criar tabela de sprints
CREATE TABLE public.sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  goal TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status sprint_status DEFAULT 'planning',
  velocity INTEGER DEFAULT NULL,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar referência de sprint nas tarefas
ALTER TABLE public.tasks
ADD COLUMN sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL;

-- Adicionar campo de ordenação no backlog
ALTER TABLE public.tasks
ADD COLUMN backlog_order INTEGER DEFAULT 0;

-- Habilitar RLS
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;

-- Políticas para sprints
CREATE POLICY "Project members can view sprints"
ON public.sprints
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = sprints.project_id
    AND pm.user_id = auth.uid()
  )
);

CREATE POLICY "Project creators and admins can create sprints"
ON public.sprints
FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = sprints.project_id
      AND (p.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role))
    )
  )
);

CREATE POLICY "Project creators and admins can update sprints"
ON public.sprints
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = sprints.project_id
    AND (p.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role))
  )
);

CREATE POLICY "Project creators and admins can delete sprints"
ON public.sprints
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = sprints.project_id
    AND (p.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role))
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_sprints_updated_at
BEFORE UPDATE ON public.sprints
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime para sprints
ALTER PUBLICATION supabase_realtime ADD TABLE public.sprints;