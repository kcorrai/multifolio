-- Tarayıcı eklentisi içe aktarmasının bekleyen taslağı: kullanıcı başına TEK satır.
-- /api/profile/import (mode:"extension") AI taslağını + medyayı buraya upsert eder;
-- /dashboard/import?source=extension okuyup wizard'ı önceden doldurur.
-- Kısa ömürlü el-değiştirme verisi — okuyan taraf 1 saatten eski satırı yok sayar,
-- sonraki eklenti içe aktarması satırı ezer (temizlik işi gerekmez).
create table if not exists public.profile_import_drafts (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  platform   text not null,
  source_url text,
  draft      jsonb not null,
  media      jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profile_import_drafts enable row level security;

drop policy if exists "profile_import_drafts_all_own" on public.profile_import_drafts;
create policy "profile_import_drafts_all_own"
  on public.profile_import_drafts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
