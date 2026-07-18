-- İstihdam türü (job_type) zenginleştirme: havuz maaşlı tam-zamanlı uzaktan-iş
-- panolarından (Remotive/RemoteOK/WWR) besleniyor — freelance/gig değil. Remotive
-- her ilanda job_type (full_time/contract/freelance/part_time) veriyordu ama atılıyordu.
-- Bunu yakalayıp gerçek veriye dayanan "İstihdam türü" filtresini besliyoruz.
-- Filtre semantiği lenient (0013 deseni): job_type null olan ilan filtrede ELENMEZ.

alter table public.job_pool
  add column if not exists job_type text;

alter table public.job_feeds
  add column if not exists job_types text[] not null default '{}';
