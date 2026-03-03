-- Add label and color columns to board_settings for custom Kanban columns
ALTER TABLE public.board_settings
ADD COLUMN IF NOT EXISTS label TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT NULL;