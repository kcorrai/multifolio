-- Multifolio — Faz 9 follow-up: kredi RPC'lerine miktar guard'ı.
-- deduct/refund yalnız service-role tarafından sabit pozitif CREDIT_COSTS ile çağrılır;
-- yine de gelecekteki hatalı bir çağrıya karşı p_amount <= 0 durumunu açıkça reddet.
-- (0010 zaten prod'da; bu dosya create-or-replace ile fonksiyonları güvenle yeniden tanımlar.)

create or replace function public.deduct_credits(p_user uuid, p_amount int)
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

create or replace function public.refund_credits(p_user uuid, p_amount int)
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
  -- Kredi satırı yoksa açıkça hata ver (NULL dönmesin).
  if not found then
    raise exception 'no_credits_row';
  end if;
  return v_balance;
end;
$$;

-- İzinler 0010'dan devralınır (create-or-replace grant'ları korur); yine de garanti et.
revoke all on function public.deduct_credits(uuid, int) from public;
revoke all on function public.refund_credits(uuid, int) from public;
grant execute on function public.deduct_credits(uuid, int) to service_role;
grant execute on function public.refund_credits(uuid, int) to service_role;
