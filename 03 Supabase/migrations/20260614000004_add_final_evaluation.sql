ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS final_evaluation_data jsonb;
