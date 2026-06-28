# Roadmap

Faz tabanlı ilerleme. Her faz, bir öncekinin üzerine inşa edilir.

## Dal stratejisi
`phase-N-*` dal stratejisi Faz 4 sonrasında terk edildi. Artık direkt `main` üzerinde çalışılıyor.

- **Faz 0 — Zemin + üç sütun** ✅
  Çalışan Next.js iskeleti; (1) anlık hata görünürlüğü (Sentry + `lib/errors`),
  (2) güvenli-by-default (Zod + RLS + sanitize), (3) dokümantasyon disiplini.
  Done: bilerek fırlatılan hata Sentry'de doğru satırla; örnek uç nokta Zod+auth+RLS
  şablonuyla korumalı; `CLAUDE.md` tek başına yön verir; `npm run dev` ve `npm run check` çalışır.

- **Faz 1 — Tek profil → LinkedIn + Upwork uyarlaması** ✅
  Kullanıcı profilini bir kez girer; Anthropic Claude ile LinkedIn ve Upwork için
  optimize metinler üretilir. USD harcama takibi (`usage_events` tablosu, `lib/ai/pricing.ts`).
  `phase-1-adaptation` dalı `main`'e merge edildi (ff-only).

- **Faz 2 — Otomatik portfolyo sitesi** ✅
  Profil verisinden yayımlanabilir portfolyo. `/p/[slug]` genel sayfası, OG meta,
  slug/published ayarları. `phase-2-portfolio` dalı `main`'e merge edildi (ff-only).

- **Faz 3 — Akıllı eşleşme + başvuru takibi** ✅
  `job_listings` tablosu (RLS), AI profil×ilan eşleştirme (0-100 skor + güçlü/eksik),
  başvuru pipeline (Kaydedildi→Görüşme→Teklif→Reddedildi), İlanlar sekmesi UI.
  SaaS UI yeniden tasarımı: Plus Jakarta Sans, koyu hero, ürün mockup, 6 özellik bölümü.
  `phase-3-matching` dalı `main`'e merge edildi (ff-only).

- **Faz 4 — Fiverr, Bionluk, Armut + analitik + OpenAI** ✅
  5 platform uyarlaması (LinkedIn/Upwork/Fiverr/Bionluk/Armut), kullanım analitiği sekmesi,
  OpenAI `gpt-4o-mini` geçişi, production deploy (Vercel). `phase-4-platforms` dalı main'e merge edildi.

- **Faz 4.5 — Kredi UI + Stripe hazırlığı** *(şu an buradayız)*
  `credits` tablosu (migration), dashboard kredi bakiyesi göstergesi, "Kredi Satın Al" butonu.
  Stripe backend entegrasyonu beklemede (US banka hesabı gerekiyor); UI şimdi, ödeme altyapısı sonra.

- **Faz 5 — İşveren tarafı / iki taraflı pazar** *(çok sonra)*
  İşveren tarafı akışları ve pazar yeri.
