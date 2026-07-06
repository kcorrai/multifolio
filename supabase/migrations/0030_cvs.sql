-- Multifolio — CV / özgeçmiş modülü.
-- Kullanıcının ATS-uyumlu CV'si (AI ile üretilen veya yüklenen CV'den parse edilen,
-- kullanıcının düzenleyebildiği yapılandırılmış içerik). Portfolyodan FARKLI olarak
-- CV ÖZELDİR — kişisel veri (telefon/e-posta/geçmiş) içerir, KVKK/GDPR gereği public
-- select politikası YOKTUR. Yalnız sahibi erişir. Ham yüklenen dosya SAKLANMAZ
-- (route bellekte parse eder); burada yalnız türetilmiş yapılandırılmış içerik durur.

create table if not exists public.cvs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  -- AI/parse ile üretilen ve kullanıcının düzenleyebildiği CV içeriği.
  content     jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index if not exists cvs_user_id_key on public.cvs (user_id);

drop trigger if exists cvs_set_updated_at on public.cvs;
create trigger cvs_set_updated_at
  before update on public.cvs
  for each row execute function public.set_updated_at();

alter table public.cvs enable row level security;

-- Sahip: tam erişim. Public select politikası YOK (CV özeldir).
drop policy if exists "cvs_select_own" on public.cvs;
create policy "cvs_select_own"
  on public.cvs for select
  using (auth.uid() = user_id);

drop policy if exists "cvs_insert_own" on public.cvs;
create policy "cvs_insert_own"
  on public.cvs for insert
  with check (auth.uid() = user_id);

drop policy if exists "cvs_update_own" on public.cvs;
create policy "cvs_update_own"
  on public.cvs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "cvs_delete_own" on public.cvs;
create policy "cvs_delete_own"
  on public.cvs for delete
  using (auth.uid() = user_id);
