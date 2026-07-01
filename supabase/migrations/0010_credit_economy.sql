-- Multifolio — Faz 9: kredi ekonomisi.
-- Başlangıç hediyesi 100 kredi; her AI aksiyonu sabit kredi düşer (atomik RPC).
-- USD (cost_usd) DB'de dahili kalır ama kullanıcıya gösterilmez.

-- Yeni kullanıcı 100 kredi ile başlasın.
alter table public.credits alter column balance set default 100;

-- Mevcut kullanıcıları 100'e yükselt (kimseyi düşürmez).
update public.credits set balance = 100 where balance < 100;

-- Aksiyon başına kaç kredi harcandığını dahili analitik için tut.
alter table public.usage_events add column if not exists credits_spent int not null default 0;

-- Atomik kredi düşümü: bakiye yetmezse 'insufficient_credits' fırlatır.
create or replace function public.deduct_credits(p_user uuid, p_amount int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance int;
begin
  select balance into v_balance from public.credits where user_id = p_user for update;
  if v_balance is null then
    insert into public.credits (user_id, balance) values (p_user, 100)
      on conflict (user_id) do nothing;
    select balance into v_balance from public.credits where user_id = p_user for update;
  end if;
  if v_balance < p_amount then
    raise exception 'insufficient_credits';
  end if;
  update public.credits set balance = balance - p_amount where user_id = p_user
    returning balance into v_balance;
  return v_balance;
end;
$$;

-- AI çağrısı patlarsa krediyi geri yükle.
create or replace function public.refund_credits(p_user uuid, p_amount int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance int;
begin
  update public.credits set balance = balance + p_amount where user_id = p_user
    returning balance into v_balance;
  -- Kredi satırı yoksa açıkça hata ver (NULL dönmesin).
  if not found then
    raise exception 'no_credits_row';
  end if;
  return v_balance;
end;
$$;

-- Yalnız service-role (sunucu) çağırabilsin; istemci/authenticated erişemesin.
revoke all on function public.deduct_credits(uuid, int) from public;
revoke all on function public.refund_credits(uuid, int) from public;
grant execute on function public.deduct_credits(uuid, int) to service_role;
grant execute on function public.refund_credits(uuid, int) to service_role;
