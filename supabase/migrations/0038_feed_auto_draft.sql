-- Feed başına OPT-IN arka-plan otomatik teklif taslağı. auto_draft_daily > 0 ise cron
-- (scrape sonrası) o feed'e uyan YENİ ilanlara teklif taslaklar (kredi harcar) — günde
-- en çok auto_draft_daily adet. Varsayılan 0 = KAPALI. Günlük sayaç feed satırında tutulur
-- (auto_draft_used + tarih); tarih değişince sıfırlanır → usage_events'e bağımlılık yok.
-- AUTO-SUBMIT YOK: yalnız taslak; kullanıcı Başvurulanlar'da gözden geçirip kendi gönderir.

alter table public.job_feeds
  add column if not exists auto_draft_daily int not null default 0,
  add column if not exists auto_draft_used  int not null default 0,
  add column if not exists auto_draft_used_date date;

-- 0..10 aralığı (UI ile tutarlı; opt-in feed başına en çok 10/gün).
alter table public.job_feeds
  drop constraint if exists job_feeds_auto_draft_daily_range;
alter table public.job_feeds
  add constraint job_feeds_auto_draft_daily_range check (auto_draft_daily between 0 and 10);
