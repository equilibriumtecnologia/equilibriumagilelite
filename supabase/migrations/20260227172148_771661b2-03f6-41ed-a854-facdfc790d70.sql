-- Add additional_info JSONB column to tasks table
ALTER TABLE public.tasks
ADD COLUMN additional_info jsonb DEFAULT '[]'::jsonb;