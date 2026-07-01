-- Teklif Kalitesi (C+D): üretilen teklifin ilan gereksinimlerine karşı kapsaması.
-- coverage: [{ requirement, status: 'met'|'partial'|'missing', note }]
alter table public.proposals
  add column if not exists coverage jsonb;
