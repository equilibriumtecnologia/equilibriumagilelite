
-- 1. Criar enum workspace_role
CREATE TYPE public.workspace_role AS ENUM ('owner', 'admin', 'member', 'viewer');

-- 2. Criar tabela workspaces
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Criar tabela workspace_members
CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role workspace_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- 4. Adicionar workspace_id (nullable primeiro) nas tabelas existentes
ALTER TABLE public.projects ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.categories ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.invitations ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- 5. Migrar dados existentes: criar workspaces para cada criador de projeto
DO $$
DECLARE
  r RECORD;
  ws_id UUID;
  ws_slug TEXT;
  counter INT := 0;
BEGIN
  FOR r IN
    SELECT DISTINCT p.created_by, pr.full_name
    FROM public.projects p
    JOIN public.profiles pr ON pr.id = p.created_by
  LOOP
    counter := counter + 1;
    ws_slug := 'workspace-' || counter || '-' || substr(r.created_by::text, 1, 8);
    
    INSERT INTO public.workspaces (name, slug, description)
    VALUES (
      'Workspace de ' || COALESCE(r.full_name, 'Usuário'),
      ws_slug,
      'Workspace criado automaticamente'
    )
    RETURNING id INTO ws_id;

    -- Adicionar criador como owner
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (ws_id, r.created_by, 'owner');

    -- Atualizar projetos deste criador
    UPDATE public.projects SET workspace_id = ws_id WHERE created_by = r.created_by;

    -- Adicionar project_members como members do workspace (deduplicando)
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    SELECT DISTINCT ws_id, pm.user_id, 'member'::workspace_role
    FROM public.project_members pm
    JOIN public.projects proj ON proj.id = pm.project_id
    WHERE proj.created_by = r.created_by
      AND pm.user_id != r.created_by
    ON CONFLICT (workspace_id, user_id) DO NOTHING;
  END LOOP;

  -- Atribuir categorias ao primeiro workspace existente (categorias são globais agora vão para o primeiro)
  IF EXISTS (SELECT 1 FROM public.workspaces LIMIT 1) THEN
    UPDATE public.categories SET workspace_id = (SELECT id FROM public.workspaces ORDER BY created_at LIMIT 1)
    WHERE workspace_id IS NULL;
  END IF;

  -- Atribuir convites ao workspace do projeto associado, ou ao workspace do convidante
  UPDATE public.invitations i
  SET workspace_id = p.workspace_id
  FROM public.projects p
  WHERE i.project_id = p.id AND i.workspace_id IS NULL;

  UPDATE public.invitations i
  SET workspace_id = (
    SELECT wm.workspace_id FROM public.workspace_members wm
    WHERE wm.user_id = i.invited_by
    ORDER BY wm.joined_at LIMIT 1
  )
  WHERE i.workspace_id IS NULL;
END $$;

-- 6. Criar workspaces para usuários sem projetos mas que existem no sistema
DO $$
DECLARE
  r RECORD;
  ws_id UUID;
BEGIN
  FOR r IN
    SELECT p.id, p.full_name
    FROM public.profiles p
    WHERE NOT EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.user_id = p.id)
  LOOP
    INSERT INTO public.workspaces (name, slug, description)
    VALUES (
      'Workspace de ' || COALESCE(r.full_name, 'Usuário'),
      'ws-' || substr(r.id::text, 1, 12),
      'Workspace pessoal'
    )
    RETURNING id INTO ws_id;

    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (ws_id, r.id, 'owner');
  END LOOP;
END $$;

-- 7. Tornar workspace_id NOT NULL (projetos sem workspace recebem tratamento)
-- Primeiro garantir que não há NULLs restantes
DO $$
DECLARE
  default_ws UUID;
BEGIN
  SELECT id INTO default_ws FROM public.workspaces ORDER BY created_at LIMIT 1;
  IF default_ws IS NOT NULL THEN
    UPDATE public.projects SET workspace_id = default_ws WHERE workspace_id IS NULL;
    UPDATE public.categories SET workspace_id = default_ws WHERE workspace_id IS NULL;
    UPDATE public.invitations SET workspace_id = default_ws WHERE workspace_id IS NULL;
  END IF;
