-- Multifolio — İlan çevirisi (hibrit model). Arbeitnow ilanları çoğunlukla Almanca:
-- başlıklar scrape-time'da EN+TR'ye çevrilir (job_pool kolonları), açıklamalar ilk
-- görüntülemede kullanıcının diline çevrilip PAYLAŞIMLI cache'e yazılır. Çeviri
-- platform maliyetidir (kredi düşmez).

-- 1) job_pool: tespit edilen kaynak dil + çift dilli başlık.
--    lang IS NULL = henüz çevrilmedi (cron sonrası batch bunları tarar).
alter table public.job_pool
  add column if not exists lang     text,
  add column if not exists title_en text,
  add column if not exists title_tr text;

-- Çevrilmemişleri hızlı bulmak için kısmi index.
create index if not exists job_pool_lang_null_idx
  on public.job_pool (created_at desc) where lang is null;

-- 2) On-demand açıklama çevirisi — job_pool gibi PAYLAŞIMLI (kullanıcıya özel değil):
--    ilk isteyen için AI çevirir, sonraki herkes cache'ten okur.
create table if not exists public.job_translations (
  id          uuid primary key default gen_random_uuid(),
  job_pool_id uuid not null references public.job_pool (id) on delete cascade,
  locale      text not null check (locale in ('en', 'tr')),
  description text not null,
  created_at  timestamptz not null default now(),
  constraint job_translations_pool_locale_uniq unique (job_pool_id, locale)
);

alter table public.job_translations enable row level security;

-- Paylaşımlı okuma: her authenticated kullanıcı görür. Yazma yalnız service-role
-- (RLS'i bypass eder); bilinçli olarak insert/update/delete politikası TANIMLANMAZ.
drop policy if exists "job_translations_select_auth" on public.job_translations;
create policy "job_translations_select_auth"
  on public.job_translations for select
  to authenticated
  using (true);
