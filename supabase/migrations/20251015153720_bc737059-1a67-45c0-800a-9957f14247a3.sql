-- Correção de segurança: Definir search_path na função update_updated_at_column
-- Esta correção elimina o aviso de segurança sobre search_path mutável

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;