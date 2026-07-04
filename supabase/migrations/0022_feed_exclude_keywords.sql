-- Feed başına hariç tutulacak anahtar kelimeler (0013'teki exclude_countries deseni).
-- İlan başlığı/açıklaması/becerilerinde bu kelimelerden biri geçerse feed'den elenir.
alter table public.job_feeds
  add column if not exists exclude_keywords text[] not null default '{}';
