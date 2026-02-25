
-- Step 1: Update existing Tailwind class colors to HEX values in master's workspace
UPDATE public.categories SET color = '#6366f1' WHERE color = 'bg-primary';
UPDATE public.categories SET color = '#64748b' WHERE color = 'bg-secondary';
UPDATE public.categories SET color = '#22c55e' WHERE color = 'bg-success';
UPDATE public.categories SET color = '#3b82f6' WHERE color = 'bg-blue-500';
UPDATE public.categories SET color = '#a855f7' WHERE color = 'bg-purple-500';
UPDATE public.categories SET color = '#94a3b8' WHERE color = 'bg-muted';
UPDATE public.categories SET color = '#f59e0b' WHERE color = 'bg-accent';
UPDATE public.categories SET color = '#22c55e' WHERE color = 'bg-green-500';
UPDATE public.categories SET color = '#f97316' WHERE color = 'bg-orange-500';
UPDATE public.categories SET color = '#6b7280' WHERE color = 'bg-gray-500';
UPDATE public.categories SET color = '#eab308' WHERE color = 'bg-warning';
UPDATE public.categories SET color = '#eab308' WHERE color = 'bg-yellow-500';

-- Step 2: Create function to seed default categories from master's workspace
CREATE OR REPLACE FUNCTION public.seed_default_categories_for_workspace()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _master_workspace_id uuid;
BEGIN
  -- Find master user's primary workspace (the one owned by the master)
  SELECT wm.workspace_id INTO _master_workspace_id
  FROM public.workspace_members wm
  JOIN public.user_roles ur ON ur.user_id = wm.user_id
  WHERE ur.role = 'master' AND wm.role = 'owner'
  ORDER BY wm.joined_at ASC
  LIMIT 1;

  -- If no master workspace found, skip
  IF _master_workspace_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Don't seed into the master's own workspace
  IF NEW.id = _master_workspace_id THEN
    RETURN NEW;
  END IF;

  -- Copy all categories from master's workspace to the new workspace
  INSERT INTO public.categories (name, description, color, icon, is_default, workspace_id)
  SELECT name, description, color, icon, is_default, NEW.id
  FROM public.categories
  WHERE workspace_id = _master_workspace_id
  ON CONFLICT (name, workspace_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Step 3: Drop old trigger if exists and create new one
DROP TRIGGER IF EXISTS seed_default_categories ON public.workspaces;
DROP TRIGGER IF EXISTS create_default_categories ON public.workspaces;

CREATE TRIGGER seed_default_categories
  AFTER INSERT ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_default_categories_for_workspace();

-- Step 4: Copy master's categories to all existing workspaces that don't have them
DO $$
DECLARE
  _master_workspace_id uuid;
  _ws record;
BEGIN
  SELECT wm.workspace_id INTO _master_workspace_id
  FROM public.workspace_members wm
  JOIN public.user_roles ur ON ur.user_id = wm.user_id
  WHERE ur.role = 'master' AND wm.role = 'owner'
  ORDER BY wm.joined_at ASC
  LIMIT 1;

  IF _master_workspace_id IS NULL THEN
    RETURN;
  END IF;

  FOR _ws IN SELECT id FROM public.workspaces WHERE id != _master_workspace_id
  LOOP
    INSERT INTO public.categories (name, description, color, icon, is_default, workspace_id)
    SELECT name, description, color, icon, is_default, _ws.id
    FROM public.categories
    WHERE workspace_id = _master_workspace_id
    ON CONFLICT (name, workspace_id) DO NOTHING;
  END LOOP;
END;
$$;
