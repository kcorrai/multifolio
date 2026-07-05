# Özellik Backlog — 2026-07-05

> Kaynak: kod tabanı envanteri (mevcut/stub/gap haritası) + 5-akışlı web/rakip araştırması
> (~150 arama) + eski backlog'lar (`competitor-backlog` memory, UX/DASHBOARD/DEEP/NEW-FEATURES
> turları). **Eski Tier 1-2 maddelerinin çoğu ZATEN yapıldı** (referral, public analiz, profil
> gücü, risk rozeti, feed skorlama prompt, haftalık digest, follow-up, EN/TR toggle, earnings,
> sağlık taraması, portfolyo UI) — aşağıdakiler gerçekten YENİ fırsatlar, tekrar değil.
>
> Stratejik zemin: hiçbir rakip "tek profil → çok platform" tezini hedeflemiyor (Upwork "Uma"
> dahil — yalnız kendi içinde çalışır). Hendek sağlam; aşağısı onu derinleştiren icra detayları
> + TR'de rakipsiz alanlar. Önem sırası: en üstteki en kritik.

Efor notasyonu: 🟩 düşük · 🟨 orta · 🟥 büyük.

---

## 🔴 Tier 0 — Lansmandan ÖNCE (bloklayıcı / canlı hata)

- [ ] **T0.1 — Ödemeyi AKTİF ET** 🟩 (kod %100 hazır) ⚠️ *Supabase işlemi → onay iste*
  - Sorun: Iyzico backend tam (checkout+callback+`grant_credits`+`purchases`) ama dashboard "Kredi Al"
    + tüm 402 durumları sahte "yakında" toast'ına gidiyor; toast **yanlışlıkla "Stripe" diyor**.
  - Yapılacak: migration `0027` push · Iyzico env + `NEXT_PUBLIC_APP_URL` gir · `shell.tsx` Buy
    butonu + `overview-tab.tsx` stat kartı + 402 nudge'ları (`proposal-modal`, `job-add-modal`,
    `use-adapt`, `portfolio-tab`, `low-credits-banner`) → gerçek `BuyCreditsButton`/checkout ·
    `messages/en.json:268-269` "Stripe" → "Iyzico"/nötr. ✅ String düzeltildi 2026-07-05
    (`comingSoonBody` artık nötr "Credit purchasing goes live very soon." / TR karşılığı) —
    KALAN: env + migration push + buton/402 wiring (senin aksiyonunla).
  - Dosyalar: `app/api/checkout/*`, `lib/payments/*`, `components/buy-credits-button.tsx`,
    `components/dashboard/{shell,overview-tab,dashboard-context}.tsx`, `messages/{en,tr}.json`.

- [x] **T0.2 — `/earnings` fee modeli** 🟩 → ~KAPANDI (keşif: zaten doğru)
  - Doğrulandı: `lib/earnings/calculator.ts:36-43` Upwork ZATEN düz %10 (güncel model, eski kademeli
    değil), Armut ZATEN dışarıda (`:37` yorumu: "komisyon değil teklif ücreti → custom kullanılır"),
    Fiverr/Bionluk %20. Canlı hata YOK. Armut pay-per-lead yolu + gerçek TR vergi dilimi ihtiyacı
    **T1.2'ye taşındı** (yeni araç orada). Bu madde kapalı.

- [~] **T0.3 — Sahte testimonial'ları emekli et → gerçek toplama widget'ı** 🟨 (hukuki risk)
  - ✅ 2026-07-05: Sahte veriler GİZLENDİ — `messages/{en,tr}.json` `landing.testimonials.items`
    boş dizi → `TestimonialsSection` null döner (bölüm kaybolur). Hukuki risk kapandı.
  - [ ] KALAN: gerçek toplama widget'ı — paylaşılabilir link → müşteri kısa form → owner onayı →
    portfolyoda/landing'de "Wall of Love". Yeni tablo + public submit route + Resend.

