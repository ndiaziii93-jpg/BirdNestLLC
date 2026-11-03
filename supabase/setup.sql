-- Run once in the Supabase SQL editor (Project → SQL → New query).
-- Creates the public bucket that holds company logos. Tables are created by Prisma migrations,
-- not here (see README → Deploy → step 3).

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- The app writes with the service-role key, so no insert policy is needed for anon users.
-- Public read lets the <img> tags load logos without a signed URL.
create policy "Public read of logos"
on storage.objects for select
using (bucket_id = 'logos');
