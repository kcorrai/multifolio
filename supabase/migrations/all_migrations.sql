-- Tüm migration'lar birleştirildi — Supabase SQL Editor'da tek seferde çalıştır.

-- updated_at'i otomatik güncelleyen yardımcı trigger fonksiyonu.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- profiles
create table if not exists public.profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  headline    text not null,
  summary     text not null,
  skills      text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index if not exists profiles_user_id_key on public.profiles (user_id);
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
alter table public.profiles enable row level security;
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = user_id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = user_id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = user_id);

-- usage_events
create table if not exists public.usage_events (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  kind            text not null,
  platform        text,
  model           text not null,
  input_tokens    integer not null default 0,
  output_tokens   integer not null default 0,
  cost_usd        numeric(12, 6) not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists usage_events_user_id_created_at_idx on public.usage_events (user_id, created_at desc);
alter table public.usage_events enable row level security;
drop policy if exists "usage_events_select_own" on public.usage_events;
create policy "usage_events_select_own" on public.usage_events for select using (auth.uid() = user_id);

-- portfolios
create table if not exists public.portfolios (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  slug        text not null,
  published   boolean not null default false,
  content     jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index if not exists portfolios_slug_key on public.portfolios (slug);
create unique index if not exists portfolios_user_id_key on public.portfolios (user_id);
create index if not exists portfolios_published_idx on public.portfolios (published) where published = true;
drop trigger if exists portfolios_set_updated_at on public.portfolios;
create trigger portfolios_set_updated_at
  before update on public.portfolios
  for each row execute function public.set_updated_at();
alter table public.portfolios enable row level security;
drop policy if exists "portfolios_select_own" on public.portfolios;
create policy "portfolios_select_own" on public.portfolios for select using (auth.uid() = user_id);
drop policy if exists "portfolios_insert_own" on public.portfolios;
create policy "portfolios_insert_own" on public.portfolios for insert with check (auth.uid() = user_id);
drop policy if exists "portfolios_update_own" on public.portfolios;
create policy "portfolios_update_own" on public.portfolios for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "portfolios_delete_own" on public.portfolios;
create policy "portfolios_delete_own" on public.portfolios for delete using (auth.uid() = user_id);
drop policy if exists "portfolios_select_published" on public.portfolios;
create policy "portfolios_select_published" on public.portfolios for select using (published = true);

-- job_listings
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
create index if not exists job_listings_user_id_created_at_idx on public.job_listings (user_id, created_at desc);
drop trigger if exists job_listings_set_updated_at on public.job_listings;
create trigger job_listings_set_updated_at
  before update on public.job_listings
  for each row execute function public.set_updated_at();
alter table public.job_listings enable row level security;
drop policy if exists "job_listings_select_own" on public.job_listings;
create policy "job_listings_select_own" on public.job_listings for select using (auth.uid() = user_id);
drop policy if exists "job_listings_insert_own" on public.job_listings;
create policy "job_listings_insert_own" on public.job_listings for insert with check (auth.uid() = user_id);
drop policy if exists "job_listings_update_own" on public.job_listings;
create policy "job_listings_update_own" on public.job_listings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "job_listings_delete_own" on public.job_listings;
create policy "job_listings_delete_own" on public.job_listings for delete using (auth.uid() = user_id);

-- 0009_proposal_coverage.sql
alter table public.proposals
  add column if not exists coverage jsonb;
