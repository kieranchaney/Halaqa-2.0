create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users(id) on delete cascade,
  reported_user_id uuid not null references public.users(id) on delete cascade,
  content_id uuid references public.messages(id) on delete set null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.blocked_users (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.users(id) on delete cascade,
  blocked_user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_user_id),
  constraint no_self_block check (blocker_id <> blocked_user_id)
);

create index if not exists reports_reporter_created_at_idx
on public.reports (reporter_id, created_at desc);

create index if not exists reports_reported_user_created_at_idx
on public.reports (reported_user_id, created_at desc);

create index if not exists blocked_users_blocker_blocked_idx
on public.blocked_users (blocker_id, blocked_user_id);

alter table public.reports enable row level security;
alter table public.blocked_users enable row level security;

drop policy if exists "Users can create reports" on public.reports;
create policy "Users can create reports"
on public.reports for insert
with check (
  reporter_id = auth.uid()
  and reported_user_id <> auth.uid()
);

drop policy if exists "Studio owners can read reports" on public.reports;
create policy "Studio owners can read reports"
on public.reports for select
using (public.is_studio_owner());

drop policy if exists "Users can read own blocked users" on public.blocked_users;
create policy "Users can read own blocked users"
on public.blocked_users for select
using (blocker_id = auth.uid());

drop policy if exists "Users can block other users" on public.blocked_users;
create policy "Users can block other users"
on public.blocked_users for insert
with check (
  blocker_id = auth.uid()
  and blocked_user_id <> auth.uid()
);

drop policy if exists "Users can unblock users" on public.blocked_users;
create policy "Users can unblock users"
on public.blocked_users for delete
using (blocker_id = auth.uid());

drop policy if exists "Members can read group messages" on public.messages;
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
