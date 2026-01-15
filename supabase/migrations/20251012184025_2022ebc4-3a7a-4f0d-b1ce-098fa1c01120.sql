-- FASE 1: Fundação do Sistema TaskFlow
-- Estrutura de autenticação, permissões e categorias base

-- 1. Criar ENUM para roles de usuário
CREATE TYPE public.app_role AS ENUM ('master', 'admin', 'user');

-- 2. Tabela de Perfis de Usuário
-- Armazena informações adicionais dos usuários além do auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies para profiles: usuários podem ver todos os perfis mas só editar o próprio
CREATE POLICY "Profiles são visíveis para todos usuários autenticados"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Tabela de Roles/Permissões de Usuário
-- Armazena os papéis de cada usuário no sistema
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Habilitar RLS na tabela user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policies para user_roles: todos podem ver, mas não modificar diretamente
CREATE POLICY "User roles são visíveis para todos autenticados"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- 4. Tabela de Categorias Globais
-- Categorias que podem ser atribuídas aos projetos
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT NOT NULL DEFAULT 'bg-primary',
  icon TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS na tabela categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policies para categories: todos podem visualizar, apenas admins e masters podem modificar
CREATE POLICY "Categorias são visíveis para todos autenticados"
  ON public.categories
  FOR SELECT
  TO authenticated
  USING (true);

-- 5. Função de segurança para verificar role do usuário
-- Evita recursão infinita em RLS policies
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 6. Função para criar perfil automaticamente quando usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir perfil básico
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Atribuir role padrão de 'user'
  -- O primeiro usuário será configurado manualmente como 'master'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- 7. Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 8. Função para atualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 9. Triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Inserir categorias padrão do sistema
INSERT INTO public.categories (name, description, color, is_default) VALUES
  ('Planejamento', 'Fase inicial de idealização e estruturação', 'bg-primary', true),
  ('Execução', 'Desenvolvimento e implementação ativa', 'bg-accent', true),
  ('Revisão', 'Análise, testes e ajustes', 'bg-warning', true),
  ('Concluído', 'Tarefas e projetos finalizados', 'bg-success', true),
  ('Em Espera', 'Aguardando aprovação ou dependências', 'bg-muted', true),
  ('Backlog', 'Ideias e tarefas futuras', 'bg-secondary', true);

-- 11. Comentários para documentação
COMMENT ON TABLE public.profiles IS 'Perfis de usuário com informações adicionais';
COMMENT ON TABLE public.user_roles IS 'Roles e permissões de cada usuário no sistema';
COMMENT ON TABLE public.categories IS 'Categorias globais para classificação de projetos';
COMMENT ON FUNCTION public.has_role IS 'Verifica se um usuário possui determinada role (evita recursão em RLS)';
COMMENT ON FUNCTION public.handle_new_user IS 'Cria automaticamente perfil e role ao registrar novo usuário';