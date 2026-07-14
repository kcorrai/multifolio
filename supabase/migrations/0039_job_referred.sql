-- Referans (referral) işareti: bu başvuru bir iç referansla mı geldi?
-- Kanıt (Ashby, 38M başvuru): referanslı adayların ~%40'ı mülakata ulaşır (inbound baseline'ın
-- çok üstünde). Kullanıcı referans yolunu görüp önceliklendirebilsin. boolean, varsayılan false
-- → mevcut satırlar geçerli kalır. job_listings RLS'i zaten sahip-erişimini kapsar.

alter table public.job_listings
  add column if not exists referred boolean not null default false;
