-- Profil görselleri: platform içe aktarmasında çekilen avatar + portfolyo.
-- Şimdilik dış URL'ler saklanır (Bionluk gcdn/bgcp) — indirme/Storage YOK; URL
-- değişirse yeniden çekmek tek tık. RLS zaten profiles'ta açık (0001), yeni
-- politika gerekmez. Mevcut satırlar için avatar_url NULL, portfolio boş dizi.
alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists portfolio  jsonb not null default '[]'::jsonb;
