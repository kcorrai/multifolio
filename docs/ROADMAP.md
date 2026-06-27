# Roadmap

Faz tabanlı ilerleme. Her faz, bir öncekinin üzerine inşa edilir.

- **Faz 0 — Zemin + üç sütun** ✅
  Çalışan Next.js iskeleti; (1) anlık hata görünürlüğü (Sentry + `lib/errors`),
  (2) güvenli-by-default (Zod + RLS + sanitize), (3) dokümantasyon disiplini.
  Done: bilerek fırlatılan hata Sentry'de doğru satırla; örnek uç nokta Zod+auth+RLS
  şablonuyla korumalı; `CLAUDE.md` tek başına yön verir; `npm run dev` ve `npm run check` çalışır.

- **Faz 1 — Tek profil → LinkedIn + Upwork uyarlaması** ✅
  Kullanıcı profilini bir kez girer; Anthropic Claude ile LinkedIn ve Upwork için
  optimize metinler üretilir. USD harcama takibi (`usage_events` tablosu, `lib/ai/pricing.ts`).
  `phase-1-adaptation` dalında; main'e merge bekliyor.

- **Faz 2 — Otomatik portfolyo sitesi** *(şu an buradayız)*
  Profil verisinden yayımlanabilir portfolyo. Üretilen HTML render öncesi sanitize edilir.

- **Faz 3 — Akıllı eşleşme + başvuru takibi**
  İlanlarla eşleştirme ve başvuru durum takibi (pipeline).

- **Faz 4 — Fiverr, Bionluk, Armut + analitik + ödeme (Stripe)**
  Kalan platform uyarlamaları, kullanım analitiği ve kredi satın alma.

- **Faz 5 — İşveren tarafı / iki taraflı pazar** *(çok sonra)*
  İşveren tarafı akışları ve pazar yeri.
