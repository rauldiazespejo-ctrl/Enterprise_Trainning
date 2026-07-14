-- Audit log para ISO 45001
-- Registra eventos de autenticación y operaciones CRUD

create type public.audit_action as enum (
  'login',
  'logout',
  'login_failed',
  'create_course',
  'update_course',
  'delete_course',
  'create_module',
  'update_module',
  'delete_module',
  'create_assignment',
  'update_assignment',
  'delete_assignment',
  'issue_certificate',
  'update_profile',
  'create_user',
  'update_user',
  'delete_user',
  'change_password',
  'role_change',
  'reset_password'
);

create type public.audit_resource as enum (
  'auth',
  'course',
  'module',
  'assignment',
  'certificate',
  'profile',
  'user'
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action public.audit_action not null,
  resource_type public.audit_resource not null,
  resource_id uuid,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Índice para búsquedas frecuentes
create index idx_audit_log_user_id on public.audit_log(user_id);
create index idx_audit_log_action on public.audit_log(action);
create index idx_audit_log_resource_type on public.audit_log(resource_type);
create index idx_audit_log_created_at on public.audit_log(created_at desc);

-- RLS: admins y super_admins pueden ver logs, solo el sistema inserta
alter table public.audit_log enable row level security;

-- Política: admins y super_admins pueden leer logs de su organización
create policy "admins can read audit logs"
on public.audit_log for select
using (
  public.is_admin()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'super_admin'
  )
);

-- Política: cualquier usuario puede ver sus propios logs
create policy "users can read own audit logs"
on public.audit_log for select
using (user_id = auth.uid());

-- Política: solo via función RPC se pueden insertar (no directamente)
-- La función audit_log() maneja la inserción con service_role
