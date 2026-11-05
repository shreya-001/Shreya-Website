-- The Lantern Library: database setup. Paste this whole file into Supabase > SQL Editor and press Run.

-- Your private library: books, quotes, picks and settings (one row per item).
create table if not exists public.library_docs (
  owner uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (owner, id)
);
alter table public.library_docs enable row level security;
create policy "Read my own library" on public.library_docs for select using (auth.uid() = owner);
create policy "Add to my own library" on public.library_docs for insert with check (auth.uid() = owner);
create policy "Edit my own library" on public.library_docs for update using (auth.uid() = owner) with check (auth.uid() = owner);
create policy "Remove from my own library" on public.library_docs for delete using (auth.uid() = owner);
alter publication supabase_realtime add table public.library_docs;

-- The public reading log your website shows (only what you choose to share).
create table if not exists public.public_reading (
  id text primary key,
  owner uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.public_reading enable row level security;
create policy "Anyone can read the public reading log" on public.public_reading for select using (true);
create policy "Owner publishes the reading log" on public.public_reading for insert with check (auth.uid() = owner);
create policy "Owner updates the reading log" on public.public_reading for update using (auth.uid() = owner) with check (auth.uid() = owner);

-- Spine photos: anyone can view them (so your website can show them); only you can add or remove yours.
insert into storage.buckets (id, name, public) values ('spines', 'spines', true) on conflict (id) do nothing;
create policy "Upload my spine photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'spines' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Replace my spine photos" on storage.objects for update to authenticated
  using (bucket_id = 'spines' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Delete my spine photos" on storage.objects for delete to authenticated
  using (bucket_id = 'spines' and (storage.foldername(name))[1] = auth.uid()::text);
