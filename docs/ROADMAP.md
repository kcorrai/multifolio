# Roadmap

Faz tabanlı ilerleme. Her faz, bir öncekinin üzerine inşa edilir.

## Dal stratejisi
Her faz kendi `phase-N-*` dalında geliştirilir → `main`'e `--ff-only` merge ile kapanır.
Yeni faz başlarken yeni dal açılır (`git checkout -b phase-N-*`).

- **Faz 0 — Zemin + üç sütun** ✅
  Çalışan Next.js iskeleti; (1) anlık hata görünürlüğü (Sentry + `lib/errors`),
  (2) güvenli-by-default (Zod + RLS + sanitize), (3) dokümantasyon disiplini.
  Done: bilerek fırlatılan hata Sentry'de doğru satırla; örnek uç nokta Zod+auth+RLS
  şablonuyla korumalı; `CLAUDE.md` tek başına yön verir; `npm run dev` ve `npm run check` çalışır.

- **Faz 1 — Tek profil → LinkedIn + Upwork uyarlaması** ✅
  Kullanıcı profilini bir kez girer; Anthropic Claude ile LinkedIn ve Upwork için
  optimize metinler üretilir. USD harcama takibi (`usage_events` tablosu, `lib/ai/pricing.ts`).
  `phase-1-adaptation` dalı `main`'e merge edildi (ff-only).

- **Faz 2 — Otomatik portfolyo sitesi** *(şu an buradayız)*
  Profil verisinden yayımlanabilir portfolyo. Üretilen HTML render öncesi sanitize edilir.

- **Faz 3 — Akıllı eşleşme + başvuru takibi**
  İlanlarla eşleştirme ve başvuru durum takibi (pipeline).

- **Faz 4 — Fiverr, Bionluk, Armut + analitik + ödeme (Stripe)**
  Kalan platform uyarlamaları, kullanım analitiği ve kredi satın alma.

- **Faz 5 — İşveren tarafı / iki taraflı pazar** *(çok sonra)*
  İşveren tarafı akışları ve pazar yeri.
