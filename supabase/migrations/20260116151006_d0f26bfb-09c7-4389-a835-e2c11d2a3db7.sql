-- Adicionar coluna de nível de criticidade aos projetos (1-5, sendo 5 o mais alto)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS criticality_level INTEGER DEFAULT 3 CHECK (criticality_level >= 1 AND criticality_level <= 5);

-- Comentário explicativo
COMMENT ON COLUMN public.projects.criticality_level IS 'Nível de criticidade/importância do projeto (1=baixo, 5=alto). Usado para ordenação inteligente.';

-- Criar índice para ordenação eficiente
CREATE INDEX IF NOT EXISTS idx_projects_criticality_deadline ON public.projects(criticality_level DESC, deadline ASC);