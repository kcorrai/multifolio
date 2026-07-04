-- Dalga 3: kullanıcı ayarları — haftalık özet e-postası tercihi.
-- Satır YOKSA varsayılan davranış AÇIK (weekly_digest=true); satır yalnızca
-- kullanıcı tercihini değiştirdiğinde oluşur. RLS: sahip okur/yazar.

create table if not exists public.user_settings (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  weekly_digest  boolean not null default true,
  updated_at     timestamptz not null default now()
);

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

alter table public.user_settings enable row level security;

drop policy if exists "user_settings_select_own" on public.user_settings;
create policy "user_settings_select_own"
  on public.user_settings for select
  using (auth.uid() = user_id);

drop policy if exists "user_settings_insert_own" on public.user_settings;
create policy "user_settings_insert_own"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_settings_update_own" on public.user_settings;
create policy "user_settings_update_own"
  on public.user_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
