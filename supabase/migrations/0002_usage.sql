-- Multifolio — harcama (spend) takibi.
-- Her uyarlama gerçek bir maliyet üretir (Claude token kullanımı × model fiyatı).
-- usage_events bu maliyeti kullanıcı bazında, server-otoritatif olarak tutar.
-- SERT KURAL: yazma yalnızca server-otoritatif olmalı → INSERT/UPDATE/DELETE için
-- politika YOK; yalnızca service-role (lib/supabase/admin.ts) bunları yazabilir.
-- Kullanıcı kendi kayıtlarını yalnızca OKUR (maliyeti istemci tahrif edemez).

create table if not exists public.usage_events (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  kind            text not null,          -- ör. 'adaptation'
  platform        text,                   -- ör. 'linkedin' | 'upwork'
  model           text not null,
  input_tokens    integer not null default 0,
  output_tokens   integer not null default 0,
  -- USD cinsinden maliyet; küçük tutarlar için yüksek hassasiyet.
  cost_usd        numeric(12, 6) not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists usage_events_user_id_created_at_idx
  on public.usage_events (user_id, created_at desc);

alter table public.usage_events enable row level security;

-- Yalnızca okuma (sahibe sınırlı). Yazma politikası bilinçli olarak yok:
-- maliyet kayıtları yalnızca service-role ile (sunucudan) eklenir.
drop policy if exists "usage_events_select_own" on public.usage_events;
create policy "usage_events_select_own"
  on public.usage_events for select
  using (auth.uid() = user_id);
