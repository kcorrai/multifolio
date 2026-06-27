-- Multifolio — Faz 2: portfolyo sitesi.
-- Kullanıcı profilinden üretilen genel portfolyo sayfası verisi.
-- RLS: sahip her şeyi yapabilir; herkes yalnızca yayınlanmış (published=true) olanı okur.

create table if not exists public.portfolios (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  slug        text not null,
  published   boolean not null default false,
  -- AI tarafından üretilen ve kullanıcının düzenleyebildiği içerik.
  content     jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Slug ve user_id tekil kısıtları.
create unique index if not exists portfolios_slug_key    on public.portfolios (slug);
create unique index if not exists portfolios_user_id_key on public.portfolios (user_id);

create index if not exists portfolios_published_idx on public.portfolios (published)
  where published = true;

drop trigger if exists portfolios_set_updated_at on public.portfolios;
create trigger portfolios_set_updated_at
  before update on public.portfolios
  for each row execute function public.set_updated_at();

alter table public.portfolios enable row level security;

-- Sahip: tam erişim.
drop policy if exists "portfolios_select_own"  on public.portfolios;
create policy "portfolios_select_own"
  on public.portfolios for select
  using (auth.uid() = user_id);

drop policy if exists "portfolios_insert_own"  on public.portfolios;
create policy "portfolios_insert_own"
  on public.portfolios for insert
  with check (auth.uid() = user_id);

drop policy if exists "portfolios_update_own"  on public.portfolios;
create policy "portfolios_update_own"
  on public.portfolios for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "portfolios_delete_own"  on public.portfolios;
create policy "portfolios_delete_own"
  on public.portfolios for delete
  using (auth.uid() = user_id);

-- Herkes: yalnızca yayınlanmış portfolyoları okuyabilir (genel sayfa için).
drop policy if exists "portfolios_select_published" on public.portfolios;
create policy "portfolios_select_published"
  on public.portfolios for select
  using (published = true);
