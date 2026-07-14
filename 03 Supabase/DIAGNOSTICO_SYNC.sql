-- ============================================================
-- DIAGNÓSTICO COMPLETO Y REPARACIÓN — CapacitaPro Sync
-- Pega en: Supabase Dashboard → SQL Editor → New query
-- Ejecutar sección por sección (F5 por bloque)
-- ============================================================

-- ════════════════════════════════════════════════
-- SECCIÓN A: ESTADO ACTUAL DE LOS DATOS
-- ════════════════════════════════════════════════

-- A1. Organizaciones registradas
SELECT id, name, created_at FROM public.organizations ORDER BY created_at;

-- A2. Perfiles de usuarios (detecta los que tienen organization_id NULL)
SELECT
  id,
  name,
  email,
  role,
  organization_id,
  status,
  CASE WHEN organization_id IS NULL THEN '⚠️ SIN ORGANIZACIÓN' ELSE '✅ OK' END AS org_check
FROM public.profiles
ORDER BY role, name;

-- A3. Cursos en Supabase (detecta organization_id inválido)
SELECT
  c.id,
  c.title,
  c.status,
  c.organization_id,
  c.created_by,
  c.created_at,
  CASE WHEN o.id IS NOT NULL THEN '✅ org válida' ELSE '❌ org inválida/no existe' END AS org_check,
  CASE WHEN p.id IS NOT NULL THEN '✅ creador válido' ELSE '❌ creador no en profiles' END AS creator_check
FROM public.courses c
LEFT JOIN public.organizations o ON o.id = c.organization_id
LEFT JOIN public.profiles p ON p.id = c.created_by
ORDER BY c.created_at;

-- A4. Asignaciones vs cursos (detecta asignaciones huérfanas)
SELECT
  ca.id,
  p.name  AS empleado,
  p.role  AS rol_empleado,
  p.organization_id AS emp_org,
  c.title AS curso,
  c.organization_id AS course_org,
  ca.status,
  CASE WHEN c.id IS NOT NULL THEN '✅ curso existe' ELSE '❌ curso NO en Supabase' END AS course_check,
  CASE WHEN p.organization_id = c.organization_id THEN '✅ misma org' ELSE '❌ org diferente' END AS org_match
FROM public.course_assignments ca
LEFT JOIN public.profiles p ON p.id = ca.user_id
LEFT JOIN public.courses c ON c.id = ca.course_id
ORDER BY p.name, c.title;

-- A5. Verificar función is_admin() — muestra si existe
SELECT prosrc FROM pg_proc WHERE proname = 'is_admin';

-- A6. Verificar función current_organization_id()
SELECT prosrc FROM pg_proc WHERE proname = 'current_organization_id';

-- A7. Políticas RLS activas en tabla courses
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'courses'
ORDER BY policyname;

-- ════════════════════════════════════════════════
-- SECCIÓN B: DIAGNÓSTICO DE VISIBILIDAD POR USUARIO
-- ════════════════════════════════════════════════

-- B1. Qué cursos DEBERÍA ver cada usuario (según lógica RLS, sin RLS activo)
SELECT
  p.name           AS usuario,
  p.role           AS rol,
  p.organization_id AS user_org,
  c.title          AS curso,
  c.organization_id AS course_org,
  (p.organization_id = c.organization_id) AS misma_org,
  (p.role IN ('admin','super_admin'))      AS es_admin,
  EXISTS(
    SELECT 1 FROM public.course_assignments ca2
    WHERE ca2.user_id = p.id AND ca2.course_id = c.id
  ) AS tiene_asignacion,
  -- Resultado final: ¿puede verlo?
  CASE
    WHEN p.organization_id = c.organization_id
      AND (p.role IN ('admin','super_admin')
           OR EXISTS(SELECT 1 FROM public.course_assignments ca3
                     WHERE ca3.user_id = p.id AND ca3.course_id = c.id))
    THEN '✅ VISIBLE'
    ELSE '❌ BLOQUEADO'
  END AS visibilidad
FROM public.profiles p
CROSS JOIN public.courses c
ORDER BY p.name, c.title;

-- B2. Resumen: usuarios con 0 cursos visibles (necesitan reparación)
SELECT
  p.name,
  p.role,
  p.organization_id,
  COUNT(CASE
    WHEN p.organization_id = c.organization_id
      AND (p.role IN ('admin','super_admin')
           OR EXISTS(SELECT 1 FROM public.course_assignments ca
                     WHERE ca.user_id = p.id AND ca.course_id = c.id))
    THEN 1 END) AS cursos_visibles,
  COUNT(c.id)   AS total_cursos_en_supabase
