-- ============================================================
-- SEED DE PRODUCCIÓN — CapacitaPro / Soldesp S.A.
-- Pega este script en el SQL Editor de tu proyecto Supabase
-- DESPUÉS de haber aplicado la migración inicial.
-- ============================================================

-- 1. Crear la organización
INSERT INTO public.organizations (id, name)
VALUES (
  gen_random_uuid(),   -- Supabase genera el UUID
  'Soldesp S.A.'
)
ON CONFLICT DO NOTHING;

-- 2. Crear el usuario administrador en Supabase Auth
-- Reemplaza el email y contraseña antes de ejecutar
DO $$
DECLARE
  v_org_id  uuid;
  v_user_id uuid;
BEGIN
  -- Obtener el ID de la organización recién creada
  SELECT id INTO v_org_id FROM public.organizations WHERE name = 'Soldesp S.A.' LIMIT 1;

  -- Crear usuario admin en auth.users usando la función admin de Supabase
  -- IMPORTANTE: esto solo funciona desde el SQL Editor del dashboard con permisos service_role
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
    'admin@soldesp.cl',           -- <-- Cambia por el email del admin
    crypt('CambiarEstaClave1!', gen_salt('bf')),  -- <-- Cambia por la contraseña admin
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Administrador Soldesp","role":"admin"}',
    now(),
    now(),
    '',
    ''
  )
  RETURNING id INTO v_user_id;

  -- Crear el perfil del admin
  INSERT INTO public.profiles (id, organization_id, email, name, role, department, position, status)
  VALUES (
    v_user_id,
    v_org_id,
    'admin@soldesp.cl',           -- <-- Mismo email de arriba
    'Administrador Soldesp',
    'admin',
    'Recursos Humanos',
    'Administrador de Capacitación',
    'active'
  );

  RAISE NOTICE 'Admin creado con ID: % en organización: %', v_user_id, v_org_id;
END $$;
