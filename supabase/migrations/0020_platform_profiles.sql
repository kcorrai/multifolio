-- Platform hesabı bağlama v1: platform BAŞINA çekilmiş profil verisi.
-- platform_connections yalnız URL saklar; bu tablo o URL'den (Bionluk/LinkedIn
-- sunucudan, Upwork/Fiverr uzantıdan) çekilen gerçek profil verisini tutar ve
-- platform detay sayfasında gösterilir. Kullanıcı × platform tek satır.

create table if not exists public.platform_profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  platform    text not null,
  headline    text not null default '',
  summary     text not null default '',
  skills      text[] not null default '{}',
  avatar_url  text,
  portfolio   jsonb not null default '[]',
  source_url  text,
  fetched_at  timestamptz not null default now(),
  unique (user_id, platform)
);

create index if not exists platform_profiles_user_id_idx on public.platform_profiles (user_id);

alter table public.platform_profiles enable row level security;

drop policy if exists "platform_profiles_all_own" on public.platform_profiles;
create policy "platform_profiles_all_own"
  on public.platform_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
