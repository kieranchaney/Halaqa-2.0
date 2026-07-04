create or replace function public.can_view_response(check_response_id uuid, check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.prompt_responses pr
    join public.users owner on owner.id = pr.user_id
    where pr.id = check_response_id
      and check_user_id is not null
      and (
        pr.user_id = check_user_id
        or (
          (
            owner.is_private = false
            or public.are_friends(check_user_id, pr.user_id)
          )
          and exists (
            select 1
            from public.prompt_responses mine
            where mine.user_id = check_user_id
              and mine.global_prompt_id = pr.global_prompt_id
          )
          and not exists (
            select 1
            from public.blocked_users bu
            where (bu.blocker_id = check_user_id and bu.blocked_user_id = pr.user_id)
               or (bu.blocker_id = pr.user_id and bu.blocked_user_id = check_user_id)
          )
        )
      )
  );
$$;

create table if not exists public.response_likes (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.prompt_responses(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (response_id, user_id)
);

create table if not exists public.response_comments (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.prompt_responses(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  parent_comment_id uuid references public.response_comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists response_likes_response_id_idx
on public.response_likes (response_id);

create index if not exists response_comments_response_parent_idx
on public.response_comments (response_id, parent_comment_id);

alter table public.response_likes enable row level security;
alter table public.response_comments enable row level security;

drop policy if exists "Users can read visible response likes" on public.response_likes;
create policy "Users can read visible response likes"
on public.response_likes for select
using (public.can_view_response(response_id));

drop policy if exists "Users can like visible responses" on public.response_likes;
create policy "Users can like visible responses"
on public.response_likes for insert
with check (user_id = auth.uid() and public.can_view_response(response_id));

drop policy if exists "Users can unlike own response likes" on public.response_likes;
create policy "Users can unlike own response likes"
on public.response_likes for delete
using (user_id = auth.uid());

drop policy if exists "Users can read visible response comments" on public.response_comments;
create policy "Users can read visible response comments"
on public.response_comments for select
using (public.can_view_response(response_id));

drop policy if exists "Users can comment on visible responses" on public.response_comments;
create policy "Users can comment on visible responses"
on public.response_comments for insert
with check (user_id = auth.uid() and public.can_view_response(response_id));

drop policy if exists "Users can update own response comments" on public.response_comments;
create policy "Users can update own response comments"
on public.response_comments for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own response comments" on public.response_comments;
create policy "Users can delete own response comments"
on public.response_comments for delete
using (user_id = auth.uid());
