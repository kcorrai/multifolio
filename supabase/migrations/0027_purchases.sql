-- Kredi satın alımları (Iyzico Checkout Form). Akış: checkout route bir 'pending' satır
-- açar (bizim conversation_id'miz + iyzico token'ı), callback ödemeyi SUNUCUDAN doğrulayınca
-- satırı 'paid'e çevirip grant_credits ile kredi yükler.
-- İdempotency: token UNIQUE + callback'te 'pending'→'paid' atomik geçiş (çift callback kredi
-- vermez). Yalnız service-role yazar; kullanıcı kendi satırlarını OKUR.

create table if not exists public.purchases (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  package_id      text not null,                 -- packages.ts PackageId (starter/pro/scale)
  credits         int  not null check (credits > 0),
  amount          numeric(10,2) not null,        -- ödenen tutar (TL veya USD)
  currency        text not null,                 -- 'TRY' | 'USD'
  status          text not null default 'pending' check (status in ('pending','paid','failed')),
  conversation_id text not null,                 -- bizim korelasyon kimliğimiz (= iyzico basketId)
  token           text,                          -- iyzico checkout form token'ı (init sonrası)
  payment_id      text,                          -- iyzico paymentId (başarılı ödemede)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists purchases_user_id_idx on public.purchases (user_id);
-- Aynı token'a ikinci kez kredi verilmesini engeller (idempotency).
create unique index if not exists purchases_token_key on public.purchases (token) where token is not null;

drop trigger if exists purchases_set_updated_at on public.purchases;
create trigger purchases_set_updated_at
  before update on public.purchases
  for each row execute function public.set_updated_at();

alter table public.purchases enable row level security;

-- Sahibi kendi satın alımlarını okur; INSERT/UPDATE politikası bilinçli YOK
-- (yalnız service-role yazar → RLS istemci yazımını bloke eder).
drop policy if exists "purchases_select_own" on public.purchases;
create policy "purchases_select_own"
  on public.purchases for select
  using (auth.uid() = user_id);
