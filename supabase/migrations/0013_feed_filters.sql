-- Feed filtre genişletmesi (uphunt paritesi): ülke hariç tutma, saatlik/sabit
-- ücret tabanı ayrımı, müşteri harcaması ve cache'li skor eşiği.
-- job_pool.client_spent scraper (Alt-proje B) tarafından doldurulur; seed'de null.
-- Filtre semantiği lenient: ilanda veri yoksa (null) filtre o ilanı ELEMEZ.

alter table public.job_feeds
  add column if not exists exclude_countries text[] not null default '{}',
  add column if not exists min_hourly_rate   numeric,
  add column if not exists min_fixed_price   numeric,
  add column if not exists min_client_spent  numeric,
  add column if not exists min_score         smallint;

alter table public.job_pool
  add column if not exists client_spent numeric;
