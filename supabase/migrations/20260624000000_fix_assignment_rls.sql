-- ============================================================
-- MIGRACIÓN: Corregir política RLS de course_assignments
-- Problema: la política anterior permitía que cualquier admin
-- (sin filtro de organización) viera todas las asignaciones.
-- Ahora un admin solo ve asignaciones de usuarios de su misma
-- organización. Los empleados siguen viendo solo las propias.
-- ============================================================

drop policy if exists "members can read own assignments" on public.course_assignments;

create policy "members can read own assignments"
on public.course_assignments for select
using (
  -- Los empleados solo ven sus propias asignaciones.
  user_id = auth.uid()
  -- Los admins solo ven asignaciones de usuarios de su misma organización.
  or (
    public.is_admin()
    and exists (
      select 1
      from public.profiles p
      where p.id = course_assignments.user_id
        and p.organization_id = public.current_organization_id()
    )
  )
);
