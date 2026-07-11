-- Ürün geri bildirimi: kullanıcı Multifolio hakkında hata/öneri/genel yorum bırakır.
-- Sahip kendi geri bildirimini ekler + geçmişini okur; TÜM geri bildirimleri okumak
-- yalnız service-role (Supabase tablo editörü / admin) — public select politikası YOK.

create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  category    text not null check (category in ('bug', 'feature', 'general')),
  message     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists feedback_user_created_idx on public.feedback (user_id, created_at desc);
create index if not exists feedback_created_idx on public.feedback (created_at desc);

alter table public.feedback enable row level security;

-- Sahip yalnız kendi adına ekler.
drop policy if exists "feedback_insert_own" on public.feedback;
create policy "feedback_insert_own"
  on public.feedback for insert
  with check (auth.uid() = user_id);

-- Sahip yalnız kendi geri bildirim geçmişini okur.
drop policy if exists "feedback_select_own" on public.feedback;
create policy "feedback_select_own"
  on public.feedback for select
  using (auth.uid() = user_id);
