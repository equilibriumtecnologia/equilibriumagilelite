
-- RPC for master to get all workspace info (bypasses RLS for the admin page)
CREATE OR REPLACE FUNCTION public.get_all_workspaces_for_master()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _is_master boolean;
  _result jsonb;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'master') INTO _is_master;
  IF NOT _is_master THEN
    RAISE EXCEPTION 'Acesso negado: apenas o Master pode acessar esta função';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'workspace_id', w.id,
    'workspace_name', w.name,
    'workspace_slug', w.slug,
    'is_default', w.is_default,
    'is_enabled', COALESCE(mwa.is_enabled, false),
    'owner_id', COALESCE(owner_member.user_id, '00000000-0000-0000-0000-000000000000'::uuid),
    'owner_name', COALESCE(owner_profile.full_name, 'Desconhecido'),
    'is_master_member', EXISTS(
      SELECT 1 FROM public.workspace_members wm2
      WHERE wm2.workspace_id = w.id AND wm2.user_id = auth.uid()
    )
  ) ORDER BY owner_profile.full_name, w.name), '[]'::jsonb) INTO _result
  FROM public.workspaces w
  LEFT JOIN public.master_workspace_access mwa ON mwa.workspace_id = w.id
  LEFT JOIN public.workspace_members owner_member ON owner_member.workspace_id = w.id AND owner_member.role = 'owner'
  LEFT JOIN public.profiles owner_profile ON owner_profile.id = owner_member.user_id;

  RETURN _result;
END;
$$;
