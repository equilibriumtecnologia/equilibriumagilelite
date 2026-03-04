-- Add configurable executor/reviewer split percentage to projects
-- Default 70 means executor gets 70%, reviewer gets 30%
ALTER TABLE public.projects
ADD COLUMN executor_split_percent integer NOT NULL DEFAULT 70;

-- Add constraint to keep value between 50 and 100
CREATE OR REPLACE FUNCTION public.validate_executor_split()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.executor_split_percent < 50 OR NEW.executor_split_percent > 100 THEN
    RAISE EXCEPTION 'executor_split_percent must be between 50 and 100';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_executor_split_trigger
BEFORE INSERT OR UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.validate_executor_split();