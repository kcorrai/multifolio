# Multifolio Tarayıcı Uzantısı (MV3)

Upwork ve Fiverr profil sayfaları sunucudan çekilemiyor (Cloudflare/captcha bot duvarı);
LinkedIn'in public verisi ise skills içermiyor. Uzantı kullanıcının KENDİ login'li
tarayıcısında çalışır (v2: Upwork + Fiverr + LinkedIn): profil sayfasının görünür
metnini + best-effort medya URL'lerini (avatar `og:image`, portfolyo görselleri) toplar
ve mevcut oturum cookie'leriyle `/api/profile/import`'a (`mode:"extension"`) POST'lar.
Backend mevcut ÜCRETSİZ AI çıkarım yolunu kullanır (kredi düşmez, saatte 10 limit),
taslağı `profile_import_drafts`'a yazar; uzantı `/dashboard/import?source=extension`
sekmesini açar ve kullanıcı taslağı wizard'da inceleyip kaydeder (otomatik kayıt YOK).

## Mimari

```
[Upwork/Fiverr profil sayfası]
  content.ts  — URL deseni + h1 çift kapısı → shadow-root buton → metin+medya topla
      │ chrome.runtime.sendMessage
  background.ts — cookie'li POST /api/profile/import (host_permissions → cookie eklenir)
      │ 200 → chrome.tabs.create(/dashboard/import?source=extension)
[Multifolio] route AI taslağı üretir → profile_import_drafts upsert → wizard prefill
```

- `src/extract.ts` — SAF yardımcılar (vitest'li): `detectProfilePage` (Upwork
  `/freelancers/~id|slug`, `/fl/slug`; Fiverr kök/`users/` kullanıcı yolu − rezerve
  yol denylist'i; LinkedIn `*.linkedin.com/in/{username}`), `clampText(50k)`,
  `pickImageUrls` (https-only, ≤1000 kar, ≤12).
- Alan-alan CSS seçici parse bilinçli olarak YOK — DOM değişse de kırılmaz; metni AI çıkarır.
  LinkedIn'de bunun bonusu: login'li sayfa metni skills bölümünü içerir → AI skills'i de
  çıkarır (public ld+json yolu veremiyordu).
- **MAIN-world çıkarıcılar (yapılandırılmış veri, gürültüsüz):** izole content.ts sayfanın
  JS global'lerine erişemez → ayrı MAIN-world script'ler (`world:"MAIN"`) global state'i
  okur, saf mapper'la yapılandırıp CustomEvent köprüsüyle content.ts'e verir:
  - `src/nuxt.ts` (Upwork) — `window.__NUXT__`/Vue store + fetch/XHR hook'u ile TÜM portfolyo
    projelerini (sayfalar arası biriktirerek) çıkarır. `mf-get-projects` → `mf-projects`.
  - `src/fiverr.ts` (Fiverr) — `window.__PERSEUS__initialProps` (JSON) → saf `fiverr-map.ts`
    `mapFiverrProps`: profil (headline=`oneLinerTitle`, summary=`description`, skills,
    rating/level/dil/eğitim/sertifika/iş-deneyimi → TEMİZ metin bloğu) + gig'ler
    (`gigsData[]` → başlık+görsel proje) + avatar (`profileImageUrl`). `mf-get-fiverr` →
    `mf-fiverr`. Fiverr sayfalama gerektirmez (tek okuma). Portfolyo görselleri lazy →
    content.ts DOM'u kaydırıp `/attachments/project_item/` desenli görselleri ekler.
    `fiverr-map.ts` PURE + vitest'li (`fiverrImageKey`/`dedupeFiverrImages` cloudinary
    thumbnail biçimlerini tek kimliğe toplar → çift görsel önlenir).
- API tabanı build-time gömülür (`--define:__API_BASE__`): `build` → prod, `build:dev` → localhost.
- **UI dili:** `_locales/{en,tr}/messages.json` + `chrome.i18n` (`src/messages.ts` sarmalayıcı,
  EN fallback); tarayıcı diline göre otomatik.
