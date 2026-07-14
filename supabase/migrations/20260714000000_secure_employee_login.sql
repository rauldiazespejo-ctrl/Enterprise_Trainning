-- Obliga a reemplazar credenciales temporales o predecibles en el próximo acceso.
-- Es idempotente y no modifica las contraseñas almacenadas en Supabase Auth.
UPDATE public.profiles
SET must_change_password = true
WHERE role = 'employee'
  AND email LIKE '%@acceso.soldesp.cl'
  AND must_change_password = false;

COMMENT ON COLUMN public.profiles.must_change_password IS
  'Obliga al usuario a crear una contraseña personal antes de acceder a la plataforma.';
