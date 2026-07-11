-- Portfolyo lead formu: ziyaretçi public portfolyodan "İşe al" talebi gönderir
-- (ad/e-posta + bütçe/tip/timeline/mesaj) → owner dashboard'da görür ve durumunu
-- yönetir. INSERT yalnız service-role (public submit route; anonim ziyaretçi owner
-- değil); owner kendi lead'lerini okur/günceller/siler. (0028_testimonials deseni.)

create table if not exists public.portfolio_leads (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  name         text not null,
  email        text not null,
  budget       text,
  project_type text,
  timeline     text,
  message      text not null,
  status       text not null default 'new' check (status in ('new', 'contacted', 'converted', 'archived')),
  created_at   timestamptz not null default now()
);

create index if not exists portfolio_leads_user_created_idx
  on public.portfolio_leads (user_id, created_at desc);

alter table public.portfolio_leads enable row level security;

-- Owner kendi lead'lerini okur.
drop policy if exists "portfolio_leads_select_own" on public.portfolio_leads;
create policy "portfolio_leads_select_own"
  on public.portfolio_leads for select
  using (auth.uid() = user_id);

-- Owner lead durumunu günceller (new/contacted/converted/archived).
drop policy if exists "portfolio_leads_update_own" on public.portfolio_leads;
create policy "portfolio_leads_update_own"
  on public.portfolio_leads for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Owner kendi lead'ini siler.
drop policy if exists "portfolio_leads_delete_own" on public.portfolio_leads;
create policy "portfolio_leads_delete_own"
  on public.portfolio_leads for delete
  using (auth.uid() = user_id);

-- INSERT politikası bilinçli YOK: yalnız service-role (public submit route) yazar.
