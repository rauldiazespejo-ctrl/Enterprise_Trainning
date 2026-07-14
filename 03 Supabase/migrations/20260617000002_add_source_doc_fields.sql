ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS source_doc_url text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS source_doc_name text;
