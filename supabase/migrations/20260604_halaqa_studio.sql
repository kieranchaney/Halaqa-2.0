-- Halaqa Studio and reflection prompt array migration.
-- Run this against an existing Halaqa database created from the earlier schema.

do $$
begin
  create type lesson_status as enum ('draft', 'published');
exception when duplicate_object then null;
end;
$$;

do $$
begin
  create type scheduled_lesson_status as enum ('scheduled', 'sent');
exception when duplicate_object then null;
end;
$$;

alter table public.users
  add column if not exists role text not null default 'user' check (role in ('user', 'owner'));

create table if not exists public.studio_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'owner' check (role = 'owner'),
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);

alter table public.lessons
  add column if not exists reflection_prompts jsonb not null default '[]'::jsonb,
  add column if not exists status lesson_status not null default 'published';

update public.lessons
set reflection_prompts = jsonb_build_array(reflection_prompt)
where reflection_prompts = '[]'::jsonb
  and reflection_prompt is not null;

alter table public.lessons
  drop column if exists reflection_prompt;

create table if not exists public.scheduled_lessons (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  scheduled_for timestamptz not null,
  timezone text not null default 'UTC',
  status scheduled_lesson_status not null default 'scheduled',
  created_by uuid not null references public.studio_users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (key, value)
values ('weekly_cron_enabled', 'true'::jsonb)
on conflict (key) do nothing;

create index if not exists scheduled_lessons_scheduled_for_status_idx
on public.scheduled_lessons (scheduled_for, status);

alter table public.studio_users enable row level security;
alter table public.scheduled_lessons enable row level security;
alter table public.platform_settings enable row level security;

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
    where id = check_user_id and role = 'owner'
  );
$$;

drop policy if exists "Members can read master or scoped lessons" on public.lessons;
create policy "Members can read delivered or scoped lessons"
on public.lessons for select
using (
  public.is_studio_owner()
  or exists (
    select 1
    from public.group_lessons gl
    where gl.lesson_id = lessons.id
      and gl.sent_at is not null
      and public.is_group_member(gl.group_id)
  )
  or (custom_group_id is not null and public.is_group_member(custom_group_id))
);

drop policy if exists "Studio owners manage studio users" on public.studio_users;
create policy "Studio owners manage studio users"
on public.studio_users for all
using (public.is_studio_owner())
with check (public.is_studio_owner());

drop policy if exists "Studio owners manage lessons" on public.lessons;
create policy "Studio owners manage lessons"
on public.lessons for all
using (public.is_studio_owner())
with check (public.is_studio_owner());

drop policy if exists "Studio owners manage scheduled lessons" on public.scheduled_lessons;
create policy "Studio owners manage scheduled lessons"
on public.scheduled_lessons for all
using (public.is_studio_owner())
with check (public.is_studio_owner());

drop policy if exists "Studio owners manage platform settings" on public.platform_settings;
create policy "Studio owners manage platform settings"
on public.platform_settings for all
using (public.is_studio_owner())
with check (public.is_studio_owner());

create or replace function public.assign_weekly_lessons()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  group_row record;
  lesson_row record;
  scheduled_row record;
  new_group_lesson_id uuid;
  delivered_count integer;
  lesson_count integer;
  cron_enabled boolean;
begin
  select coalesce((value #>> '{}')::boolean, true)
  into cron_enabled
  from public.platform_settings
  where key = 'weekly_cron_enabled';

  if cron_enabled is false then
    return;
  end if;

  select sl.*
  into scheduled_row
  from public.scheduled_lessons sl
  where sl.status = 'scheduled'
    and sl.scheduled_for <= now()
    and sl.scheduled_for >= date_trunc('week', now())
    and sl.scheduled_for < date_trunc('week', now()) + interval '7 days'
  order by sl.scheduled_for asc
  limit 1;

  for group_row in select id from public.groups loop
    if scheduled_row.id is not null then
      select * into lesson_row from public.lessons where id = scheduled_row.lesson_id;
    else
      select count(*) into lesson_count from public.lessons where is_custom = false and status = 'published';
      select count(distinct lesson_id) into delivered_count
      from public.group_lessons
      where group_id = group_row.id;

      if delivered_count >= lesson_count then
        delete from public.group_lessons where group_id = group_row.id;
      end if;

      select * into lesson_row
      from public.lessons l
      where l.is_custom = false
        and l.status = 'published'
        and not exists (
          select 1 from public.group_lessons gl
          where gl.group_id = group_row.id and gl.lesson_id = l.id
        )
      order by random()
      limit 1;
    end if;

    insert into public.group_lessons (group_id, lesson_id, scheduled_for, sent_at, reflection_unlocked_at)
    values (group_row.id, lesson_row.id, current_date, now(), now() + interval '24 hours')
    returning id into new_group_lesson_id;

    if not exists (
      select 1 from public.messages
      where group_id = group_row.id and is_system = true
    ) then
      insert into public.messages (group_id, user_id, body, is_system, group_lesson_id)
      values (
        group_row.id,
        null,
        'Assalamu Alaikum and welcome to your halaqa. Your first lesson is ready above. Start by sharing your reflection on this week''s prompt - there are no wrong answers, only honest ones.',
        true,
        new_group_lesson_id
      );
    end if;
  end loop;

  if scheduled_row.id is not null then
    update public.scheduled_lessons
    set status = 'sent'
    where id = scheduled_row.id;
  end if;
end;
$$;
