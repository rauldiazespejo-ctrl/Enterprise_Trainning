-- ============================================================
-- MIGRACIÓN: Login sin contraseña para empleados (solo RUT)
-- ============================================================
-- Los empleados ingresan únicamente con su RUT (ej: 15422822-5).
-- El sistema deriva email+password del RUT internamente.
-- No se requiere contraseña ni cambio de contraseña.
-- Admins y super_admins conservan el flujo con contraseña.
-- ============================================================

-- 1. Marcar todos los empleados existentes como sin cambio de contraseña
UPDATE public.profiles
  SET must_change_password = false
  WHERE role = 'employee';
