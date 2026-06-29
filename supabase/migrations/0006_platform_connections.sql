-- Platform hesap bağlantıları: kullanıcının her platformdaki profil URL'si.
-- Şimdilik sadece URL saklıyoruz; sonra import/OAuth eklenecek.

create table if not exists public.platform_connections (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  platform    text        not null,
  profile_url text        not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, platform)
);

alter table public.platform_connections enable row level security;

create policy "Users manage own platform_connections"
  on public.platform_connections for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- updated_at otomatik güncel kalsın
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger platform_connections_updated_at
  before update on public.platform_connections
  for each row execute procedure public.set_updated_at();
