alter table public.users
  add column if not exists username text,
  add column if not exists bio text,
  add column if not exists is_private boolean not null default false;

update public.users
set username = lower(regexp_replace(coalesce(display_name, split_part(id::text, '-', 1)), '[^a-zA-Z0-9_]', '_', 'g'))
where username is null;

update public.users
set username = 'user_' || left(replace(id::text, '-', ''), 15)
where username is null or username !~ '^[a-z0-9_]{3,20}$';

update public.users
set username = left(username, 20)
where char_length(username) > 20;

with ranked as (
  select id, username, row_number() over (partition by username order by created_at, id) as rn
  from public.users
)
update public.users u
set username = 'user_' || left(replace(u.id::text, '-', ''), 15)
from ranked r
where u.id = r.id and r.rn > 1;

alter table public.users
  alter column username set not null;

create unique index if not exists users_username_key
on public.users (username);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'users_username_format'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_username_format
      check (username ~ '^[a-z0-9_]{3,20}$');
  end if;
end $$;

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users(id) on delete cascade,
  recipient_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (requester_id, recipient_id),
  check (requester_id <> recipient_id)
);

create index if not exists friend_requests_requester_idx
on public.friend_requests (requester_id, status);

create index if not exists friend_requests_recipient_idx
on public.friend_requests (recipient_id, status);

create or replace function public.prepare_friend_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.blocked_users
    where (blocker_id = new.requester_id and blocked_user_id = new.recipient_id)
       or (blocker_id = new.recipient_id and blocked_user_id = new.requester_id)
  ) then
    raise exception 'Cannot send friend request between blocked users.';
  end if;

  if exists (
    select 1 from public.users
    where id = new.recipient_id and is_private = false
  ) then
    new.status := 'accepted';
    new.responded_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists prepare_friend_request_before_insert on public.friend_requests;
create trigger prepare_friend_request_before_insert
before insert on public.friend_requests
for each row execute function public.prepare_friend_request();

create or replace function public.are_friends(user_a uuid, user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.friend_requests fr
    where fr.status = 'accepted'
      and (
        (fr.requester_id = user_a and fr.recipient_id = user_b)
        or (fr.requester_id = user_b and fr.recipient_id = user_a)
      )
  );
$$;

alter table public.friend_requests enable row level security;

drop policy if exists "Users can read own friend requests" on public.friend_requests;
create policy "Users can read own friend requests"
on public.friend_requests for select
using (auth.uid() = requester_id or auth.uid() = recipient_id);

drop policy if exists "Users can send friend requests" on public.friend_requests;
create policy "Users can send friend requests"
on public.friend_requests for insert
with check (requester_id = auth.uid());

drop policy if exists "Recipients can respond to pending friend requests" on public.friend_requests;
create policy "Recipients can respond to pending friend requests"
on public.friend_requests for update
using (recipient_id = auth.uid() and status = 'pending')
with check (recipient_id = auth.uid() and status in ('accepted', 'declined'));

drop policy if exists "Users can cancel or unfriend" on public.friend_requests;
create policy "Users can cancel or unfriend"
on public.friend_requests for delete
using (
  (requester_id = auth.uid() and status = 'pending')
  or (status = 'accepted' and (requester_id = auth.uid() or recipient_id = auth.uid()))
);

drop policy if exists "Authenticated users can discover public profiles" on public.users;
create policy "Authenticated users can discover public profiles"
on public.users for select
using (auth.uid() is not null);
