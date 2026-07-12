-- İlan okundu takibi: kullanıcı bir pool ilanını açınca (veya "tümünü okundu işaretle")
-- burada bir satır oluşur. Satır VARSA ilan okunmuş sayılır. starred_jobs deseninin
-- birebir eşi (kullanıcı×pool tekil, RLS sahip-tümü). Yalnız kullanıcı kendi okundu
-- durumunu yönetir; public select politikası YOK.

create table if not exists public.job_reads (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  job_pool_id uuid not null references public.job_pool (id) on delete cascade,
  created_at  timestamptz not null default now(),
  constraint job_reads_user_pool_uniq unique (user_id, job_pool_id)
);

create index if not exists job_reads_user_idx on public.job_reads (user_id);

alter table public.job_reads enable row level security;

drop policy if exists "job_reads_all_own" on public.job_reads;
create policy "job_reads_all_own"
  on public.job_reads for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
