-- Faz 7: Proposal Engine + job_listings genişletme
-- proposals tablosu: kullanıcının ilanlar için ürettiği AI teklifleri.

create table if not exists public.proposals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  job_id       uuid references public.job_listings(id) on delete cascade,
  platform     text not null,
  content      text not null,
  created_at   timestamptz not null default now()
);

create index if not exists proposals_job_id_idx on public.proposals (job_id);

alter table public.proposals enable row level security;

drop policy if exists "proposals_owner" on public.proposals;
create policy "proposals_owner"
  on public.proposals
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- job_listings: url, notes, budget sütunları ekleniyor
alter table public.job_listings
  add column if not exists url    text,
  add column if not exists notes  text,
  add column if not exists budget text;

-- status kısıtlaması awaiting_reply'ı içerecek şekilde güncelleniyor
alter table public.job_listings
  drop constraint if exists job_listings_status_check;

alter table public.job_listings
  add constraint job_listings_status_check
    check (status in ('saved', 'applied', 'awaiting_reply', 'interview', 'offer', 'rejected'));
