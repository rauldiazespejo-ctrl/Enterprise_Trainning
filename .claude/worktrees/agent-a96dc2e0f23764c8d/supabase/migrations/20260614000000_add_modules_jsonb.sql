-- Añade columna modules_data JSONB a la tabla courses
-- para almacenar módulos, diapositivas y quizzes anidados sin tablas separadas.
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS modules_data jsonb NOT NULL DEFAULT '[]';
