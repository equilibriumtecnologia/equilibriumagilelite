-- Permitir admin e master criarem categorias
CREATE POLICY "Admin e Master podem criar categorias"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role)
);

-- Permitir admin e master atualizarem categorias
CREATE POLICY "Admin e Master podem atualizar categorias"
ON public.categories
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role)
);

-- Permitir admin e master deletarem categorias
CREATE POLICY "Admin e Master podem deletar categorias"
ON public.categories
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role)
);

-- Permitir master atualizar roles de usuários
CREATE POLICY "Master pode atualizar roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'master'::app_role));

-- Permitir master criar roles de usuários
CREATE POLICY "Master pode criar roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'master'::app_role));

-- Permitir master deletar roles de usuários
CREATE POLICY "Master pode deletar roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'master'::app_role));