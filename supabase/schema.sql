-- ============================================================
-- Ayubkahil — Supabase schema
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1) SITE CONTENT (the no-code editor publishes here; everyone reads it)
create table if not exists public.site_content (
  id int primary key default 1,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

insert into public.site_content (id, data)
  values (1, '{}'::jsonb)
  on conflict (id) do nothing;

alter table public.site_content enable row level security;

-- anyone can READ the published content (so visitors see your edits)
drop policy if exists "content public read" on public.site_content;
create policy "content public read" on public.site_content
  for select using (true);

-- only a logged-in editor (Supabase Auth user) can WRITE
drop policy if exists "content write insert" on public.site_content;
create policy "content write insert" on public.site_content
  for insert to authenticated with check (true);

drop policy if exists "content write update" on public.site_content;
create policy "content write update" on public.site_content
  for update to authenticated using (true) with check (true);

-- 2) CONTACT MESSAGES (the contact form inserts here; only you read them)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  subject text,
  message text,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

-- anyone can SEND a message; nobody can read them with the public key
drop policy if exists "messages insert" on public.messages;
create policy "messages insert" on public.messages
  for insert with check (true);

-- ============================================================
-- After running this:
--   Dashboard → Authentication → Users → "Add user"
--   Create ONE user with Ayub's email + a password.
--   That email/password is what unlocks Edit Mode (#edit) and Publish.
-- ============================================================
