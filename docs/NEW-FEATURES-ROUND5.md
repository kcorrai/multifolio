# Yeni Özellik Tespiti + Fix Doğrulama — 5. tur

> 3. göz denetimi — 2026-07-04. Son denetimden (`a3f1d57`) sonra eklenen + o sırada
> commit'liydi ama canlı doğrulanmamış değişiklikler taze test hesabıyla (reviewer.round4)
> canlı test edildi. Önceki turlar: `UX-REVIEW-BACKLOG.md`, `DASHBOARD-REVIEW-BACKLOG.md`,
> `DEEP-REVIEW-BACKLOG.md`, `JOBS-FLOWS-REVIEW.md`, `NEW-FEATURES-REVIEW.md`.

## 🆕 Gerçekten YENİ özellik (son denetimden sonra: `06ee062`)

- [x] **Onboarding sonrası "iş bul" next-step CTA** — DOĞRULANDI ✅
  - Nerede: `components/dashboard/overview-tab.tsx` — `profileSaved && jobs.length === 0`
    olduğunda Overview'ın en üstünde cyan kart: **"You're set up — now find work · Browse
    matched jobs, score your fit and send tailored proposals · Browse jobs →"** → `/dashboard/jobs`.
  - Analiz: Dashboard P1 "onboarding sonrası yön zayıf" bulgusunu temiz kapatıyor. İyi
    konum (fold üstü), tek net aksiyon, iş takip edilince kayboluyor (kalıcı dürtme yok).
  - Küçük gözlemler (defect değil):
    - Amber verify-email banner'ının hemen altında → yeni kullanıcıda üst üste iki dikkat
      çubuğu. Kabul edilebilir (verify banner kapatılabilir).
    - Koşul `jobs.length === 0`: kullanıcı feed yerine **manuel** iş eklerse de CTA kaybolur
      (feed'i hiç görmemiş olabilir). Minör.

## ✅ Önceden eklenip bu turda CANLI doğrulanan fix'ler

- [x] **TL fiyatlandırma (locale-bazlı)** — TR kullanıcı **₺349 / ₺1.149 / ₺2.749** görüyor
  (eski $9/$29/$69). UX P1 "Fiyatlar USD, hedef kitle TR" KAPANDI. (`3b50efe`)
- [x] **Kredi → değer eşlemesi** — kartlarda "≈100 profil uyarlaması veya 50 teklif" (500→250,
  1500→750). UX P1 KAPANDI. (`01fa26b`)
- [x] **Dürüst ödeme işareti** — her fiyatta **"YAKINDA"** rozeti + "Kredi satın alma çok
  yakında — şimdilik herkes 100 ücretsiz krediyle başlıyor" notu. UX P0 dürüstçe işaretli.
- [x] **Jargon → fayda dili** — "Güvenli & Hızlı" kartı artık **"Şifreli / Sana özel /
  Varsayılan gizli"** + "Verilerin şifreli saklanır ve yalnızca sana aittir" (eski RLS/Zod/
  DOMPurify). UX P1 KAPANDI. (`01fa26b`)
- [x] **Earnings → signup CTA** — `components/earnings/earnings-calculator.tsx:203` `!isLoggedIn`
  koşullu bağlamsal CTA (kayıtsıza gösterilir; girişliye gizli — doğru davranış). UX P1 KAPANDI.

## 🟡 Analiz notları (yeni, minör)

- [x] **TL fiyatları statik mi, FX mi?** ₺349/₺1.149/₺2.749 sabit çeviri gibi görünüyor. TRY
  oynarsa $9/$29/$69 niyetinden sapar. Kabul: ya periyodik güncellenir ya kur-bazlı hesaplanır;
  ya da "yaklaşık" ibaresi netleştirilir. (`components/pricing-section.tsx`)
  — KAPANDI 2026-07-05: TR para biriminde fiyat grid'i altında "TL fiyatları yaklaşık USD
  karşılığıdır; kesin tutar satın alma açılınca netleşir" notu (`pricing.tryApprox`).

## Sonuç
Bu turda **yeni defect yok** — tek yeni özellik (onboarding CTA) temiz; doğrulanan fix'ler
UX backlog'unda 4+ P0/P1 maddesini daha kapatıyor. Kalan açık maddeler: dashboard P1 onboarding
(bu commit'le kapandı), `NEW-FEATURES-REVIEW.md`'deki 3 madde (yasal placeholder+kişisel eposta,
Public toggle a11y, public portfolyo sade) hâlâ açık.
