-- Kayıtsız /analyze isteklerinin IP-hash bazlı rate-limit kaydı (0015 scrape_runs
-- deseni): RLS açık, POLİTİKA YOK — yalnız service-role okur/yazar. Ham IP
-- SAKLANMAZ; sha256(ip + salt) hash'i tutulur (gizlilik).
create table if not exists public.public_analyses (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists public_analyses_ip_hash_created_at_idx
  on public.public_analyses (ip_hash, created_at desc);

alter table public.public_analyses enable row level security;
-- Bilinçli olarak politika tanımlanmaz: anon/authenticated erişemez.
