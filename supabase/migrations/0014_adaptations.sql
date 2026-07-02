-- Platforma uyarlanmış profil metinlerinin kalıcı kaydı (platform başına SON sonuç).
-- Kredi harcanan çıktı kaybolmasın: /api/adapt her üretimde upsert eder,
-- platform detay/HUB sayfaları buradan hydrate olur. Geçmiş sürüm tutulmaz (YAGNI).
create table if not exists public.adaptations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  platform   text not null,
  headline   text not null,
  body       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint adaptations_user_platform_uniq unique (user_id, platform)
);

create index if not exists adaptations_user_idx on public.adaptations (user_id);

alter table public.adaptations enable row level security;

drop policy if exists "adaptations_all_own" on public.adaptations;
create policy "adaptations_all_own"
  on public.adaptations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- updated_at otomatik güncellensin (fonksiyon 0006'da tanımlı).
drop trigger if exists adaptations_updated_at on public.adaptations;
create trigger adaptations_updated_at
  before update on public.adaptations
  for each row execute procedure public.set_updated_at();
