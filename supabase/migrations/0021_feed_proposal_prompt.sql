-- Feed başına teklif yönergesi (UpHunt paritesi): kullanıcının serbest metin
-- prompt'u. Feed'den gelen (job_listings.source_pool_id'li) bir ilana teklif
-- üretilirken, ilana uyan İLK prompt'lu feed'in yönergesi AI prompt'una eklenir.

alter table public.job_feeds
  add column if not exists proposal_prompt text;
