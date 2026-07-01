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

- **Faz 4.5 — Kredi UI + Stripe hazırlığı** ✅
  `credits` tablosu (migration), dashboard kredi bakiyesi göstergesi, "Kredi Satın Al" butonu.
  Stripe backend entegrasyonu beklemede (US banka hesabı gerekiyor); UI şimdi, ödeme altyapısı sonra.

- **Faz 5 — Landing maksimasyon + onboarding** ✅
  PlatformLogo bileşeni (LinkedIn/Upwork/Fiverr SVG + Bionluk/Armut letter-mark);
  landing: hero'da 5 platform adı + logo strip, platforms bölümü, Feature kartında logolar;
  dashboard: 3 adımlı onboarding banner (profil → uyarlama → portfolyo), ilerleme takibi.

- **Faz 7 — Proposal Engine + iş detay paneli + bildirim + analitik** ✅
  Platform-spesifik AI teklif üretimi (`lib/ai/proposal.ts`, `app/api/proposal`, `proposal-modal`,
  `proposals` tablosu — migration `0007`); iş detay paneli (`job-detail-panel`, `job-add-modal`,
  `awaiting_reply` durumu); e-posta bildirim (Resend API, `lib/notifications/email.ts` — skor ≥ 70
  olunca; Telegram planı iptal edildi); analitik genişletme (`applicationStats` — başvuru performansı).
  Dashboard tam sayfa sidebar düzenine geçti (7 tab). `main` üzerinde çalışıldı.

- **Faz 8 — Global i18n (EN varsayılan + TR)** ✅
  next-intl cookie tabanlı i18n (URL routing yok, Supabase middleware korunur). Tüm UI metni
  `messages/{en,tr}.json` kataloğuna taşındı; EN/TR dil seçici; ilk ziyaret tarayıcı dilinden
  algılanır (cookie'de kalıcı). AI çıktı dili (teklif/uyarlama/eşleştirme/portfolyo) UI locale'ine
  uyar (`lib/ai/language.ts`); sunucu hata mesajları `errors` namespace'inden çevrilir; match
  bildirim e-postası iki dilli; auth e-posta şablonu İngilizce. `i18n/`, `messages/`,
  `components/language-toggle.tsx` eklendi. Kod yorumları Türkçe kaldı.

- **Faz 9 — Kredi ekonomisi + landing (Pricing/FAQ)** ✅
  Pay-as-you-go kredi sistemi canlı: `credits` tablosu + deduct/refund RPC'leri (harcama
  closure'da kalıcılık; yazım patlarsa kredi iade), yetersiz kredide 402 → locale'e göre
  çevrilmiş hata + "Kredi al" toast nudge; job-add modalında AI eşleştirme hataları (402 dahil)
  inline gösterilir, modal açık kalır. USD kullanıcı arayüzünden kaldırıldı. Landing'e kredi
  paketleri (Starter/Pro/Scale) Pricing bölümü + FAQ eklendi. `main` üzerinde çalışıldı
  (Vercel auto-deploy). Not: prod migration `0011` (deduct/refund p_amount>0 guard) henüz
  prod'a uygulanmadı.

- **Faz 6 — İşveren tarafı / iki taraflı pazar** *(çok sonra)*
  İşveren tarafı akışları ve pazar yeri.
