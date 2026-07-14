create type public.app_role as enum ('admin', 'employee');
create type public.course_status as enum ('draft', 'published', 'archived');
create type public.assignment_status as enum ('pending', 'in_progress', 'completed', 'failed');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  rut text unique,
  email text not null,
  name text not null,
  role public.app_role not null default 'employee',
  department text,
  position text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  title text not null,
  description text not null default '',
  status public.course_status not null default 'draft',
  passing_score integer not null default 70 check (passing_score between 0 and 100),
  estimated_duration integer not null default 60 check (estimated_duration > 0),
  category text,
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.course_assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid not null references public.profiles(id),
  status public.assignment_status not null default 'pending',
  progress integer not null default 0 check (progress between 0 and 100),
  assigned_at timestamptz not null default now(),
  due_date timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  unique (course_id, user_id)
);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id),
  user_id uuid not null references public.profiles(id),
  score integer not null check (score between 0 and 100),
  verification_code uuid not null default gen_random_uuid() unique,
  issued_at timestamptz not null default now(),
  unique (course_id, user_id)
);

create or replace function public.current_organization_id()
returns uuid language sql stable security definer set search_path = public
as $$ select organization_id from public.profiles where id = auth.uid() $$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false) $$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_assignments enable row level security;
alter table public.certificates enable row level security;

create policy "organization members can read organization"
on public.organizations for select
using (id = public.current_organization_id());

create policy "members can read organization profiles"
on public.profiles for select
using (organization_id = public.current_organization_id());

create policy "admins can manage organization profiles"
on public.profiles for all
using (organization_id = public.current_organization_id() and public.is_admin())
with check (organization_id = public.current_organization_id() and public.is_admin());

create policy "members can read visible courses"
on public.courses for select
using (
  organization_id = public.current_organization_id()
  and (
    public.is_admin()
    or exists (
      select 1 from public.course_assignments assignment
      where assignment.course_id = courses.id and assignment.user_id = auth.uid()
    )
  )
);

create policy "admins can manage courses"
on public.courses for all
using (organization_id = public.current_organization_id() and public.is_admin())
with check (organization_id = public.current_organization_id() and public.is_admin());

create policy "members can read own assignments"
on public.course_assignments for select
using (user_id = auth.uid() or public.is_admin());

create policy "admins can manage assignments"
on public.course_assignments for all
using (public.is_admin())
with check (public.is_admin());

create policy "members can read own certificates"
on public.certificates for select
using (user_id = auth.uid() or public.is_admin());

create policy "admins can manage certificates"
on public.certificates for all
using (public.is_admin())
with check (public.is_admin());
