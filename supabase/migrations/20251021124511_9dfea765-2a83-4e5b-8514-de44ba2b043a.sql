-- FASE 6: Sistema de Convites e Controle de Acesso

-- 1. Criar enum para status de convites
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');

-- 2. Tabela de convites
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  status public.invitation_status NOT NULL DEFAULT 'pending',
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Índices para performance
CREATE INDEX idx_invitations_email ON public.invitations(email);
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_project_id ON public.invitations(project_id);
CREATE INDEX idx_invitations_status ON public.invitations(status);

-- 4. Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- 5. Policies de invitations
CREATE POLICY "Usuários podem ver convites que enviaram"
ON public.invitations
FOR SELECT
USING (invited_by = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master'));

CREATE POLICY "Admins e masters podem criar convites"
ON public.invitations
FOR INSERT
WITH CHECK (
  auth.uid() = invited_by 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master'))
);

CREATE POLICY "Criador do convite pode atualizar"
ON public.invitations
FOR UPDATE
USING (invited_by = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master'));

CREATE POLICY "Criador do convite pode deletar"
ON public.invitations
FOR DELETE
USING (invited_by = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master'));

-- 6. Trigger para atualizar updated_at
CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Função para verificar se usuário tem acesso ao sistema
CREATE OR REPLACE FUNCTION public.user_has_system_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Master sempre tem acesso
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'master'
  ) OR EXISTS (
    -- Usuário é membro de pelo menos um projeto
    SELECT 1 FROM public.project_members 
    WHERE user_id = _user_id
  )
$$;

-- 8. Função para expirar convites automaticamente
CREATE OR REPLACE FUNCTION public.expire_old_invitations()
RETURNS void
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.invitations
  SET status = 'expired'
  WHERE status = 'pending' 
    AND expires_at < NOW();
$$;

-- 9. Função para aceitar convite e adicionar usuário ao projeto
CREATE OR REPLACE FUNCTION public.accept_invitation(_token UUID, _user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
  v_result JSONB;
BEGIN
  -- Buscar convite
  SELECT * INTO v_invitation
  FROM public.invitations
  WHERE token = _token
    AND status = 'pending'
    AND expires_at > NOW();

  -- Verificar se convite existe e é válido
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Convite inválido ou expirado'
    );
  END IF;

  -- Verificar se email do convite corresponde ao email do usuário
  IF v_invitation.email != (SELECT email FROM auth.users WHERE id = _user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Este convite não é para o seu email'
    );
  END IF;

  -- Adicionar usuário ao projeto se convite tem project_id
  IF v_invitation.project_id IS NOT NULL THEN
    INSERT INTO public.project_members (project_id, user_id, role)
    VALUES (v_invitation.project_id, _user_id, v_invitation.role)
    ON CONFLICT (project_id, user_id) DO NOTHING;
  END IF;

  -- Marcar convite como aceito
  UPDATE public.invitations
  SET status = 'accepted',
      accepted_at = NOW()
  WHERE id = v_invitation.id;

  RETURN jsonb_build_object(
    'success', true,
    'project_id', v_invitation.project_id
  );
END;
$$;