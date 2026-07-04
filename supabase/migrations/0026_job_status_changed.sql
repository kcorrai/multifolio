-- Dalga 3: follow-up hatırlatıcı — durum değişim zamanı.
-- updated_at HER güncellemede (not düzenleme dahil) sıçrar; hatırlatıcının
-- "kaç gündür yanıt yok" hesabı yalnız DURUM değişiminde sıfırlanmalı.
-- Kolonu PATCH route'u durum değiştiğinde doldurur; eski satırlarda null →
-- istemci updated_at'e düşer (lib/followup.ts fallback zinciri).

alter table public.job_listings
  add column if not exists status_changed_at timestamptz;
