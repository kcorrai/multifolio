# Derinlemesine Denetim — 2. Tur (teklif, arama/filtre, light, EN, auth, a11y)

> 3. göz denetimi — 2026-07-04. 1. turda kapsanmayan yüzeyler, gerçek test hesabıyla
> (reviewer.test.0704@multifolio-review.com) canlı test edildi. **Kredi harcayan akışlar
> gerçekten çalıştırıldı** (iş ekle+eşleştir 1 kredi, teklif üretimi 2 kredi). Diğer
> denetimler: `UX-REVIEW-BACKLOG.md` (landing), `DASHBOARD-REVIEW-BACKLOG.md` (dashboard 1. tur).

## Bu turda DOĞRULANAN güçlü yönler (bunlar iyi çalışıyor)

- [x] **Teklif üretimi — flagship, mükemmel.** Upwork için **İngilizce** teklif (platform dili
  doğru), kişiselleştirilmiş, ilan gereksinimlerine değiniyor + **"Türkçe karşılığını gör"**
  toggle gerçek TR çeviri veriyor + **"Kapsama 5/7 karşılandı"** gereksinim analizi. TR
  freelancer için gerçek farklılaştırıcı.
- [x] **Eşleştirme motoru doğru çalışıyor.** İlgili bir ilan (React/Next.js SaaS) → **79/100**,
  4-boyutlu rubrik (Beceri %40→90, Deneyim %30→80, Bütçe %20→50, İlan kalitesi %10→85) +
  Güçlü/Eksik + çıkarılmış İlan Gereksinimleri. → **Feed sorunu motorda değil, havuz
  içeriği/varsayılan sıralamada** (bkz. DASHBOARD-REVIEW P0).
- [x] **İş ekle + oto-eşleştirme** akıcı; kredi doğru düşüyor (99→98→96).
- [x] **Arama işlevsel** — "react" → 11 ilgili sonuç (Fullstack/DevOps), keyword daraltması iyi.
- [x] **Light mode** temiz ve okunaklı; kontrast iyi (overview + auth sayfaları).
- [x] **EN dili** baştan sona düzgün çevrilmiş (nav, kartlar, auth).
- [x] **Şifre sıfırlama** sayfası temiz (split layout, EN + light'ta düzgün).
- [x] **Erişilebilirlik temeli makul** — butonlar isimli (0 isimsiz/38), input'lar label'lı,
  `<html lang>` locale'e uyuyor, modal Escape ile kapanıyor.

## P1 — Orta (yeni bulgular)

- [ ] **`profile_import` kullanım kartı ham etiketle görünüyor (KESİN)**
  - Nerede: Genel Bakış tür-bazlı kullanım kartları (`components/dashboard/overview-tab.tsx` +
    `messages/{en,tr}.json`). Diğer tüm kind'lar çevrili ("Proposal Generation / Teklif Üretimi",
    "Job Matching", "Platform Adaptation"...) ama **`profile_import` hem EN hem TR'de ham string**.
  - Kabul: `profile_import` kind'ına iki katalogda da insan-okur etiket eklenir.

- [ ] **Arama filtreleri, havuzun sağlamadığı Upwork-kalite veri için tasarlanmış**
  - Nerede: `search-view.tsx` Filtreler paneli — "Müşteri min harcaması / Min saatlik / Min
    sabit fiyat" hepsi USD. Panelin kendi notu: "Mevcut ilan kaynakları müşteri harcaması
    bildirmiyor — bu filtre veri geldiğinde etkinleşir."
  - Sorun: filtrelerin çoğu mevcut havuzda (Arbeitnow) **atıl**. DASHBOARD-REVIEW P0 havuz-
    uyumsuzluğunu güçlendiriyor.
  - Kabul: havuz zenginleşene kadar atıl filtreler gizlenir/pasif işaretlenir; ya da havuz
    Upwork-benzeri veri sağlayan kaynaklarla beslenir.

## P2 — Küçük / cila

- [ ] **Liste sayfalarında başlık hiyerarşisi zayıf** — Jobs sayfasında yalnız `H1: Jobs`;
  ilan satırları/bölümler heading değil (ekran okuyucu ile bölüm gezinmesi zayıf).
- [ ] **Fiverr logosu "irerr" görünümü light mode'da da var** (cross-theme; `platform-logo.tsx`).
- [ ] **Kredi maliyetleri tutarlı gösteriliyor** ama not: teklif 2 kredi, eşleştirme 1, uyarlama
  1 — modal/butonlarda rozet var; sadece kullanıcı beklentisi için fiyat sayfasında da
  "hangi işlem kaç kredi" tablosu faydalı olur (DASHBOARD/UX kredi-değer maddesiyle bağlantılı).

## Aktif WIP sırasında gözlemlenen (shipped bug DEĞİL)
- Denetim sırasında **Portfolyo nav'ı canlı geri getiriliyordu** (`/dashboard/portfolio`).
  Kısa süre sidebar'da ham `dashboard.nav.portfolio` anahtarı göründü
  (`IntlError: MISSING_MESSAGE ... locale 'tr'`), sonra çeviri eklenince düzeldi.
  - Hatırlatma: portfolyo UI'si bitince i18n anahtarlarını **iki katalogda da** ekle
    (CLAUDE.md kuralı) + `npm run check` (catalog.test.ts) ile doğrula.
