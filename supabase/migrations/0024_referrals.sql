-- Referral programı: davet kodu + davet kaydı + genel amaçlı kredi ekleme RPC'si.
-- Akış: kayıtta ?ref= kodu user_metadata'ya yazılır; İLK profil kaydında sunucu
-- (service-role) kodu çözer, referrals'a ekler ve iki tarafa kredi verir.
-- referred_id UNIQUE = idempotency garantisi (bonus kullanıcı başına bir kez).

create table if not exists public.referral_codes (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  code       text unique not null,
  created_at timestamptz not null default now()
);

alter table public.referral_codes enable row level security;

-- Sahibi kendi kodunu okur; INSERT politikası bilinçli YOK (yalnız service-role üretir).
create policy "referral_codes_select_own"
  on public.referral_codes for select
  using (auth.uid() = user_id);

create table if not exists public.referrals (
  id          uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users (id) on delete cascade,
  referred_id uuid not null unique references auth.users (id) on delete cascade,
  credited    boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists referrals_referrer_id_idx on public.referrals (referrer_id);

alter table public.referrals enable row level security;

-- Davet eden kendi davetlerini okur; INSERT politikası bilinçli YOK (yalnız service-role).
create policy "referrals_select_own"
  on public.referrals for select
  using (auth.uid() = referrer_id);

-- Genel amaçlı kredi EKLEME (referral bonusu vb.). refund_credits'ten farkı:
-- semantik ad + p_reason (audit niyeti; ileride credit_grants tablosu eklenirse yazılır).
create or replace function public.grant_credits(p_user uuid, p_amount int, p_reason text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance int;
begin
  if p_amount <= 0 then
    raise exception 'invalid_amount';
  end if;
  update public.credits set balance = balance + p_amount where user_id = p_user
    returning balance into v_balance;
  if not found then
    raise exception 'no_credits_row';
  end if;
  return v_balance;
end;
$$;

revoke all on function public.grant_credits(uuid, int, text) from public;
grant execute on function public.grant_credits(uuid, int, text) to service_role;
