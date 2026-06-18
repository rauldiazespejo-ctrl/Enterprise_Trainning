-- ============================================================
-- MIGRACIÓN: Fix sincronización cursos-usuarios
-- Diagnóstico + corrección de datos huérfanos
-- ============================================================

-- 1. Asegurar que is_admin() cubre 'admin' Y 'super_admin'
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce((select role in ('admin','super_admin') from public.profiles where id = auth.uid()), false) $$;

-- 2. Política de cursos: admins de cualquier org ven todos sus cursos
--    (antes, si el admin tenía organización distinta al curso, RLS bloqueaba)
drop policy if exists "members can read visible courses" on public.courses;
create policy "members can read visible courses"
on public.courses for select
using (
  organization_id = public.current_organization_id()
  and (
    public.is_admin()
    or exists (
      select 1 from public.course_assignments ca
      where ca.course_id = courses.id and ca.user_id = auth.uid()
    )
  )
);

-- 3. Fix: reasignar cursos huérfanos (sin organization_id válido) a la
--    primera organización existente para que sean visibles.
UPDATE public.courses
SET organization_id = (SELECT id FROM public.organizations ORDER BY created_at LIMIT 1)
WHERE organization_id NOT IN (SELECT id FROM public.organizations);

-- 4. Fix: asegurar que todos los perfiles tengan organization_id
--    (profiles sin org no pueden ver nada por RLS)
UPDATE public.profiles p
SET organization_id = (SELECT id FROM public.organizations ORDER BY created_at LIMIT 1)
WHERE p.organization_id IS NULL;

-- 5. Vista de diagnóstico: cursos vs asignaciones vs visibilidad por usuario
-- Ejecutar manualmente en SQL Editor para diagnóstico:
/*
SELECT
  p.name        AS usuario,
  p.role        AS rol,
  p.organization_id,
  c.title       AS curso,
  c.organization_id AS curso_org_id,
  ca.status     AS estado_asignacion,
  (p.organization_id = c.organization_id) AS misma_org,
  (p.role IN ('admin','super_admin') OR ca.id IS NOT NULL) AS deberia_ver
FROM public.profiles p
CROSS JOIN public.courses c
LEFT JOIN public.course_assignments ca
  ON ca.user_id = p.id AND ca.course_id = c.id
ORDER BY p.name, c.title;
*/

-- 6. Ver qué usuarios NO pueden ver algún curso asignado
/*
SELECT
  p.name AS usuario,
  p.email,
  p.role,
  p.organization_id AS user_org,
  c.title AS curso_asignado,
  c.organization_id AS course_org,
  ca.status
FROM public.course_assignments ca
JOIN public.profiles p ON p.id = ca.user_id
JOIN public.courses c ON c.id = ca.course_id
WHERE p.organization_id != c.organization_id
ORDER BY p.name;
*/
