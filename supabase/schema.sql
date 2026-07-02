-- Halaqa Supabase schema
-- Run before seed_lessons.sql. Enable pg_cron in Supabase if scheduled jobs are used.

create extension if not exists "pgcrypto";

create type member_role as enum ('admin', 'co-admin', 'member');
create type request_status as enum ('pending', 'approved', 'denied');
create type lesson_status as enum ('draft', 'published');
create type scheduled_lesson_status as enum ('scheduled', 'sent');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'owner')),
  created_at timestamptz not null default now()
);

create table public.studio_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'owner' check (role = 'owner'),
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_public boolean not null default false,
  invite_code uuid not null unique default gen_random_uuid(),
  created_by uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role member_role not null default 'member',
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table public.join_requests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status request_status not null default 'pending',
  requested_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  theme text not null,
  body_text text not null,
  ayat text not null,
  ayat_transliteration text not null,
  ayat_translation text not null,
  ayat_reference text not null,
  hadith text not null,
  hadith_reference text not null,
  reflection_prompts jsonb not null default '[]'::jsonb,
  status lesson_status not null default 'published',
  is_custom boolean not null default false,
  custom_group_id uuid references public.groups(id) on delete cascade,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint custom_lesson_scope check (
    (is_custom = false and custom_group_id is null)
    or (is_custom = true and custom_group_id is not null)
  )
);