- [ ] **T0.4 — Yasal placeholder + kişisel e-posta doldur** 🟩 (backlog'da zaten açık)
  - `messages/en.json:983` `[Company Name]/[Address]/[Tax ID]` → gerçek · `yanlizcakaan@gmail.com`
    (884/945/972/997/1006) → destek e-postası.

- [x] **T0.5 — Kayıt kredisi BUG'ı (reklamı yapılan 100 kredi HİÇ verilmiyor)** 🟩 ✅ 2026-07-05
  - Çözüldü: `lib/credits/signup-bonus.ts` (`maybeGrantSignupCredits`, `SIGNUP_BONUS_CREDITS=100`,
    idempotency `user_metadata.signup_bonus_granted` + claim-first/rollback), `app/dashboard/layout.tsx`
    ilk ziyarette çağırır (bakiye çekilmeden önce). Migration YOK. NOT: mevcut hesaplar da bir
    sonraki dashboard ziyaretinde +100 alır (bayrak undefined). Aşağısı orijinal bug notu:
  - Keşif: `supabase/migrations/0005_credits.sql` `create_initial_credits()` bakiyeyi `default 0` ile
    açıyor; hiçbir kod yolu (auth callback, signup, referral) top-up yapmıyor. Ama landing/pricing/FAQ
    "100 ücretsiz kredi" diyor (`en.json:136,921,962` + hero badge). Yani yeni kullanıcı **0 kredi**
    alıyor → hiçbir ücretli aksiyonu deneyemiyor. Gerçek bug.
  - Yapılacak (iki seçenek): (a) `create_initial_credits` trigger'ında `balance` başlangıcını N yap
    (migration — Supabase işlemi), ya da (b) `maybeGrantReferralBonus` desenini aynala: ilk auth
    aksiyonunda service-role `grant_credits(p_user, N, 'signup')` çağır (kod-only, migration yok).
    (b) tercih edilir — Supabase push gerektirmez, idempotency `grant_credits` guard'ıyla + tek-sefer
    işareti. N = pazarlama vaadiyle uyumlu olmalı (100 mü, 10 mu — kullanıcı kararı; vaadi de güncelle).

---

## 🟠 Tier 1 — Edinim & aktivasyon (en yüksek ROI yeni özellik)

- [x] **T1.1 — Gelen ilan scam ön-filtresi** 🟩 ⭐ ✅ 2026-07-05
  - Çözüldü: `lib/feed/scam.ts` (saf `scanJobListing`, scam-odaklı ruleset: offplatform /
    upfront_payment / crypto_payment / financial_info; yüksek kesinlik, web3/equipment yanlış-poz
    testli) + `lib/feed/scam.test.ts` (9 test) + `components/dashboard/job-risk.tsx`
    (`JobScamBadge` satır + `JobScamWarning` panel) → `pool-job-row` + `pool-job-panel`'e bağlı +
    i18n `feed.scam.*` (en/tr). AI maliyeti sıfır. (scan.ts DEĞİL — o giden metin; bu ayrı ayna.)

- [ ] **T1.2 — Çok-platform net gelir karşılaştırıcı + TR vergi araçları** 🟨 ⭐ (TR'de rakipsiz, SEO)
  - Net karşılaştırıcı: tutar gir → 5 platformda ele geçen net yan yana (en marka-uyumlu yeni araç,
    "tek profil çok platform"u somutlaştırır; istemci-tarafı, AI yok).
  - TR vergi checker: **GVK %80 yazılımcı istisnası** (yurtdışı müşteriye hizmet — tam kullanıcı
    profili, Batılı rakip asla yapmaz) + genç girişimci + stopaj/KDV. "not tax advice" uyarısı.

- [ ] **T1.3 — Match skoru → "ne eklemeli" aksiyon listesi** 🟩
  - Rubriği "X becerisini ekle / Y sonucunu belirt → skor +N" aksiyonlarına çevir. Harcanan kredinin
    değerini görünür kılar → sonraki krediyi harcatır. `matchJobToProfile` çıktı şeması değişikliği.

- [ ] **T1.4 — Onboarding checklist + boş-durum örnekleri + profil gücü kademeleri** 🟩
  - En kanıtlı retention kaldıraçları ("boş ekranda %84 terk"). Profil gücünü kademeye çevir
    (Başlangıç→All-Star, "+1 portfolyo = +%5" şeffaf); "%38 vs %100" çelişkisini de kapatır.

- [ ] **T1.5 — Dönüşüm kopya kaldıraçları** 🟩 (çok düşük efor)
  - `/analyze` teaser'da boş kesme yerine kilitli SAYI ("3 iyileştirme alanı daha — kaydol") ·
    exit-intent yakalama · büyük pakette "+N kredi" çerçevesi · anti-Connects/anti-"teklif ücreti"
    konumlandırması ("ürettiğin metin senin olur, belirsiz denemelere para yok").

---

## 🟡 Tier 2 — Retention & farklılaşma

- [ ] **T2.1 — Uzantıyla tek-tık iş yakalama** 🟨 — herhangi ilan sayfası → `job_listings` (Teal/Huntr;
  `extract.ts`/`content.ts`/`background.ts` reuse; "manuel iş ekle" sürtünmesini öldürür).
- [ ] **T2.2 — Kazanma oranı vs AI-skor analitiği** 🟨 — `job_listings.status` × `job_scores` korelasyonu;
  saf agregasyon, AI'sız, eşleştirmenin işe yaradığını kanıtlar (genel CRM'ler yapamaz).
- [ ] **T2.3 — Teklif ton/uzunluk kontrolleri + "geçmiş tekliflerimden öğren"** 🟨 — resmi↔samimi/
  kısa↔detaylı slider + kullanıcının eski tekliflerinden ses tonu; "AI slop" şikayetini öldürür.
- [ ] **T2.4 — Uzantı "sayfaya yapıştır" (asla göndermez)** 🟨 — cover-letter kutusunu doldur, auto-submit yok.
- [ ] **T2.5 — Portfolyo değer katmanları** 🟨 — sayfa başı SEO metadata + JSON-LD (link önizlemesi) ·
  Problem→Çözüm→Sonuç vaka şeması (AI mevcut işlerden) · nitelikli "İşe al" formu → dashboard lead.
- [ ] **T2.6 — Feed iyileştirmeleri** 🟨 — digest konu satırı = eşleşme sayısı (bedava, +%58 CTR) ·
  saat dilimi/vize filtresi (TR'de #1 elenme sebebi) · alert cadence + duraklat · "bilinen şirket" rozeti.
- [ ] **T2.7 — Armut "teklif ver / geç" ROI yardımcısı** 🟨 — pay-per-lead'de kazanma olasılığı +
  break-even (`match.ts`/rubrik reuse); kimsenin yapmadığı gerçek TR farklılaşması.

---

## 🟢 Tier 3 — Orta vade / daha büyük

- [ ] **T3.1 — Özel domain portfolyo** 🟥 — `janedoe.com` → Vercel domain API; ücretli katman.
- [ ] **T3.2 — Bildirim merkezi (zil + inbox) + gerçek-zamanlı alert** 🟨 — yeni-eşleşmede push (Telegram/webhook geri gelebilir).
- [ ] **T3.3 — Mini-CRM** 🟨 — müşteri varlığı (post-hire) + notlar/etiketler · kanban board (`JobStatus`'a oturur) · nakit-akışı tahmini.
- [ ] **T3.4 — Standalone mikro-araçlar** 🟩 — headline skoru · ters "ne ücret istemeliyim" · Connects/kredi ROI (hepsi `/analyze`+`/earnings` deseni, SEO hunisi).
- [ ] **T3.5 — Portfolyo PDF export + şifre-korumalı projeler + canlı gömme** 🟨 — Figma/GitHub/Loom iframe (allow-list `lib/sanitize.ts`).

---

## ⛔ Yapma (araştırmayla teyitli)
Auto-apply/auto-bid (ban + %1-6 dönüşüm; farklılaştırıcın *yapmamak*) · native fatura/muhasebe
(Paraşüt/Ruul sahipleniyor; KDV) · gerçek e-imza · ajans çok-koltuk CRM · iki-taraflı pazaryeri
(Faz 6) · Fiverr/Bionluk keyword-rank scraping (bot duvarı).

---

## Önerilen sıra
1. **Tier 0 tek seansta** (para kapısı + `/earnings` hatası + testimonial + yasal + kayıt kredisi)
   — gelir ve güvenilirlik önündeki gerçek engeller. Ödeme aktivasyonu Supabase onayı ister.
2. Sonra **T1.1 (scam filtresi)** ve **T1.2 (TR vergi/net araçları)** — düşük efor, altyapı hazır, TR'de rakipsiz.
