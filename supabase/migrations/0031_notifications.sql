-- Bildirim merkezi: kullanıcıya dashboard içi bildirim (yeni eşleşme, takip,
-- feed eşleşmesi, haftalık özet vb.). Üreticiler service-role ile YAZAR
-- (insert politikası yok); kullanıcı yalnızca KENDİ bildirimlerini okur ve
-- okundu işaretler (update own). RLS: sahip okur/günceller.

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  type        text not null,           -- 'job_match' | 'followup' | 'feed_match' | 'digest' | ...
  title       text not null,
  body        text,
  link        text,                    -- dashboard içi hedef (ör. /dashboard/jobs?view=applied)
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id) where not read;

alter table public.notifications enable row level security;

-- Sahip KENDİ bildirimlerini okur.
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);

-- Sahip KENDİ bildirimlerini günceller (okundu işaretleme).
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Not: insert/delete politikası YOK → yalnızca service-role (RLS bypass) yazar.
