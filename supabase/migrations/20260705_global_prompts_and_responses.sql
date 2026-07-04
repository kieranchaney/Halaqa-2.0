create table if not exists public.global_prompts (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete restrict,
  week_start date not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.prompt_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  global_prompt_id uuid not null references public.global_prompts(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, global_prompt_id)
);

create index if not exists prompt_responses_prompt_created_idx
on public.prompt_responses (global_prompt_id, created_at desc);

create or replace function public.set_prompt_response_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_prompt_response_updated_at on public.prompt_responses;
create trigger set_prompt_response_updated_at
before update on public.prompt_responses
for each row execute function public.set_prompt_response_updated_at();

create or replace function public.get_or_create_current_global_prompt()
returns public.global_prompts
language plpgsql
security definer
set search_path = public
as $$
declare
  current_week_start date := date_trunc('week', now())::date;
  existing_prompt public.global_prompts%rowtype;
  selected_lesson_id uuid;
  scheduled_row record;
  inserted_prompt public.global_prompts%rowtype;
begin
  select *
  into existing_prompt
  from public.global_prompts
  where week_start = current_week_start;

  if existing_prompt.id is not null then
    return existing_prompt;
  end if;

  select sl.id, sl.lesson_id
  into scheduled_row
  from public.scheduled_lessons sl
  join public.lessons l on l.id = sl.lesson_id
  where sl.status = 'scheduled'
    and sl.scheduled_for >= date_trunc('week', now())
    and sl.scheduled_for < date_trunc('week', now()) + interval '7 days'
    and l.is_custom = false
  order by sl.scheduled_for asc
  limit 1;

  if scheduled_row.id is not null then
    selected_lesson_id := scheduled_row.lesson_id;
    update public.scheduled_lessons
    set status = 'sent'
    where id = scheduled_row.id;
  else
    select l.id
    into selected_lesson_id
    from public.lessons l
    where l.is_custom = false
      and l.status = 'published'
      and not exists (
        select 1
        from public.global_prompts gp
        where gp.lesson_id = l.id
      )
    order by random()
    limit 1;

    if selected_lesson_id is null then
      select l.id
      into selected_lesson_id
      from public.lessons l
      where l.is_custom = false
        and l.status = 'published'
      order by random()
      limit 1;
    end if;
  end if;

  if selected_lesson_id is null then
    raise exception 'No published non-custom lessons are available for global prompt.';
  end if;

  insert into public.global_prompts (lesson_id, week_start)
  values (selected_lesson_id, current_week_start)
  returning * into inserted_prompt;

  return inserted_prompt;
end;
$$;

alter table public.global_prompts enable row level security;
alter table public.prompt_responses enable row level security;

drop policy if exists "Authenticated users can read global prompts" on public.global_prompts;
create policy "Authenticated users can read global prompts"
on public.global_prompts for select
using (auth.uid() is not null);

drop policy if exists "Users can read gated prompt responses" on public.prompt_responses;
create policy "Users can read gated prompt responses"
on public.prompt_responses for select
using (
  user_id = auth.uid()
  or (
    auth.uid() is not null
    and exists (
      select 1
      from public.prompt_responses mine
      where mine.user_id = auth.uid()
        and mine.global_prompt_id = prompt_responses.global_prompt_id
    )
    and not exists (
      select 1
      from public.blocked_users bu
      where (bu.blocker_id = auth.uid() and bu.blocked_user_id = prompt_responses.user_id)
         or (bu.blocker_id = prompt_responses.user_id and bu.blocked_user_id = auth.uid())
    )
    and (
      not exists (
        select 1
        from public.users u
        where u.id = prompt_responses.user_id
          and u.is_private = true
      )
      or public.are_friends(auth.uid(), user_id)
    )
  )
);

drop policy if exists "Users can create own prompt responses" on public.prompt_responses;
create policy "Users can create own prompt responses"
on public.prompt_responses for insert
with check (user_id = auth.uid());

drop policy if exists "Users can update own prompt responses" on public.prompt_responses;
create policy "Users can update own prompt responses"
on public.prompt_responses for update
using (user_id = auth.uid())
with check (user_id = auth.uid());
