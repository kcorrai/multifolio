-- Alt-proje B — scraper koşu logu. Her çekme koşusu (kaynak başına) bir satır.
-- Yalnız service-role yazar (RLS bypass); bilinçli olarak insert/select politikası
-- TANIMLANMAZ (admin görünürlük service-role sorgusuyla).
create table if not exists public.scrape_runs (
  id         uuid primary key default gen_random_uuid(),
  source     text not null,
  fetched    int  not null default 0,
  upserted   int  not null default 0,
  skipped    int  not null default 0,
  error      text,
  ms         int  not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists scrape_runs_created_at_idx on public.scrape_runs (created_at desc);

alter table public.scrape_runs enable row level security;
