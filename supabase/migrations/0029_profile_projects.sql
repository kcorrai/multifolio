-- profiles.projects: içe aktarılan YAPILANDIRILMIŞ projeler (her proje ayrı):
-- { title, description, role, skills[], images:[{url, caption}] }. Upwork uzantısı
-- window.__NUXT__'tan çeker; portfolyo görselleri (düz) profiles.portfolio'da kalır,
-- bu kolon projeleri gruplu (her biri kendi başlık/açıklama/beceri/görselleriyle) tutar.
-- RLS: profiles zaten sahibe sınırlı (mevcut politikalar kolonu kapsar).
alter table public.profiles
  add column if not exists projects jsonb not null default '[]'::jsonb;
