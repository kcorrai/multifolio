# Yeni Özellikler + P0/P1 Düzeltmeleri Denetimi

> 3. göz denetimi — 2026-07-04 (4. tur). Kullanıcının UX-backlog'a karşı eklediği yeni özellikler
> + düzeltmeler taze test hesabıyla (reviewer.round4) canlı doğrulandı. Öncekiler: `UX-REVIEW-BACKLOG.md`,
> `DASHBOARD-REVIEW-BACKLOG.md`, `DEEP-REVIEW-BACKLOG.md`, `JOBS-FLOWS-REVIEW.md`.

## ✅ DOĞRULANAN düzeltmeler (canlı test geçti)

- [x] **Mobil hamburger menü** — 390px'de header logo+☰; menü tam-ekran overlay, TÜM nav linkleri
  (Features/How it works/Free profile check/Earnings calculator/Pricing + dil/tema + Log in/Start
  free) erişilebilir. Ücretsiz araçlar artık mobilden ulaşılıyor. CTA taşması yok. **P0 KAPANDI.**
- [x] **Feed alaka** — frontend profiliyle (React/Next.js) varsayılan feed artık **"Frontend
  Developer" (en üstte), Staff Product Engineer (frontend), UI Engineer (react/design)** gösteriyor;
  kaynaklar **Remotive/Remoteok**; Alman motor/üretim/(m/w/d) çöpü GİTMİŞ. **P0 KAPANDI** (dramatik).
- [x] **Profil gücü çelişkisi** — Overview artık **"Setup progress" %50** (kırmızı %38 değil);
  avatar/portfolyo **"Optional"** bölümünde (yüzdeye girmiyor) → manuel kullanıcı %100 olabilir.
  Profil sekmesindeki "Core profile" ile artık çelişmiyor. **P0 + P1-tavan KAPANDI.**
- [x] **Ham event etiketi** — "Profile Import" düzgün gösteriliyor (ham `profile_import` değil).
- [x] **Yasal/KVKK** — `/kvkk` (Kanun 6698, tüm bölümler + Art.11 hakları), `/privacy`, `/terms`,
  `/contact` mevcut; footer'da Privacy/Terms/KVKK/Contact linkleri + **dürüst uyarı** ("template,
  hukukçuya danış"). Footer'a eksik "Earnings calculator" da eklenmiş. **P0 + P2 KAPANDI.**
- [x] **Verify-email banner** artık kapatılabilir (X). **P2 KAPANDI.**
- [x] **Portfolyo UI geri geldi** — `/dashboard/portfolio`: Generate Portfolio (3 kredi) → AI
  başlık+özet+beceri+**Projects** (profil metninden "Checkout Flow Redesign" çıkardı) + slug +
  Public toggle; public `/p/[slug]` yayınlanınca açılıyor. Landing'in "portfolyo" vaadi artık
  gerçek. **P0 tutarsızlık KAPANDI.**

## 🟡 Yeni bulgular (yeni özelliklerde)

- [ ] **Yasal metinlerde doldurulmamış placeholder + kişisel e-posta**
  - Nerede: `/kvkk` veri sorumlusu "[Company Name], [Address], [Tax ID]" **literal placeholder**;
    iletişim **kişisel Gmail** `yanlizcakaan@gmail.com` (KVKK + Contact + veri sorumlusu).
  - Sorun: canlıya/ödemeye geçmeden şirket bilgileri doldurulmalı; public veri-sorumlusu iletişimi
    için kişisel Gmail hem profesyonellik hem gizlilik (kişisel adres ifşası) açısından zayıf.
  - Kabul: [Şirket]/[Adres]/[Vergi No] doldurulur; iletişim domain/destek e-postasına geçer.

- [ ] **Public toggle erişilebilir değil (a11y)**
  - Nerede: `components/dashboard/portfolio-tab.tsx` — toggle `<label>` içinde salt `<div>` pill +
    `<span>Public</span>`; **gerçek `<input>`/`role="switch"`/`tabindex` YOK**.
  - Sorun: klavye ile odaklanılamaz/açılamaz; ekran okuyucu aksiyon olarak duyurmaz. Testte de
    yalnız label'a tıklayınca çevrildi (pill'e/metne tıklama otomasyonda tutmadı; ilk kayıt
    denemesinden sonra public sayfa 404 verdi — re-toggle gerekti). İnsan tıklamasında büyük
    olasılıkla çalışır ama tıklama hedefi hassas.
  - Kabul: gerçek `role="switch"` + klavye desteği; toggle+kaydet güvenilir persist eder.

- [ ] **Public portfolyo sayfası tasarımca çok sade (müşteriye satmıyor)**
  - Nerede: public `/p/[slug]` — tek sütun düz metin (ABOUT/SKILLS/PROJECTS). Avatar yok, aksan
    renk yok, **iletişim/işe-al CTA'sı yok**, **"Built with Multifolio" markası/geri-linki yok**.
  - Sorun: (a) portfolyonun işi izleyiciyi müşteriye çevirmek — CTA/iletişim yok. (b) her paylaşılan
    portfolyo Multifolio'ya signup getirebilecek büyüme döngüsü (footer backlink) kaçıyor. (c) ürünün
    geri kalanının cilası yanında bu sayfa "portfolyo sitesi" vaadinin altında kalıyor.
  - Kabul: avatar + aksan/tema + iletişim/CTA + ince Multifolio footer backlink; opsiyonel OG görsel.

## Not
- Testte dev ortam yine hot-reload/oturum-churn ile oynadı (tarayıcı birkaç kez düştü); yukarıdakiler
  yine de temiz doğrulandı. Kullanıcı P0'ları hızla kapatmış (commit'ler: mobil `b0f6149`, feed
  `916401c`, dil/etiket `01fa26b`, yasal/portfolyo `c12d3b1`).
