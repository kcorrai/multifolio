-- Multifolio — CV ATS skor geçmişi (trend grafiği için).
-- Kullanıcı CV'sini her kaydettiğinde (skor DEĞİŞTİYSE) bir anlık görüntü yazılır →
-- "+5 puan bu hafta" motivasyon grafiği. Skor CV içeriğinden DETERMINISTIK türetilir
-- (lib/cv/ats.ts scoreCv) → hassas değil; sahip kendi geçmişini okur/yazar.
-- cvs (0030) ÖZEL kalır; bu tablo yalnız türetilmiş sayıyı tutar (içerik YOK).

create table if not exists public.cv_score_history (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  cv_id       uuid not null references public.cvs (id) on delete cascade,
  score       int  not null,
  created_at  timestamptz not null default now()
);

create index if not exists cv_score_history_user_created_idx
  on public.cv_score_history (user_id, created_at desc);
create index if not exists cv_score_history_cv_created_idx
  on public.cv_score_history (cv_id, created_at desc);

alter table public.cv_score_history enable row level security;

-- Sahip kendi skor geçmişini okur.
drop policy if exists "cv_score_history_select_own" on public.cv_score_history;
create policy "cv_score_history_select_own"
  on public.cv_score_history for select
  using (auth.uid() = user_id);

-- Sahip kendi geçmişine ekler (skor içerikten deterministik; tahrif değeri yok).
drop policy if exists "cv_score_history_insert_own" on public.cv_score_history;
create policy "cv_score_history_insert_own"
  on public.cv_score_history for insert
  with check (auth.uid() = user_id);
