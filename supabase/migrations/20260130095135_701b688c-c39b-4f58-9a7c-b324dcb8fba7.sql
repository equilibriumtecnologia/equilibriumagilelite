-- Adicionar coluna story_points na tabela tasks
ALTER TABLE public.tasks ADD COLUMN story_points INTEGER DEFAULT NULL;

-- Criar tabela de configurações do board para WIP limits
CREATE TABLE public.board_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  column_id TEXT NOT NULL,
  wip_limit INTEGER DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, column_id)
);

-- Habilitar RLS
ALTER TABLE public.board_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para board_settings
CREATE POLICY "Project members can view board settings"
ON public.board_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = board_settings.project_id
    AND pm.user_id = auth.uid()
  )
);

CREATE POLICY "Project creators and admins can manage board settings"
ON public.board_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = board_settings.project_id
    AND (p.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = board_settings.project_id
    AND (p.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role))
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_board_settings_updated_at
BEFORE UPDATE ON public.board_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();