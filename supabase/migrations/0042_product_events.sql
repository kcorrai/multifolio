-- Ürün hunisi olayları (aktivasyon analitiği). 0023_public_analyses deseni:
-- RLS açık, POLİTİKA YOK — yalnız service-role yazar/okur.
--
-- NEDEN AYRI TABLO: usage_events AI maliyeti içindir (model/token/cost zorunlu,
-- user_id NOT NULL). Huni adımlarının bir kısmı maliyetsizdir ve kullanıcı
-- silindiğinde de sayım bozulmamalıdır (user_id null'a düşer, satır kalır).
--
-- GİZLİLİK: istemciye script/çerez EKLENMEZ, sayfa görüntüleme izlenmez,
-- IP/user-agent saklanmaz. Yalnız sunucu rotalarında gerçekleşen ürün olayları
-- yazılır — veri zaten kendi veritabanında, üçüncü tarafa gitmez.
create table if not exists public.product_events (
  id         uuid primary key default gen_random_uuid(),
  -- Kullanıcı silinince olay ANONİMLEŞİR ama silinmez (huni geçmişi bozulmasın).
  user_id    uuid references auth.users (id) on delete set null,
  name       text not null,                       -- ör. 'profile_saved'
  props      jsonb not null default '{}'::jsonb,  -- ör. {"platform":"upwork"}
  created_at timestamptz not null default now()
);

-- Huni sorgusu ad + tarih aralığıyla gruplar.
create index if not exists product_events_name_created_at_idx
  on public.product_events (name, created_at desc);

-- "Kaç FARKLI kullanıcı bu adıma geldi" sayımı için.
create index if not exists product_events_user_name_idx
  on public.product_events (user_id, name)
  where user_id is not null;

alter table public.product_events enable row level security;
-- Bilinçli olarak politika tanımlanmaz: anon/authenticated erişemez.