- **Store hazırlığı:** prod build manifest'ten localhost host iznini ÇIKARIR (build.mjs);
  `npm run package` → prod build + `multifolio-extension.zip` (store'a yüklenecek dosya;
  PowerShell `Compress-Archive` — Windows). Gizlilik politikası sayfası (store zorunlu):
  `https://multifolio-ecru.vercel.app/extension/privacy` (`app/extension/privacy/page.tsx`, EN+TR).

## Komutlar

```
cd extension
npm install
npm run build      # prod  (API: https://multifolio-ecru.vercel.app)
npm run build:dev  # dev   (API: http://localhost:3000)
npm run check      # tsc --noEmit + vitest
```

`dist/` yüklenebilir uzantının tamamıdır (bundle + manifest + ikonlar).

## Kurulum (unpacked — v1 dağıtımı; Chrome Web Store kapsam dışı)

1. `npm run build:dev` (lokal test) veya `npm run build` (prod).
2. Chrome → `chrome://extensions` → sağ üstten **Developer mode** aç.
3. **Load unpacked** → `extension/dist` klasörünü seç.
4. Aynı Chrome profilinde Multifolio'ya giriş yapmış ol (localhost veya prod — build'e göre).

## Manuel E2E checklist

Playwright MV3 uzantısını kullanıcı akışıyla süremez (SW'ye `evaluate` dışında);
sürüm öncesi bu liste elle geçilir:

1. Ortam: migration 0018 prod/lokalde uygulı, `npm run dev` açık, `build:dev` + load unpacked.
2. Multifolio'ya login'liyken kendi Upwork profilinde (`upwork.com/freelancers/~...`)
   sağ altta "Import to Multifolio" butonu görünür → tıkla → "Importing…" →
   yeni sekmede wizard taslakla açılır (başlık/özet/beceriler + varsa avatar) +
   "eklentiyle içe aktarıldı" banner'ı → düzenle → kaydet → dashboard profili güncel.
3. Aynısını Fiverr (`fiverr.com/<kullanıcı>`) ve LinkedIn (`linkedin.com/in/<kullanıcı>`)
   profilinde tekrarla; Fiverr'da taslakta headline/summary/skills + gig'lerin PROJE olarak
   (başlık+görsel) geldiğini, avatar'ın doğru profil fotosu olduğunu doğrula; LinkedIn'de
   taslakta skills'in dolu geldiğini doğrula.
4. Negatifler: buton `fiverr.com/search/...`, `upwork.com/nx/...`, ilan sayfalarında ÇIKMAZ.
5. Hata yolları: Multifolio'dan çıkış yap → butona bas → "log in" notu + login sekmesi;
   1 saatte 10 import → 11.'de rate-limit mesajı; Supabase'de `usage_events`
   (kind=profile_import) + `platform_connections` + `profile_import_drafts` satırları.
6. Prod: `npm run build` ile yeniden yükle, 2 + 5 (auth) adımlarını prod'a karşı tekrarla.

## Tasarım notları / bilinen sınırlar

- **Cookie mekaniği (spike ile doğrulandı, 2026-07-03):** Supabase `sb-*` cookie'leri
  SameSite=Lax olsa da Chrome, `host_permissions` kapsamındaki host'lara uzantı
  kaynaklı isteklerde cookie'leri ekler (GET ve cross-site POST ikisi de test edildi,
  localhost + prod). İleride bir Chrome sürümü bunu kırarsa fallback tasarımı:
  `externally_connectable` rölesi — payload `chrome.storage.session`'da bekler,
  import sayfasındaki client bileşeni `chrome.runtime.sendMessage(EXTENSION_ID)` ile
  alıp first-party fetch'le POST'lar (sunucu tarafı değişmez).
- Fiverr match pattern'i geniş (`fiverr.com/*`): kod içinde regex + rezerve-yol
  denylist'i + h1 işareti üçlü kapısı var; kaçak zararsız (anlamsız metin 400 alır).
- Upwork agency profilleri (`/ag/...`) ve yerelleştirilmiş alt alan adları v1 kapsam dışı.
- Taslak satırı kayıttan sonra silinmez: sonraki eklenti içe aktarması upsert'le ezer,
  wizard 60 dakikadan eski satırı yok sayar.
