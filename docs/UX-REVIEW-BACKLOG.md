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
  - Nerede: `components/pricing-section.tsx` ($9/$29/$69).
  - Kabul: TRY toggle veya "≈ ₺X" gösterimi (`/earnings`'teki para birimi deseni örnek).

- [ ] **Kredi → değer eşlemesi yok**
  - Nerede: fiyat kartları "100/500/1500 kredi" diyor ama 1 kredinin ne yaptığı belirsiz.
  - Kabul: karta "≈ X profil uyarlaması / X teklif" gibi somut karşılık eklenir.

- [ ] **Header auth durumu tutarsız / şüpheli**
  - Gözlem: landing "Dashboard" gösterdi, `/analyze` "Giriş Yap" gösterdi, `/dashboard`
    login'e attı — aynı `getUser()` kod yolu olmasına rağmen.
  - Kabul: oturum expiry/doğrulama elle test edilir; geçerli oturumda tüm sayfalar
    tutarlı "Dashboard" gösterir, geçersizde tutarlı "Giriş Yap".

- [ ] **Geliştirici jargonu son kullanıcıya gösteriliyor**
  - Nerede: `app/page.tsx` "Güvenli & Hızlı" kartı — RLS / Zod / DOMPurify rozetleri.
  - Kabul: fayda diline çevrilir ("Verilerin şifreli", "Sadece sana ait", "Güvenli altyapı").

- [ ] **`/earnings`'ten ürüne köprü yok**
  - Nerede: `components/earnings/earnings-calculator.tsx` / `app/earnings/page.tsx`.
  - Kabul: hesaplama sonrası signup'a çeken bağlamsal CTA eklenir (analyze deseni).

## P2 — Küçük / cila

- [ ] **Footer nav header'la tutarsız** — footer'da "Net Kazanç Hesaplayıcı" linki yok
  (header'da var); footer genelde çok ince. (`components/site-footer.tsx`)
- [ ] **Fiverr logosu** küçük boyutta "irerr" gibi bozuk okunuyor. (`components/platform-logo.tsx`)
- [ ] **"Beta sürecinde ücretsiz" final CTA'sı** ile ücretli fiyat kartları arası mesaj
  kafa karışıklığı — netleştir. (`app/page.tsx` finalCta)
- [ ] **Sosyal kanıt yok** — 3-4 gerçek testimonial funnel'ı güçlendirir (beta için opsiyonel).
- [ ] **Analyze submit sonrası otomatik kaydırma yok** — sonuç fold altında beliriyor.
  (`components/analyze/analyze-form.tsx`)

## Güçlü yönler (koru)
- Olgun görsel dil (renk sistemi, tipografi, bento grid, mikro-animasyon, dark/light).
- `/analyze` funnel'ı (skor + kilitli tam rapor teaser + kayıt CTA + 100 kredi) — iyi kurgu.
- `/earnings` hesaplayıcı — gerçek zamanlı, disclaimer'lı, temiz SEO aracı.
