drop policy if exists "Users can read gated prompt responses" on public.prompt_responses;
create policy "Users can read visible prompt responses"
on public.prompt_responses for select
using (
  user_id = auth.uid()
  or (
    auth.uid() is not null
    and not exists (
      select 1
      from public.blocked_users bu
      where (bu.blocker_id = auth.uid() and bu.blocked_user_id = prompt_responses.user_id)
         or (bu.blocker_id = prompt_responses.user_id and bu.blocked_user_id = auth.uid())
    )
    and (
      exists (
        select 1
        from public.users owner
        where owner.id = prompt_responses.user_id
          and owner.is_private = false
      )
      or (
        public.are_friends(auth.uid(), prompt_responses.user_id)
        and exists (
          select 1
          from public.prompt_responses mine
          where mine.user_id = auth.uid()
            and mine.global_prompt_id = prompt_responses.global_prompt_id
        )
      )
    )
  )
);

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
          not exists (
            select 1
            from public.blocked_users bu
            where (bu.blocker_id = check_user_id and bu.blocked_user_id = pr.user_id)
               or (bu.blocker_id = pr.user_id and bu.blocked_user_id = check_user_id)
          )
          and (
            owner.is_private = false
            or (
              public.are_friends(check_user_id, pr.user_id)
              and exists (
                select 1
                from public.prompt_responses mine
                where mine.user_id = check_user_id
                  and mine.global_prompt_id = pr.global_prompt_id
              )
            )
          )
        )
      )
  );
$$;

create table if not exists public.gem_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  response_id uuid not null references public.prompt_responses(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  unique (user_id, response_id)
);

create index if not exists gem_views_user_response_idx
on public.gem_views (user_id, response_id);

alter table public.gem_views enable row level security;

drop policy if exists "Users can read own gem views" on public.gem_views;
create policy "Users can read own gem views"
on public.gem_views for select
using (user_id = auth.uid());

drop policy if exists "Users can create own gem views" on public.gem_views;
create policy "Users can create own gem views"
on public.gem_views for insert
with check (user_id = auth.uid());

create or replace function public.get_weekly_gems(result_limit int default 10)
returns table(
  response_id uuid,
  user_id uuid,
  display_name text,
  username text,
  avatar_url text,
  body text,
  like_count bigint,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with like_counts as (
    select response_id, count(*)::bigint as like_count
    from public.response_likes
    group by response_id
  )
  select
    pr.id as response_id,
    pr.user_id,
    u.display_name,
    u.username,
    u.avatar_url,
    pr.body,
    coalesce(lc.like_count, 0)::bigint as like_count,
    pr.created_at
  from public.prompt_responses pr
  join public.users u on u.id = pr.user_id
  join public.global_prompts gp on gp.id = pr.global_prompt_id
  left join like_counts lc on lc.response_id = pr.id
  where u.is_private = false
    and gp.week_start = date_trunc('week', now())::date
    and pr.user_id <> auth.uid()
    and not exists (
      select 1
      from public.gem_views gv
      where gv.user_id = auth.uid()
        and gv.response_id = pr.id
    )
    and not exists (
      select 1
      from public.blocked_users bu
      where (bu.blocker_id = auth.uid() and bu.blocked_user_id = pr.user_id)
         or (bu.blocker_id = pr.user_id and bu.blocked_user_id = auth.uid())
    )
  order by coalesce(lc.like_count, 0) desc, pr.created_at desc
  limit result_limit;
$$;
