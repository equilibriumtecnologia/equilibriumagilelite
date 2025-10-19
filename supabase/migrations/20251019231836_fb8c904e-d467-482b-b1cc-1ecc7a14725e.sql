-- Corrigir recursão infinita nas políticas RLS de project_members

-- 1. Criar função security definer para verificar se usuário é membro de um projeto
CREATE OR REPLACE FUNCTION public.is_project_member(_user_id UUID, _project_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members
    WHERE user_id = _user_id
      AND project_id = _project_id
  )
$$;

-- 2. Remover política problemática de project_members
DROP POLICY IF EXISTS "Users can view members of their projects" ON public.project_members;

-- 3. Recriar política usando a função security definer
CREATE POLICY "Users can view members of their projects"
  ON public.project_members FOR SELECT
  USING (
    public.is_project_member(auth.uid(), project_members.project_id)
  );