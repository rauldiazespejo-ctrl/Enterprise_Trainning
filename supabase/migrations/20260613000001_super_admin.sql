-- ============================================================
-- MIGRACIÓN: Rol super_admin + cuenta Raul Diaz
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Agregar super_admin al enum de roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- 2. Función: verificar si el usuario activo es super_admin
create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce((select role = 'super_admin' from public.profiles where id = auth.uid()), false) $$;

-- 3. Actualizar is_admin() para que super_admin también sea admin
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce((select role in ('admin','super_admin') from public.profiles where id = auth.uid()), false) $$;

-- 4. Política adicional: super_admin puede ver y gestionar todos los perfiles (cross-org)
drop policy if exists "super_admin can manage all profiles" on public.profiles;
create policy "super_admin can manage all profiles"
on public.profiles for all
using (public.is_super_admin())
with check (public.is_super_admin());

-- 5. super_admin puede ver todas las organizaciones
drop policy if exists "super_admin can see all organizations" on public.organizations;
create policy "super_admin can see all organizations"
on public.organizations for all
using (public.is_super_admin())
with check (public.is_super_admin());

-- 6. super_admin puede gestionar todos los cursos
drop policy if exists "super_admin can manage all courses" on public.courses;
create policy "super_admin can manage all courses"
on public.courses for all
using (public.is_super_admin())
with check (public.is_super_admin());

-- 7. super_admin puede gestionar todas las asignaciones
drop policy if exists "super_admin can manage all assignments" on public.course_assignments;
create policy "super_admin can manage all assignments"
on public.course_assignments for all
using (public.is_super_admin())
with check (public.is_super_admin());

-- 8. super_admin puede gestionar todos los certificados
drop policy if exists "super_admin can manage all certificates" on public.certificates;
create policy "super_admin can manage all certificates"
on public.certificates for all
using (public.is_super_admin())
with check (public.is_super_admin());

-- 9. Crear la cuenta de Raul Diaz Espejo (super_admin)
DO $$
DECLARE
  v_org_id  uuid;
  v_user_id uuid;
BEGIN
  -- Obtener organización (Soldesp S.A.)
  SELECT id INTO v_org_id FROM public.organizations LIMIT 1;

  -- Si no existe organización, crearla
  IF v_org_id IS NULL THEN
    INSERT INTO public.organizations (name) VALUES ('Soldesp S.A.') RETURNING id INTO v_org_id;
  END IF;

  -- Crear usuario en auth.users
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  )
  VALUES (
    gen_random_uuid(),
    'raul.diaz@soldesp.cl',
    crypt('Soldesp2024!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Raul Diaz Espejo","role":"super_admin"}',
    now(),
    now(),
    '',
    ''
  )
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO v_user_id;

  -- Si ya existía el usuario, obtener su ID
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'raul.diaz@soldesp.cl';
  END IF;

  -- Crear o actualizar el perfil como super_admin
  INSERT INTO public.profiles (id, organization_id, email, name, role, department, position, status)
  VALUES (
    v_user_id,
    v_org_id,
    'raul.diaz@soldesp.cl',
    'Raul Diaz Espejo',
    'super_admin',
    'Dirección',
    'Administrador del Sistema',
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    name = 'Raul Diaz Espejo',
    department = 'Dirección',
    position = 'Administrador del Sistema';

  RAISE NOTICE 'Super Admin creado/actualizado: % (org: %)', v_user_id, v_org_id;
END $$;
