
-- Create enum for downgrade queue item types
CREATE TYPE public.downgrade_item_type AS ENUM ('owned_workspace', 'guest_workspace', 'exceeding_project');

-- Create enum for downgrade queue status
CREATE TYPE public.downgrade_queue_status AS ENUM ('grace_period', 'suspended', 'exported', 'deleted', 'restored');

-- Create downgrade_queue table
CREATE TABLE public.downgrade_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_type downgrade_item_type NOT NULL,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  grace_period_ends_at timestamptz NOT NULL,
  suspended_at timestamptz,
  delete_after timestamptz,
  export_url text,
  export_generated_at timestamptz,
  status downgrade_queue_status NOT NULL DEFAULT 'grace_period',
  previous_plan_slug text,
  new_plan_slug text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add is_suspended and suspended_at columns to workspaces
ALTER TABLE public.workspaces 
  ADD COLUMN is_suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN suspended_at timestamptz;

-- Enable RLS on downgrade_queue
ALTER TABLE public.downgrade_queue ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view their own queue items
CREATE POLICY "Users can view own downgrade queue"
  ON public.downgrade_queue
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS: Only service role / master can insert (via edge functions)
-- No direct INSERT policy for regular users

-- RLS: Users can update their own queue items (for swap selection)
CREATE POLICY "Users can update own downgrade queue"
  ON public.downgrade_queue
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for efficient queries
CREATE INDEX idx_downgrade_queue_user_status ON public.downgrade_queue(user_id, status);
CREATE INDEX idx_downgrade_queue_grace_period ON public.downgrade_queue(status, grace_period_ends_at) WHERE status = 'grace_period';
CREATE INDEX idx_downgrade_queue_delete_after ON public.downgrade_queue(status, delete_after) WHERE status = 'suspended';

-- Update trigger for updated_at
CREATE TRIGGER update_downgrade_queue_updated_at
  BEFORE UPDATE ON public.downgrade_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