END $$;

ALTER TABLE public.projects ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.categories ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.invitations ALTER COLUMN workspace_id SET NOT NULL;

-- 8. Trigger de updated_at para workspaces
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Funções auxiliares SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id UUID, _workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id
  )
$$;

CREATE OR REPLACE FUNCTION public.has_workspace_role(_user_id UUID, _workspace_id UUID, _role workspace_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id
      AND workspace_id = _workspace_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_workspace_role(_user_id UUID, _workspace_id UUID)
RETURNS workspace_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.workspace_members
  WHERE user_id = _user_id AND workspace_id = _workspace_id
  LIMIT 1
$$;

-- 10. Transferência de workspace
CREATE OR REPLACE FUNCTION public.transfer_workspace_ownership(_workspace_id UUID, _new_owner_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_owner_id UUID;
BEGIN
  -- Verificar se caller é o owner atual
  SELECT user_id INTO _current_owner_id
  FROM public.workspace_members
  WHERE workspace_id = _workspace_id AND role = 'owner';

  IF _current_owner_id IS NULL OR _current_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Apenas o owner atual pode transferir o workspace';
  END IF;

  -- Verificar se novo owner é membro
  IF NOT EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = _workspace_id AND user_id = _new_owner_id) THEN
    RAISE EXCEPTION 'O novo owner deve ser membro do workspace';
  END IF;

  -- Rebaixar owner atual para admin
  UPDATE public.workspace_members SET role = 'admin' WHERE workspace_id = _workspace_id AND user_id = _current_owner_id;

  -- Promover novo owner
  UPDATE public.workspace_members SET role = 'owner' WHERE workspace_id = _workspace_id AND user_id = _new_owner_id;

  RETURN TRUE;
END;
$$;

-- 11. RLS para workspaces
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros podem ver seus workspaces"
  ON public.workspaces FOR SELECT
  USING (is_workspace_member(auth.uid(), id) OR has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Owner e admin podem atualizar workspace"
  ON public.workspaces FOR UPDATE
  USING (
    has_workspace_role(auth.uid(), id, 'owner'::workspace_role)
    OR has_workspace_role(auth.uid(), id, 'admin'::workspace_role)
    OR has_role(auth.uid(), 'master'::app_role)
  );

CREATE POLICY "Usuários autenticados podem criar workspaces"
  ON public.workspaces FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Owner pode deletar workspace"
  ON public.workspaces FOR DELETE
  USING (
    has_workspace_role(auth.uid(), id, 'owner'::workspace_role)
    OR has_role(auth.uid(), 'master'::app_role)
  );

-- 12. RLS para workspace_members
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros podem ver membros do workspace"
  ON public.workspace_members FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id) OR has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Owner e admin podem adicionar membros"
  ON public.workspace_members FOR INSERT
  WITH CHECK (
    has_workspace_role(auth.uid(), workspace_id, 'owner'::workspace_role)
    OR has_workspace_role(auth.uid(), workspace_id, 'admin'::workspace_role)
    OR has_role(auth.uid(), 'master'::app_role)
    -- Permitir auto-inserção ao criar workspace
    OR (auth.uid() = user_id AND NOT EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = workspace_members.workspace_id))
  );

CREATE POLICY "Owner pode remover membros"
  ON public.workspace_members FOR DELETE
  USING (
    has_workspace_role(auth.uid(), workspace_id, 'owner'::workspace_role)
    OR has_workspace_role(auth.uid(), workspace_id, 'admin'::workspace_role)
    OR has_role(auth.uid(), 'master'::app_role)
    OR auth.uid() = user_id -- membro pode sair
  );

CREATE POLICY "Owner pode atualizar roles"
  ON public.workspace_members FOR UPDATE
  USING (
    has_workspace_role(auth.uid(), workspace_id, 'owner'::workspace_role)
    OR has_role(auth.uid(), 'master'::app_role)
  );

-- 13. Atualizar RLS de projects para considerar workspace
DROP POLICY IF EXISTS "Users can view projects they are members of" ON public.projects;
CREATE POLICY "Users can view projects they are members of"
  ON public.projects FOR SELECT
  USING (
    is_project_member(auth.uid(), id)
    OR created_by = auth.uid()
    OR is_workspace_member(auth.uid(), workspace_id)
  );

DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
CREATE POLICY "Authenticated users can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND is_workspace_member(auth.uid(), workspace_id)
  );

DROP POLICY IF EXISTS "Project creators can update their projects" ON public.projects;
CREATE POLICY "Project creators can update their projects"
  ON public.projects FOR UPDATE
  USING (
    created_by = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_workspace_role(auth.uid(), workspace_id, 'owner'::workspace_role)
    OR has_workspace_role(auth.uid(), workspace_id, 'admin'::workspace_role)
  );

DROP POLICY IF EXISTS "Project creators can delete their projects" ON public.projects;
CREATE POLICY "Project creators can delete their projects"
  ON public.projects FOR DELETE
  USING (
    created_by = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_workspace_role(auth.uid(), workspace_id, 'owner'::workspace_role)
  );

-- 14. Atualizar RLS de categories para escopo de workspace
DROP POLICY IF EXISTS "Categorias são visíveis para todos autenticados" ON public.categories;
CREATE POLICY "Membros do workspace podem ver categorias"
  ON public.categories FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id) OR has_role(auth.uid(), 'master'::app_role));

DROP POLICY IF EXISTS "Admin e Master podem criar categorias" ON public.categories;
CREATE POLICY "Admin e Master podem criar categorias"
  ON public.categories FOR INSERT
  WITH CHECK (
    is_workspace_member(auth.uid(), workspace_id)
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'master'::app_role)
      OR has_workspace_role(auth.uid(), workspace_id, 'owner'::workspace_role)
      OR has_workspace_role(auth.uid(), workspace_id, 'admin'::workspace_role)
    )
  );

DROP POLICY IF EXISTS "Admin e Master podem atualizar categorias" ON public.categories;
CREATE POLICY "Admin e Master podem atualizar categorias"
  ON public.categories FOR UPDATE
  USING (
    is_workspace_member(auth.uid(), workspace_id)
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'master'::app_role)
      OR has_workspace_role(auth.uid(), workspace_id, 'owner'::workspace_role)
      OR has_workspace_role(auth.uid(), workspace_id, 'admin'::workspace_role)
    )
  );

DROP POLICY IF EXISTS "Admin e Master podem deletar categorias" ON public.categories;
CREATE POLICY "Admin e Master podem deletar categorias"
  ON public.categories FOR DELETE
  USING (
    is_workspace_member(auth.uid(), workspace_id)
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'master'::app_role)
      OR has_workspace_role(auth.uid(), workspace_id, 'owner'::workspace_role)
      OR has_workspace_role(auth.uid(), workspace_id, 'admin'::workspace_role)
    )
  );

-- 15. Atualizar RLS de invitations para escopo de workspace
DROP POLICY IF EXISTS "Usuários podem ver convites que enviaram" ON public.invitations;
CREATE POLICY "Usuários podem ver convites do workspace"
  ON public.invitations FOR SELECT
  USING (
    invited_by = auth.uid()
    OR is_workspace_member(auth.uid(), workspace_id)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'master'::app_role)
  );

DROP POLICY IF EXISTS "Admins, masters e donos de projeto podem criar convites" ON public.invitations;
CREATE POLICY "Membros podem criar convites no workspace"
  ON public.invitations FOR INSERT
  WITH CHECK (
    auth.uid() = invited_by
    AND is_workspace_member(auth.uid(), workspace_id)
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'master'::app_role)
      OR has_workspace_role(auth.uid(), workspace_id, 'owner'::workspace_role)
      OR has_workspace_role(auth.uid(), workspace_id, 'admin'::workspace_role)
    )
  );

-- 16. Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspaces;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_members;

-- 17. Índices para performance
CREATE INDEX idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace ON public.workspace_members(workspace_id);
CREATE INDEX idx_projects_workspace ON public.projects(workspace_id);
CREATE INDEX idx_categories_workspace ON public.categories(workspace_id);
CREATE INDEX idx_invitations_workspace ON public.invitations(workspace_id);
