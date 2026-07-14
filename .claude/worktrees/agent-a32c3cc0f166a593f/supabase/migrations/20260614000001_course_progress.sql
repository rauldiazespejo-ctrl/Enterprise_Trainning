-- Tabla para almacenar el progreso detallado por módulo de cada curso
create table public.course_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  module_id text not null,
  completed_slides text[] not null default '{}',
  quiz_score integer,
  quiz_attempts integer not null default 0,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, course_id, module_id)
);

alter table public.course_progress enable row level security;

create policy "members can read own course progress"
on public.course_progress for select
using (user_id = auth.uid() or public.is_admin());

create policy "members can insert own course progress"
on public.course_progress for insert
with check (user_id = auth.uid() or public.is_admin());

create policy "members can update own course progress"
on public.course_progress for update
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy "admins can manage all course progress"
on public.course_progress for all
using (public.is_admin())
with check (public.is_admin());
