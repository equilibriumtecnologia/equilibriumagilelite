
-- Create project_templates table
CREATE TABLE public.project_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'development', 'marketing', 'custom'
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;

-- Policies: workspace members can view templates in their workspace
CREATE POLICY "Workspace members can view templates"
ON public.project_templates
FOR SELECT
USING (
  is_workspace_member(auth.uid(), workspace_id)
  OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_workspace(auth.uid(), workspace_id))
);

-- Owner/admin/master can create templates
CREATE POLICY "Authorized users can create templates"
ON public.project_templates
FOR INSERT
WITH CHECK (
  (auth.uid() = created_by AND is_workspace_member(auth.uid(), workspace_id))
  OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_workspace(auth.uid(), workspace_id))
);

-- Owner/admin/master can update templates
CREATE POLICY "Authorized users can update templates"
ON public.project_templates
FOR UPDATE
USING (
  (created_by = auth.uid())
  OR has_workspace_role(auth.uid(), workspace_id, 'owner'::workspace_role)
  OR has_workspace_role(auth.uid(), workspace_id, 'admin'::workspace_role)
  OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_workspace(auth.uid(), workspace_id))
);

-- Owner/admin/master can delete templates
CREATE POLICY "Authorized users can delete templates"
ON public.project_templates
FOR DELETE
USING (
  (created_by = auth.uid())
  OR has_workspace_role(auth.uid(), workspace_id, 'owner'::workspace_role)
  OR has_workspace_role(auth.uid(), workspace_id, 'admin'::workspace_role)
  OR (has_role(auth.uid(), 'master'::app_role) AND master_can_access_workspace(auth.uid(), workspace_id))
);

-- Trigger for updated_at
CREATE TRIGGER update_project_templates_updated_at
BEFORE UPDATE ON public.project_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to seed default templates when a workspace is created
CREATE OR REPLACE FUNCTION public.seed_default_templates_for_workspace()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Seed 3 default templates for the new workspace
  INSERT INTO public.project_templates (workspace_id, name, description, category, is_public, config) VALUES
  (
    NEW.id,
    'Desenvolvimento de Software',
    'Template padrão para projetos de desenvolvimento com colunas e categorias pré-configuradas.',
    'development',
    false,
    '{
      "columns": ["todo", "in_progress", "review", "completed"],
      "column_labels": {"todo": "A Fazer", "in_progress": "Em Progresso", "review": "Code Review", "completed": "Concluído"},
      "column_colors": {"todo": "#6366f1", "in_progress": "#f59e0b", "review": "#8b5cf6", "completed": "#22c55e"},
      "wip_limits": {"in_progress": 5, "review": 3},
      "default_categories": ["Bug", "Feature", "Tech Debt", "Improvement"],
      "sample_tasks": [
        {"title": "Configurar ambiente de desenvolvimento", "priority": "high", "status": "todo"},
        {"title": "Definir arquitetura do projeto", "priority": "high", "status": "todo"},
        {"title": "Criar documentação inicial", "priority": "medium", "status": "todo"}
      ]
    }'::jsonb
  ),
  (
    NEW.id,
    'Marketing & Conteúdo',
    'Template para equipes de marketing com fluxo de produção de conteúdo.',
    'marketing',
    false,
    '{
      "columns": ["todo", "in_progress", "review", "completed"],
      "column_labels": {"todo": "Ideias", "in_progress": "Produção", "review": "Revisão", "completed": "Publicado"},
      "column_colors": {"todo": "#ec4899", "in_progress": "#f97316", "review": "#a855f7", "completed": "#10b981"},
      "wip_limits": {"in_progress": 4, "review": 2},
      "default_categories": ["Blog Post", "Social Media", "Newsletter", "Campanha"],
      "sample_tasks": [
        {"title": "Planejar calendário editorial", "priority": "high", "status": "todo"},
        {"title": "Criar posts para redes sociais", "priority": "medium", "status": "todo"},
        {"title": "Configurar analytics", "priority": "medium", "status": "todo"}
      ]
    }'::jsonb
  ),
  (
    NEW.id,
    'Kanban Genérico',
    'Template básico com Kanban simples para qualquer tipo de projeto.',
    'custom',
    false,
    '{
      "columns": ["todo", "in_progress", "review", "completed"],
      "column_labels": {"todo": "A Fazer", "in_progress": "Em Progresso", "review": "Revisão", "completed": "Concluído"},
      "column_colors": {},
      "wip_limits": {},
      "default_categories": [],
      "sample_tasks": []
    }'::jsonb
  );

  RETURN NEW;
END;
$$;

-- Attach trigger to workspace creation
CREATE TRIGGER seed_templates_on_workspace_create
AFTER INSERT ON public.workspaces
FOR EACH ROW
EXECUTE FUNCTION public.seed_default_templates_for_workspace();
