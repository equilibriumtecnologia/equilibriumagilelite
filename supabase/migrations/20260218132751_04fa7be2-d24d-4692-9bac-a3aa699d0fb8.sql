
-- Drop the global unique constraint on category name (should be unique per workspace instead)
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_name_key;

-- Add a unique constraint per workspace
ALTER TABLE public.categories ADD CONSTRAINT categories_name_workspace_unique UNIQUE (name, workspace_id);

-- Seed categories for existing workspaces that have none
INSERT INTO public.categories (workspace_id, name, description, color, icon, is_default)
SELECT w.id, c.name, c.description, c.color, c.icon, true
FROM public.workspaces w
CROSS JOIN (VALUES
  ('Marketing', 'Projetos de marketing e comunicação', 'bg-blue-500', 'megaphone'),
  ('Desenvolvimento', 'Projetos de desenvolvimento de software', 'bg-green-500', 'code'),
  ('Design', 'Projetos de design e UX/UI', 'bg-purple-500', 'palette'),
  ('Operações', 'Projetos operacionais e infraestrutura', 'bg-orange-500', 'settings'),
  ('Vendas', 'Projetos comerciais e de vendas', 'bg-red-500', 'trending-up')
) AS c(name, description, color, icon)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories cat WHERE cat.workspace_id = w.id AND cat.name = c.name
);
