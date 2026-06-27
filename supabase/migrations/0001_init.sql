-- Multifolio — Faz 0 başlangıç şeması.
-- SERT KURAL: her tabloda RLS açıktır ve politikalar veriyi sahibiyle sınırlar.
-- Uygulama: `supabase db push` (veya Supabase SQL editöründe çalıştır).

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

-- ---------------------------------------------------------------------------
-- profiles: kullanıcının "bir kez girdiği" çekirdek profil verisi.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  headline    text not null,
  summary     text not null,
  skills      text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Her kullanıcının tek profili (Faz 0). Faz 1+ değişebilir.
create unique index if not exists profiles_user_id_key on public.profiles (user_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- RLS: aç ve sahibiyle sınırla. auth.uid() = oturum açan kullanıcı.
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = user_id);
