-- Feed e-posta bildirimi: kullanıcı feed başına opt-in (varsayılan kapalı).
-- Cron scrape koşusu sonrası koşuda YENİ eklenen ilanlar notify=true feed'lerle
-- eşleşirse sahibine kullanıcı başına TEK özet e-posta gider (lib/scrape/notify.ts).

alter table public.job_feeds
  add column if not exists notify boolean not null default false;