create table public.scheduled_lessons (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  scheduled_for timestamptz not null,
  timezone text not null default 'UTC',
  status scheduled_lesson_status not null default 'scheduled',
  created_by uuid not null references public.studio_users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.platform_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (key, value)
values ('weekly_cron_enabled', 'true'::jsonb)
on conflict (key) do nothing;

create table public.group_lessons (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete restrict,
  scheduled_for date not null,
  sent_at timestamptz,
  reflection_unlocked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (group_id, lesson_id, scheduled_for)
);

create table public.reflection_responses (
  id uuid primary key default gen_random_uuid(),
  group_lesson_id uuid not null references public.group_lessons(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  unique (group_lesson_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  is_system boolean not null default false,
  group_lesson_id uuid references public.group_lessons(id) on delete set null,
  constraint system_message_user check ((is_system = true and user_id is null) or (is_system = false and user_id is not null))
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users(id) on delete cascade,
  reported_user_id uuid not null references public.users(id) on delete cascade,
  content_id uuid references public.messages(id) on delete set null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table public.blocked_users (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.users(id) on delete cascade,
  blocked_user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_user_id),
  constraint no_self_block check (blocker_id <> blocked_user_id)
);

create index on public.group_members (user_id, group_id);
create index on public.join_requests (group_id, status);
create index on public.group_lessons (group_id, scheduled_for desc);
create index on public.messages (group_id, created_at desc);
create index on public.reflection_responses (group_lesson_id, created_at);
create index on public.scheduled_lessons (scheduled_for, status);
create index on public.reports (reporter_id, created_at desc);
create index on public.reports (reported_user_id, created_at desc);
create index on public.blocked_users (blocker_id, blocked_user_id);

alter table public.users enable row level security;
alter table public.studio_users enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.join_requests enable row level security;
alter table public.lessons enable row level security;
alter table public.group_lessons enable row level security;
alter table public.reflection_responses enable row level security;
alter table public.messages enable row level security;
alter table public.scheduled_lessons enable row level security;
alter table public.platform_settings enable row level security;
alter table public.reports enable row level security;
alter table public.blocked_users enable row level security;

create or replace function public.is_group_member(check_group_id uuid, check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = check_group_id and user_id = check_user_id
  );
$$;

create or replace function public.member_role_for(check_group_id uuid, check_user_id uuid default auth.uid())
returns member_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.group_members
  where group_id = check_group_id and user_id = check_user_id
  limit 1;
$$;

create or replace function public.can_manage_members(check_group_id uuid)
returns boolean
language sql
stable
as $$
  select public.member_role_for(check_group_id) in ('admin', 'co-admin');
$$;

create or replace function public.can_admin_group(check_group_id uuid)
returns boolean
language sql
stable
as $$
  select public.member_role_for(check_group_id) = 'admin';
$$;

create or replace function public.open_chat_unlocked(check_group_id uuid)
returns boolean
language sql
stable
as $$
  select coalesce(max(reflection_unlocked_at) <= now(), false)
  from public.group_lessons
  where group_id = check_group_id and sent_at is not null;
$$;

create or replace function public.message_rate_ok(check_group_id uuid, check_user_id uuid)
returns boolean
language sql
stable
as $$
  select count(*) < 10
  from public.messages
  where group_id = check_group_id
    and user_id = check_user_id
    and created_at > now() - interval '10 seconds';
$$;

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

create policy "Users can read own profile and member profiles"
on public.users for select
using (
  id = auth.uid() or exists (
    select 1
    from public.group_members mine
    join public.group_members theirs on theirs.group_id = mine.group_id
    where mine.user_id = auth.uid() and theirs.user_id = users.id
  )
);

create policy "Users can create own profile"
on public.users for insert
with check (id = auth.uid());

create policy "Users can update own profile"
on public.users for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "Studio owners manage studio users"
on public.studio_users for all
using (public.is_studio_owner())
with check (public.is_studio_owner());

create policy "Members can read their groups and public directory"
on public.groups for select
using (is_public = true or public.is_group_member(id));

create policy "Authenticated users can create groups"
on public.groups for insert
with check (created_by = auth.uid());

create policy "Admins can update own groups"
on public.groups for update
using (public.can_admin_group(id))
with check (public.can_admin_group(id));

create policy "Admins can delete own groups"
on public.groups for delete
using (public.can_admin_group(id));

create policy "Members can read group membership"
on public.group_members for select
using (public.is_group_member(group_id));

create policy "Admins and co-admins can add members after approval"
on public.group_members for insert
with check (public.can_manage_members(group_id));

create policy "Admins and co-admins can remove ordinary members"
on public.group_members for delete
using (
  public.can_manage_members(group_id)
  and (role = 'member' or public.can_admin_group(group_id))
);

create policy "Only admins can change roles"
on public.group_members for update
using (public.can_admin_group(group_id))
with check (public.can_admin_group(group_id));

create policy "Users can create own join requests"
on public.join_requests for insert
with check (user_id = auth.uid());

create policy "Users and managers can read join requests"
on public.join_requests for select
using (user_id = auth.uid() or public.can_manage_members(group_id));

create policy "Admins and co-admins can decide join requests"
on public.join_requests for update
using (public.can_manage_members(group_id))
with check (public.can_manage_members(group_id));

create policy "Members can read master or scoped lessons"
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

create policy "Studio owners manage lessons"
on public.lessons for all
using (public.is_studio_owner())
with check (public.is_studio_owner());

create policy "Admins and co-admins can create custom lessons"
on public.lessons for insert
with check (
  is_custom = true
  and custom_group_id is not null
  and public.can_manage_members(custom_group_id)
  and created_by = auth.uid()
);

create policy "Members can read assigned group lessons"
on public.group_lessons for select
using (public.is_group_member(group_id));

create policy "Members can read reflections"
on public.reflection_responses for select
using (public.is_group_member(group_id));

create policy "Members can submit one reflection during reflection mode"
on public.reflection_responses for insert
with check (
  user_id = auth.uid()
  and public.is_group_member(group_id)
  and exists (
    select 1 from public.group_lessons gl
    where gl.id = group_lesson_id
      and gl.group_id = reflection_responses.group_id
      and gl.sent_at is not null
      and gl.reflection_unlocked_at > now()
  )
);

create policy "Members can read group messages"
on public.messages for select
using (
  public.is_group_member(group_id)
  and (
    is_system = true
    or not exists (
      select 1
      from public.blocked_users bu
      where bu.blocker_id = auth.uid()
        and bu.blocked_user_id = messages.user_id
    )
  )
);

create policy "Members can write open chat only after unlock"
on public.messages for insert
with check (
  is_system = false
  and user_id = auth.uid()
  and public.is_group_member(group_id)
  and public.open_chat_unlocked(group_id)
  and public.message_rate_ok(group_id, auth.uid())
);

create policy "Studio owners manage scheduled lessons"
on public.scheduled_lessons for all
using (public.is_studio_owner())
with check (public.is_studio_owner());

create policy "Studio owners manage platform settings"
on public.platform_settings for all
using (public.is_studio_owner())
with check (public.is_studio_owner());

create policy "Users can create reports"
on public.reports for insert
with check (
  reporter_id = auth.uid()
  and reported_user_id <> auth.uid()
);

create policy "Studio owners can read reports"
on public.reports for select
using (public.is_studio_owner());

create policy "Users can read own blocked users"
on public.blocked_users for select
using (blocker_id = auth.uid());

create policy "Users can block other users"
on public.blocked_users for insert
with check (
  blocker_id = auth.uid()
  and blocked_user_id <> auth.uid()
);

create policy "Users can unblock users"
on public.blocked_users for delete
using (blocker_id = auth.uid());

create or replace function public.create_group(group_name text, group_description text, group_is_public boolean)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_group_id uuid;
begin
  insert into public.groups (name, description, is_public, created_by)
  values (group_name, group_description, coalesce(group_is_public, false), auth.uid())
  returning id into new_group_id;

  insert into public.group_members (group_id, user_id, role)
  values (new_group_id, auth.uid(), 'admin');

  return new_group_id;
end;
$$;

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

-- Supabase scheduled function example:
-- select cron.schedule('weekly-halaqa-lessons', '0 6 * * 1', 'select public.assign_weekly_lessons();');
