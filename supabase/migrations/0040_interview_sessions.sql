-- Sahte mülakat OTURUMLARI: başlangıçta 'active' açılır, cevaplar geldikçe questions
-- jsonb'si güncellenir, kullanıcı bitirince 'completed' + overall_score damgalanır.
-- Amaç: oturum raporu (genel skor + tema özeti) + geçmiş oturumlarla ilerleme takibi.
-- job_reads deseni (RLS sahip-tümü); public select YOK — kişisel pratik verisi.

create table if not exists public.interview_sessions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  job_id         uuid references public.job_listings (id) on delete set null,
  difficulty     text not null default 'mid',        -- junior | mid | senior
  categories     text[] not null default '{}',       -- boş = tüm kategoriler
  question_count int not null default 6,
  overall_score  int,                                 -- bitişte yanıtlanan skorların ortalaması
  status         text not null default 'active',      -- active | completed
  -- questions: [{ category, question, strongAnswerHint, answer, score, strengths[],
  --              improvements[], modelAnswer }] — cevaplandıkça alanlar dolar.
  questions      jsonb not null default '[]'::jsonb,
  created_at     timestamptz not null default now(),
  completed_at   timestamptz
);

create index if not exists interview_sessions_user_idx
  on public.interview_sessions (user_id, created_at desc);

alter table public.interview_sessions enable row level security;

drop policy if exists "interview_sessions_all_own" on public.interview_sessions;
create policy "interview_sessions_all_own"
  on public.interview_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