FROM public.profiles p
CROSS JOIN public.courses c
GROUP BY p.id, p.name, p.role, p.organization_id
HAVING COUNT(CASE
    WHEN p.organization_id = c.organization_id
      AND (p.role IN ('admin','super_admin')
           OR EXISTS(SELECT 1 FROM public.course_assignments ca
                     WHERE ca.user_id = p.id AND ca.course_id = c.id))
    THEN 1 END) = 0
ORDER BY p.name;

-- ════════════════════════════════════════════════
-- SECCIÓN C: REPARACIONES (ejecutar solo si se detectaron problemas)
-- ════════════════════════════════════════════════

-- C1. FIX: Asignar organización a perfiles sin organization_id
--     Descomentar y ejecutar si A2 mostró perfiles con org NULL
/*
UPDATE public.profiles
SET organization_id = (SELECT id FROM public.organizations ORDER BY created_at LIMIT 1)
WHERE organization_id IS NULL;
*/

-- C2. FIX: Reasignar cursos con organization_id inválido
--     Descomentar y ejecutar si A3 mostró cursos con org inválida
/*
UPDATE public.courses
SET organization_id = (SELECT id FROM public.organizations ORDER BY created_at LIMIT 1)
WHERE organization_id NOT IN (SELECT id FROM public.organizations);
*/

-- C3. FIX: Unificar todos los cursos y perfiles a la misma organización
--     Usar SOLO si hay una sola organización y los datos están mezclados
/*
DO $$
DECLARE v_org_id uuid;
BEGIN
  SELECT id INTO v_org_id FROM public.organizations ORDER BY created_at LIMIT 1;
  UPDATE public.profiles SET organization_id = v_org_id WHERE organization_id IS NULL;
  UPDATE public.courses   SET organization_id = v_org_id
    WHERE organization_id NOT IN (SELECT id FROM public.organizations);
  RAISE NOTICE 'Reparación completada. Org ID: %', v_org_id;
END $$;
*/

-- C4. FIX: Recrear is_admin() asegurando que incluye super_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT COALESCE((SELECT role IN ('admin','super_admin') FROM public.profiles WHERE id = auth.uid()), false) $$;

-- C5. FIX: Recrear política RLS de cursos (más robusta)
DROP POLICY IF EXISTS "members can read visible courses" ON public.courses;
CREATE POLICY "members can read visible courses"
ON public.courses FOR SELECT
USING (
  organization_id = public.current_organization_id()
  AND (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.course_assignments ca
      WHERE ca.course_id = courses.id AND ca.user_id = auth.uid()
    )
  )
);

-- C6. FIX: Elevar usuario específico a admin por email
--     Reemplazar el email antes de ejecutar
/*
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'luis.ojeda@soldesp.cl';  -- cambiar por email real
*/

-- ════════════════════════════════════════════════
-- SECCIÓN D: VERIFICACIÓN FINAL
-- ════════════════════════════════════════════════

-- D1. Confirmar estado final
SELECT
  'Organizaciones'   AS tabla, COUNT(*) AS total FROM public.organizations
UNION ALL SELECT 'Perfiles',       COUNT(*) FROM public.profiles
UNION ALL SELECT 'Cursos',         COUNT(*) FROM public.courses
UNION ALL SELECT 'Asignaciones',   COUNT(*) FROM public.course_assignments
UNION ALL SELECT 'Certificados',   COUNT(*) FROM public.certificates
UNION ALL SELECT
  'Perfiles sin org' AS tabla,
  COUNT(*)           AS total
FROM public.profiles WHERE organization_id IS NULL
UNION ALL SELECT
  'Cursos org inválida',
  COUNT(*)
FROM public.courses
WHERE organization_id NOT IN (SELECT id FROM public.organizations);

-- D2. Luis Ojeda específico — verificar estado
SELECT
  p.id,
  p.name,
  p.email,
  p.role,
  p.organization_id,
  p.status,
  (SELECT COUNT(*) FROM public.course_assignments ca WHERE ca.user_id = p.id) AS num_asignaciones,
  (SELECT COUNT(*) FROM public.course_assignments ca
   JOIN public.courses c ON c.id = ca.course_id
   WHERE ca.user_id = p.id AND c.organization_id = p.organization_id) AS cursos_accesibles
FROM public.profiles p
WHERE p.name ILIKE '%ojeda%' OR p.email ILIKE '%ojeda%' OR p.rut = '17388441-9';
