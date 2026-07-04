# UX / Tasarım / Ürün Denetim Backlog'u

> 3. göz denetimi — 2026-07-04. Canlı gezinme (landing tüm bölümler, login, `/analyze`,
> `/earnings`, mobil 390px) + kod çapraz kontrolü ile bulundu. Önceliğe göre sıralı.
> Her madde: **ne / nerede / kabul kriteri**.

## P0 — Kritik (para & güven kaybettiren) — ✅ TAMAMLANDI (2026-07-04, commit `b0f6149`)

- [x] **Mobil navigasyonda hamburger menü yok** → `components/mobile-nav.tsx` (createPortal ile body'ye; hero altında kalma bug'ı çözüldü); site-header mobilde logo+hamburger.
  - Nerede: `components/site-header.tsx` — nav `hidden md:flex`, mobil menü butonu yok.
  - Sorun: 390px'de Özellikler / Nasıl Çalışır / Ücretsiz Profil Analizi / Net Kazanç
    Hesaplayıcı / Fiyat linklerine header'dan ulaşılamıyor (en değerli funnel araçları
    mobilde ölü). Ayrıca sağ üstteki "Ücretsiz Başla" CTA ekrandan taşıp kesiliyor.
  - Kabul: mobilde hamburger + açılır menü tüm nav linklerini gösterir; CTA taşmaz.

- [x] **"Portfolyo Sitesi" vaadi üründe yok** → KARAR: UI geri getirildi (arka uç %100 canlıydı;
    geri getirmek kaldırmaktan az işti). `/dashboard/portfolio` + `portfolio-tab` geri. Bonus:
    OpenAI structured-output bug'ı düzeltildi (url `.optional()` API'yi 400'lüyordu → `portfolioGenSchema`).

- [x] **Gerçek satın alma akışı yok (Iyzico beklemede)** → ARA ADIM: dürüst işaret eklendi
    (`pricing-section` "kredi satın alma yakında" banner + kart "yakında" çipi). Iyzico sonraki tur.

- [x] **Yasal/güven altyapısı eksik** → `app/{privacy,terms,kvkk,contact}` (ortak `legal-shell`,
    iki dilli ŞABLON i18n — veri sorumlusu `[...]` yer tutuculu, hukuki inceleme notlu) + footer linkleri.
    NOT: metinler taslak; ödeme öncesi hukukçuya inceletilmeli + `[Şirket Ünvanı/Adres/VKN]` doldurulmalı.

## P1 — Orta (dönüşümü zayıflatan)

- [ ] **Fiyatlar USD, hedef kitle TR**
  - ✅ TAMAMLANDI (2026-07-04, `3b50efe`): locale bazlı — TR kullanıcı ₺349/₺1.149/₺2.749, yabancı $9/$29/$69 (ayrı belirlenmiş fiyatlar, canlı kur değil).

- [x] **Kredi → değer eşlemesi** (2026-07-04, `01fa26b`): pricing kartlarına "≈ N uyarlama veya N teklif" eklendi.

- [x] **Header auth durumu tutarsız / şüpheli** — ✅ CANLI E2E İLE DOĞRULANDI (2026-07-04, Playwright):
  logged-out `/`+`/pricing` cache ısıtıldı → login (`router.push`+`router.refresh`) → geri tuşuyla
  cache'lenmiş sayfaya dönüldü → header + sayfa CTA'ları TAZE logged-in ("Dashboard") render edildi.
  **Staleness bug'ı YOK**: `router.refresh()` router cache'i doğru geçersiz kılıyor; server render'lar her
  zaman tutarlı. Logout = native form POST = tam yenileme = daima doğru. BONUS FIX: `/pricing` alt CTA +
  plan kartı CTA'ları login iken href=`/dashboard` iken label statik "Ücretsiz başla" gösteriyordu →
  `isLoggedIn ? common.goToDashboard : ...` (landing finalCta deseni; `pricing-section.tsx` + `pricing/page.tsx`).

- [x] **Geliştirici jargonu** (2026-07-04, `01fa26b`): RLS/Zod/DOMPurify rozetleri → "Şifreli/Sana özel/Varsayılan gizli"; secure açıklaması da fayda diline.

- [x] **`/earnings`'ten ürüne köprü** (2026-07-04, `01fa26b`): sonuç altına kayıtsıza bağlamsal signup CTA (analyze deseni).

## P2 — Küçük / cila

- [x] **Footer nav** (UX P0 turunda, `b0f6149`): footer iki katmanlı yeniden yapıldı — earnings + yasal linkler eklendi, mobilde de görünür.
- [x] **Fiverr logosu** (2026-07-04, `01fa26b`): wordmark → letter-mark (yeşil kare + beyaz "fi"), Bionluk/Armut deseniyle tutarlı.
- [x] **finalCta mesajı** (2026-07-04, `f54bb61`): "Beta sürecinde ücretsiz" → "100 ücretsiz krediyle başla — daha fazlası gerekirse öde" (pricing ile hizalı).
- [~] **Sosyal kanıt yok** — GERÇEK beta kullanıcı sözü gerekir; sahte testimonial eklenmez (dark pattern). Beta'da gerçek referans toplandıkça eklenecek.
- [x] **Analyze otomatik kaydırma** (2026-07-04, `01fa26b`): sonuç gelince `scrollIntoView` (reduced-motion'a saygılı `scroll-mt-24`).

## Güçlü yönler (koru)
- Olgun görsel dil (renk sistemi, tipografi, bento grid, mikro-animasyon, dark/light).
- `/analyze` funnel'ı (skor + kilitli tam rapor teaser + kayıt CTA + 100 kredi) — iyi kurgu.
- `/earnings` hesaplayıcı — gerçek zamanlı, disclaimer'lı, temiz SEO aracı.
