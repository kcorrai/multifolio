-- Batch 3 (retention/CRM): işlere serbest etiket (tag) — mini-CRM sınıflandırması.
-- text[] (ayrı tablo gerekmez; job_listings RLS'i zaten sahip-erişimi kapsar).
-- Boş dizi varsayılan → mevcut satırlar geçerli kalır. Filtre/kanban rozeti kullanır.

alter table public.job_listings
  add column if not exists tags text[] not null default '{}';
