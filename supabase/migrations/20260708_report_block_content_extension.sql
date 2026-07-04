alter table public.reports
add column if not exists response_id uuid references public.prompt_responses(id) on delete set null,
add column if not exists comment_id uuid references public.response_comments(id) on delete set null;

alter table public.reports
drop constraint if exists reports_single_content_reference;

alter table public.reports
add constraint reports_single_content_reference
check (
  (
    case when content_id is null then 0 else 1 end
    + case when response_id is null then 0 else 1 end
    + case when comment_id is null then 0 else 1 end
  ) <= 1
);
