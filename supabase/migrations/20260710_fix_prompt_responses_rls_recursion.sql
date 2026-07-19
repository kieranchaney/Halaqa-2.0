create or replace function public.viewer_has_answered(check_global_prompt_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.prompt_responses
    where user_id = auth.uid()
      and global_prompt_id = check_global_prompt_id
  );
end;
$$;

create or replace function public.can_view_response(check_response_id uuid, check_user_id uuid default auth.uid())
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  target_response record;
begin
  if check_user_id is null then
    return false;
  end if;

  select pr.id, pr.user_id, pr.global_prompt_id, owner.is_private
  into target_response
  from public.prompt_responses pr
  join public.users owner on owner.id = pr.user_id
  where pr.id = check_response_id;

  if not found then
    return false;
  end if;

  if target_response.user_id = check_user_id then
    return true;
  end if;

  if exists (
    select 1
    from public.blocked_users bu
    where (bu.blocker_id = check_user_id and bu.blocked_user_id = target_response.user_id)
       or (bu.blocker_id = target_response.user_id and bu.blocked_user_id = check_user_id)
  ) then
    return false;
  end if;

  if target_response.is_private = false then
    return true;
  end if;

  return public.are_friends(check_user_id, target_response.user_id)
    and public.viewer_has_answered(target_response.global_prompt_id);
end;
$$;

drop policy if exists "Users can read gated prompt responses" on public.prompt_responses;
drop policy if exists "Users can read visible prompt responses" on public.prompt_responses;

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
        and public.viewer_has_answered(prompt_responses.global_prompt_id)
      )
    )
  )
);
