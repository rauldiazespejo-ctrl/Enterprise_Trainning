-- ============================================================
-- MIGRACIÓN: Corregir política RLS de gestión de asignaciones
-- Problema: la política anterior permitía que cualquier admin
-- (sin filtro de organización) gestionara TODAS las asignaciones.
-- Ahora un admin solo puede gestionar asignaciones donde el
-- usuario asignado y el curso pertenecen a su misma organización.
-- El super_admin mantiene acceso cross-organización.
-- ============================================================

drop policy if exists "admins can manage assignments" on public.course_assignments;

create policy "admins can manage assignments"
on public.course_assignments for all
using (
  public.is_super_admin()
  or (
    public.is_admin()
    and exists (
      select 1
      from public.profiles p
      where p.id = course_assignments.user_id
        and p.organization_id = public.current_organization_id()
    )
    and exists (
      select 1
      from public.courses c
      where c.id = course_assignments.course_id
        and c.organization_id = public.current_organization_id()
    )
  )
)
with check (
  public.is_super_admin()
  or (
    public.is_admin()
    and exists (
      select 1
      from public.profiles p
      where p.id = course_assignments.user_id
        and p.organization_id = public.current_organization_id()
    )
    and exists (
      select 1
      from public.courses c
      where c.id = course_assignments.course_id
        and c.organization_id = public.current_organization_id()
    )
  )
);
