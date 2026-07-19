alter table public.prompt_responses
add column if not exists image_url text;

insert into storage.buckets (id, name, public)
values ('response-images', 'response-images', false)
on conflict (id) do nothing;

drop policy if exists "Users can upload own response images" on storage.objects;
create policy "Users can upload own response images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'response-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update own response images" on storage.objects;
create policy "Users can update own response images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'response-images'
  and owner = auth.uid()
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'response-images'
  and owner = auth.uid()
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete own response images" on storage.objects;
create policy "Users can delete own response images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'response-images'
  and owner = auth.uid()
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can read visible response images" on storage.objects;
create policy "Users can read visible response images"
on storage.objects for select
to authenticated
using (
  bucket_id = 'response-images'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1
      from public.prompt_responses pr
      where pr.image_url = storage.objects.name
        and public.can_view_response(pr.id)
    )
  )
);
