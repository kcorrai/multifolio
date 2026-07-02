-- Multifolio — Alt-proje A: iş feed dashboard (job_pool + feed/starred/score).
-- job_pool PAYLAŞIMLI havuzdur (kullanıcıya özel değil): tüm authenticated
-- kullanıcılar okur, yalnız service-role (scraper) yazar.

-- 1) Paylaşımlı ilan havuzu
create table if not exists public.job_pool (
  id             uuid primary key default gen_random_uuid(),
  source         text not null,
  external_id    text not null,
  title          text not null,
  description    text not null,
  url            text,
  budget         text,
  skills         text[] not null default '{}',
  client_country text,
  posted_at      timestamptz,
  raw            jsonb,
  created_at     timestamptz not null default now(),
  constraint job_pool_source_external_uniq unique (source, external_id)
);

create index if not exists job_pool_posted_at_idx on public.job_pool (posted_at desc nulls last);
create index if not exists job_pool_skills_gin_idx on public.job_pool using gin (skills);

alter table public.job_pool enable row level security;

-- Paylaşımlı okuma: her authenticated kullanıcı görür. Yazma yalnız service-role
-- (RLS'i bypass eder); bilinçli olarak insert/update/delete politikası TANIMLANMAZ.
drop policy if exists "job_pool_select_auth" on public.job_pool;
create policy "job_pool_select_auth"
  on public.job_pool for select
  to authenticated
  using (true);

-- 2) Kayıtlı feed'ler (kullanıcı aramaları)
create table if not exists public.job_feeds (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  keywords   text[] not null default '{}',
  min_budget int,
  platform   text,
  created_at timestamptz not null default now()
);

create index if not exists job_feeds_user_id_idx on public.job_feeds (user_id, created_at desc);

alter table public.job_feeds enable row level security;

drop policy if exists "job_feeds_all_own" on public.job_feeds;
create policy "job_feeds_all_own"
  on public.job_feeds for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3) Yıldızlar
create table if not exists public.starred_jobs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  job_pool_id uuid not null references public.job_pool (id) on delete cascade,
  created_at  timestamptz not null default now(),
  constraint starred_jobs_user_pool_uniq unique (user_id, job_pool_id)
);

create index if not exists starred_jobs_user_idx on public.starred_jobs (user_id, created_at desc);

alter table public.starred_jobs enable row level security;

drop policy if exists "starred_jobs_all_own" on public.starred_jobs;
create policy "starred_jobs_all_own"
  on public.starred_jobs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4) On-demand AI skor cache (kullanıcı × pool ilanı)
create table if not exists public.job_scores (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  job_pool_id uuid not null references public.job_pool (id) on delete cascade,
  score       smallint not null,
  result      jsonb not null,
  created_at  timestamptz not null default now(),
  constraint job_scores_user_pool_uniq unique (user_id, job_pool_id)
);

create index if not exists job_scores_user_idx on public.job_scores (user_id);

alter table public.job_scores enable row level security;

-- Kullanıcı kendi skorlarını okur; yazımı score route'u service-role ile yapar.
drop policy if exists "job_scores_select_own" on public.job_scores;
create policy "job_scores_select_own"
  on public.job_scores for select
  using (auth.uid() = user_id);

-- 5) Applied köprüsü: pool ilanından oluşan iş, kaynağını işaret eder.
alter table public.job_listings
  add column if not exists source_pool_id uuid references public.job_pool (id) on delete set null;
