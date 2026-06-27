-- Multifolio — Faz 3: iş ilanı takibi ve profil eşleştirme.
-- RLS: sahip full erişim; başka kullanıcı göremez.

create table if not exists public.job_listings (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  title         text not null,
  company       text,
  platform      text,
  description   text not null,
  status        text not null default 'saved',
  match_score   smallint,
  match_result  jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint job_listings_status_check
    check (status in ('saved', 'applied', 'interview', 'offer', 'rejected'))
);

create index if not exists job_listings_user_id_created_at_idx
  on public.job_listings (user_id, created_at desc);

drop trigger if exists job_listings_set_updated_at on public.job_listings;
create trigger job_listings_set_updated_at
  before update on public.job_listings
  for each row execute function public.set_updated_at();

alter table public.job_listings enable row level security;

drop policy if exists "job_listings_select_own" on public.job_listings;
create policy "job_listings_select_own"
  on public.job_listings for select
  using (auth.uid() = user_id);

drop policy if exists "job_listings_insert_own" on public.job_listings;
create policy "job_listings_insert_own"
  on public.job_listings for insert
  with check (auth.uid() = user_id);

drop policy if exists "job_listings_update_own" on public.job_listings;
create policy "job_listings_update_own"
  on public.job_listings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "job_listings_delete_own" on public.job_listings;
create policy "job_listings_delete_own"
  on public.job_listings for delete
  using (auth.uid() = user_id);
