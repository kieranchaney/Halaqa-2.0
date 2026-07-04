alter table public.users
  add column if not exists is_studio_user boolean not null default false;

alter table public.scheduled_lessons
  drop constraint if exists scheduled_lessons_created_by_fkey;

alter table public.scheduled_lessons
  add constraint scheduled_lessons_created_by_fkey
  foreign key (created_by) references public.users(id) on delete restrict;

create or replace function public.is_studio_owner(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.studio_users
    where id = check_user_id and role = 'owner'
      and coalesce(locked_until, now() - interval '1 second') < now()
  )
  or exists (
    select 1 from public.users
    where id = check_user_id
      and (role = 'owner' or is_studio_user = true)
  );
$$;

