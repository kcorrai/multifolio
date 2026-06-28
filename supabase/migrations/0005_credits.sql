-- Multifolio — Faz 4.5: kredi sistemi altyapısı.
-- Kullanıcı başına bakiye; Stripe webhook geldiğinde service_role ile güncellenir.
-- Şu an: SELECT kullanıcıya açık; INSERT/UPDATE yalnızca service_role (RLS bloke eder).

create table if not exists public.credits (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  balance    int not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

drop trigger if exists credits_set_updated_at on public.credits;
create trigger credits_set_updated_at
  before update on public.credits
  for each row execute function public.set_updated_at();

-- Yeni kullanıcı kaydolduğunda otomatik sıfır-bakiye satırı oluştur.
create or replace function public.create_initial_credits()
returns trigger language plpgsql security definer as $$
begin
  insert into public.credits (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_credits on auth.users;
create trigger on_auth_user_created_credits
  after insert on auth.users
  for each row execute function public.create_initial_credits();

alter table public.credits enable row level security;

drop policy if exists "credits_select_own" on public.credits;
create policy "credits_select_own"
  on public.credits for select
  using (auth.uid() = user_id);

-- Mevcut kullanıcılar için backfill (yeni trigger'dan önce kayıtlı olanlar).
insert into public.credits (user_id)
select id from auth.users
on conflict do nothing;
