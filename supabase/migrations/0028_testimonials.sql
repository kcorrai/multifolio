-- Portfolyo testimonial toplama: müşteri paylaşılabilir linkten yorum bırakır (pending),
-- owner onaylar (approved) → public portfolyoda "Wall of Love". Sahte testimonial riskini
-- gerçek + onaylı yorumlarla değiştirir. INSERT yalnız service-role (public submit route;
-- anonim müşteri owner değildir); owner kendi yorumlarını okur/günceller/siler; onaylılar
-- herkese açık okunur (public portfolyo).

create table if not exists public.testimonials (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  author_name text not null,
  author_role text,
  quote       text not null,
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at  timestamptz not null default now()
);

create index if not exists testimonials_user_id_idx on public.testimonials (user_id);
create index if not exists testimonials_user_status_idx on public.testimonials (user_id, status);

alter table public.testimonials enable row level security;

-- Onaylı yorumlar herkese açık okunur (public portfolyo); owner kendi TÜM yorumlarını okur.
create policy "testimonials_select_public_or_own"
  on public.testimonials for select
  using (status = 'approved' or auth.uid() = user_id);

-- Owner kendi yorumlarını yönetir (onayla/reddet) ve siler.
create policy "testimonials_update_own"
  on public.testimonials for update
  using (auth.uid() = user_id);

create policy "testimonials_delete_own"
  on public.testimonials for delete
  using (auth.uid() = user_id);

-- INSERT politikası bilinçli YOK: yalnız service-role (public submit route) yazar.
