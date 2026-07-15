-- TEK SEFERLİK job_pool çöp temizliği (MANUEL — kod değil).
--
-- NEDEN: Kalite süzgeci (lib/scrape/quality.ts) SONRADAN eklendi; canlıdaki
-- ESKİ pool satırları (casino/data-entry/jenerik "All Positions" vb.) hâlâ
-- feed'i ve relevance motorunu kirletiyor. Bu script o çöpü siler. Yeni scrape
-- koşuları zaten cleanScrapedRows'tan geçtiği için bu bir defalıktır.
--
-- NASIL: Supabase Dashboard → SQL Editor'de service-role ile çalıştır.
--        Önce SELECT ile say (kaç satır silinecek gör), sonra DELETE'i aç.
--        job_pool'a yalnız service-role yazar; RLS bunu engellemez ama panelden koş.
--
-- KURALLAR quality.ts ile birebir: JUNK_TITLE_PATTERNS + GENERIC_TITLES.

-- 1) Önizleme: silinecek satır sayısı (DELETE'ten önce çalıştır).
select count(*) as junk_rows
from public.job_pool
where
  lower(btrim(title)) in (
    'jobs','job','all positions','various positions','multiple positions',
    'open positions','other','general','n/a','position'
  )
  or title ~* '\y(casino|gambling|betting|sportsbook|forex|binary\s*option|airdrop|escort|adult\s+content)\y'
  or title ~* '\y(data\s*entry|file\s*clerk|form\s*filling|typing\s*job|copy[-\s]?paste\s*job|reshipping|package\s*handler|envelope\s*stuffing|mystery\s*shopper)\y';

-- 2) Silme: önizlemeyi doğruladıktan SONRA aşağıdaki bloğun yorumunu kaldır.
-- delete from public.job_pool
-- where
--   lower(btrim(title)) in (
--     'jobs','job','all positions','various positions','multiple positions',
--     'open positions','other','general','n/a','position'
--   )
--   or title ~* '\y(casino|gambling|betting|sportsbook|forex|binary\s*option|airdrop|escort|adult\s+content)\y'
--   or title ~* '\y(data\s*entry|file\s*clerk|form\s*filling|typing\s*job|copy[-\s]?paste\s*job|reshipping|package\s*handler|envelope\s*stuffing|mystery\s*shopper)\y';
