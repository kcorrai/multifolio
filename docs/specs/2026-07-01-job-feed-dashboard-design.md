# Tasarım Spec — İş Feed Dashboard (Alt-proje A)

**Tarih:** 2026-07-01
**Durum:** Taslak — kullanıcı incelemesi bekliyor
**Kapsam:** Alt-proje A (uygulama içi keşif dashboard'u). Scraper worker = Alt-proje B (ayrı).

## 1. Bağlam & amaç

uphunt.io'nun keşif deneyimini (Feed · Search Jobs · Starred · Applied) Multifolio'nun
tasarım diline uyarlamak. uphunt canlı Upwork ilanlarını sürekli bir stealth-tarayıcı
worker'ıyla toplayıp AI ile 1-10 skorluyor; feed/starred/applied görünümleri sunuyor.
Bizde auto-apply **kapsam dışı** (resmi yollardan imkânsız, Connects Upwork UI'sine kilitli).

Bu spec yalnızca **uygulama tarafını** tanımlar: çekilen ilanların yaşadığı `job_pool`
tablosunu okuyan görünümler, kayıtlı aramalar, yıldızlama, on-demand AI skorlama ve
mevcut başvuru pipeline'ına köprü. **Canlı ilan çekme Alt-proje B'de**; bu spec bittiğinde
dashboard **seed/örnek verilerle tam çalışır**, scraper hazır olunca `job_pool`'a yazar.

**Mimari sınır:** Scraper (yazar) ↔ Dashboard (okur) arasındaki tek arayüz `job_pool`
tablosudur. İki taraf bağımsız geliştirilebilir.

## 2. Kapsam

**Dahil (Alt-proje A):**
- `job_pool`, `job_feeds`, `starred_jobs`, `job_scores` tabloları + `job_listings.source_pool_id`
- Dört görünüm: **Feed · Search · Starred · Applied** (`/dashboard/jobs` altında segmented)
- Kayıtlı feed CRUD (keyword/bütçe/platform filtreleri)
- On-demand AI skorlama (mevcut `match.ts` + kredi düşme; feed ilanına uyarlanmış)
- "Apply" köprüsü: pool ilanından `job_listings` kaydı (status `applied`) + Upwork deep-link
- `job_pool` seed verisi (gerçekçi örnek ilanlar; `source = 'sample'`)
- i18n (yeni namespace `feed`, EN+TR)
- Birim testler (skorlama köprüsü, arama filtresi, seed doğrulama)

**Hariç (bu spec değil):**
- Canlı ilan çekme / scraper / worker altyapısı → Alt-proje B
- Auto-apply / Connects / teklif gönderme (API'den imkânsız)
- Bildirimler (Slack/Telegram) → sonraki faz
- Otomatik toplu skorlama (kredi ekonomisini korumak için; § 6)

## 3. Bilgi mimarisi (IA)

Mevcut `/dashboard/jobs` = elle eklenen başvuru takipçisi. Bunu **dört segmentli keşif +
takip alanına** genişletiriz (üstte segmented control):

| Segment | İçerik | Veri kaynağı |
|---|---|---|
| **Feed** | Kullanıcının kayıtlı feed'lerine uyan pool ilanları, en yeni önce | `job_pool` ∩ `job_feeds` |
| **Search** | Pool üzerinde anlık arama (keyword/bütçe/platform), kaydedilmez | `job_pool` sorgu |
| **Starred** | Kullanıcının yıldızladığı pool ilanları | `starred_jobs` |
| **Applied** | Başvurulan/takip edilen işler (mevcut pipeline) | `job_listings` |

- **Applied**, mevcut `jobs-tab` takipçisini kapsar; "İş ekle" ve `JobDetailPanel` + teklif
  akışı aynen korunur. Elle eklenen işler + feed'den başvurulan işler burada birleşir.
- Nav öğesi (`/dashboard/jobs`) aynı kalır; etiket i18n'de "İşler → Feed/Keşif" olarak
  güncellenir. Sidebar `jobs` rozeti = Applied sayısı (değişmez) ya da opsiyonel toplam.
- Segment durumu URL query ile (`?view=feed|search|starred|applied`) — derin link + geri tuşu.
  Varsayılan görünüm: profil varsa **Feed**, yoksa **Applied** (onboarding bozulmasın).

**Karar noktası (review'da onayla):** Segmented sub-view mi, yoksa yeni bir üst-nav "Keşif"
bölümü mü? Öneri: segmented (Applied mevcut takipçi olduğu için tek alanda tutarlı).

## 4. Veri modeli

Yeni migration: `supabase/migrations/0012_job_feed.sql`. Tüm tablolarda RLS açık.

### 4.1 `job_pool` — paylaşılan ilan havuzu (kullanıcıya özel DEĞİL)
```
id           uuid pk default gen_random_uuid()
source       text not null            -- 'upwork' | 'sample' | ...
external_id  text not null            -- kaynaktaki ilan id'si (dedup anahtarı)
title        text not null
description  text not null
url          text
budget       text                     -- serbest metin ("$500-1000", "Hourly $30-50")
skills       text[] not null default '{}'
client_country text
posted_at    timestamptz
raw          jsonb                     -- ham kaynak yükü (ileride)
created_at   timestamptz not null default now()
unique (source, external_id)          -- dedup
```
İndeksler: `posted_at desc`, `skills` (GIN), title/description için `to_tsvector` (arama).

**RLS:** `job_pool` global/paylaşılan. Politika: `select` → tüm authenticated kullanıcılar
(`auth.role() = 'authenticated'`). `insert/update/delete` → yalnız service-role (scraper).
Böylece kullanıcı verisi sızmaz; havuz herkese okunur, sadece worker yazar.

### 4.2 `job_feeds` — kullanıcının kayıtlı aramaları
```
id         uuid pk
user_id    uuid not null references auth.users
name       text not null
keywords   text[] not null default '{}'
min_budget int                        -- opsiyonel alt sınır (USD, kaba)
platform   text                       -- opsiyonel ('upwork' vb.)
created_at timestamptz not null default now()
```
**RLS:** sahip (`user_id = auth.uid()`) tüm işlemler. Kullanıcı başına makul üst sınır
(örn. 10 feed) API'de Zod/kontrol ile.

### 4.3 `starred_jobs` — yıldızlar
```
id           uuid pk
user_id      uuid not null references auth.users
job_pool_id  uuid not null references job_pool on delete cascade
created_at   timestamptz not null default now()
unique (user_id, job_pool_id)
```
**RLS:** sahip tüm işlemler.

### 4.4 `job_scores` — on-demand AI skor önbelleği (kullanıcı × ilan)
```
id           uuid pk
user_id      uuid not null references auth.users
job_pool_id  uuid not null references job_pool on delete cascade
score        int not null             -- 0-100 (mevcut match ölçeği)
result       jsonb not null           -- JobMatchResult (strengths/gaps/requirements/summary)
created_at   timestamptz not null default now()
unique (user_id, job_pool_id)
```
**RLS:** sahip select; insert/update service-role (skor route'u admin ile yazar, match
route'undaki desenle). Skor **kalıcı önbellek**: aynı ilan tekrar skorlanınca kredi harcanmaz
(önce cache'e bak).

### 4.5 `job_listings` değişikliği — köprü provenance
```
alter table job_listings add column source_pool_id uuid references job_pool on delete set null
```
Feed'den başvurulan iş, hangi pool ilanından geldiğini işaret eder (opsiyonel; elle eklenen
işlerde null). Applied görünümünde "Upwork'te aç" linki için `job_pool.url` buradan izlenir.

## 5. Görünüm davranışları

### Feed
- Sunucu component (`/dashboard/jobs/page.tsx` veya feed-tab): kullanıcının `job_feeds`
  kayıtlarını çeker; her feed için `job_pool`'u filtreler (keyword ⊂ title/skills, bütçe,
  platform), `posted_at desc` sıralar, sayfalar (ör. 25/istek, "daha fazla").
- Feed yoksa: boş durum + "İlk feed'ini oluştur" CTA (keyword/bütçe modalı).
- Her satır: başlık, platform rozeti (PLATFORM_STYLES), bütçe, posted_at (relative), skill
  chip'leri, **yıldız butonu**, **skor rozeti** (varsa `job_scores`'tan; yoksa "Analiz et"
  butonu → 1 kredi). Satıra tıklama → detay paneli (JobDetailPanel deseninde: açıklama,
  skor breakdown, "Upwork'te aç", "Başvurdum olarak işaretle").
- Skor renkleri mevcut `scoreColor`/`scoreBarColor` ile.

### Search
- Kaydedilmeyen anlık arama: keyword input + bütçe/platform filtreleri. `GET /api/feed/search`
  full-text (`to_tsvector`) + filtre. Sonuç satırları Feed ile aynı bileşen.
- "Bu aramayı feed olarak kaydet" → `job_feeds` insert.

### Starred
- `starred_jobs ⋈ job_pool`, en son yıldızlanan önce. Satır bileşeni Feed ile ortak.
- Yıldızı kaldır → satır listeden düşer (optimistik).

### Applied
- Mevcut `jobs-tab.tsx` davranışı (liste + JobDetailPanel + durum pipeline + teklif +
  "İş ekle"). Ek: `source_pool_id` dolu işlerde "Upwork'te aç" kısayolu.
- Stat bar (applied/awaiting/active) korunur.

## 6. AI skorlama (on-demand, kredi-korumalı)

uphunt her ilanı otomatik skorluyor; bizde bu **kredi ekonomisini istem dışı yakar**. Karar:
**skorlama on-demand.** Kullanıcı bir feed ilanında "Analiz et" derse (ya da detay panelini
açıp skorlarsa) 1 kredi (`job_match`) harcanır, sonuç `job_scores`'a cache'lenir.

- Yeni route `POST /api/feed/[poolId]/score`: mevcut `app/api/jobs/[id]/match/route.ts`
  desenini birebir izler — `spendCredits(user.id, "job_match", …)`, `matchJobToProfile(profile,
  job_pool.description, locale)`, sonucu **`job_scores`'a upsert** (job_listings yerine),
  `usage_events`'e maliyet kaydı, kredi bakiyesi döner. Önce `job_scores` cache kontrolü:
  varsa kredi harcamadan döndür.
- `matchJobToProfile` ve `JobMatchResult` şeması **değişmeden** yeniden kullanılır.
- E-posta bildirimi (skor ≥ 70) opsiyonel; on-demand skorda gereksiz olabilir → başlangıçta
  kapalı (elle skorluyor zaten görüyor).

## 7. API route'ları

Hepsi `withErrorHandler` + Zod (`parseQuery`/`parseJson`) + auth + RLS; `app/api/profile`
şablonunu izler.

| Route | Metod | İş |
|---|---|---|
| `/api/feed` | GET | Kullanıcının feed'lerine uyan pool ilanları (+ star state + cache skor), sayfalı |
| `/api/feed/search` | GET | Pool full-text + filtre araması |
| `/api/feed/[poolId]/score` | POST | On-demand AI skor (kredi + cache) |
| `/api/starred` | GET / POST / DELETE | Yıldız listesi / ekle / çıkar |
| `/api/feeds` | GET / POST | Kayıtlı feed listesi / oluştur |
| `/api/feeds/[id]` | PATCH / DELETE | Feed güncelle / sil |

"Apply" köprüsü: mevcut `POST /api/jobs` yeniden kullanılır (pool ilan alanları + yeni
`source_pool_id` gövdede). Ayrı route gerekmez; `jobCreateSchema` opsiyonel `source_pool_id`
ile genişletilir. Deep-link (`job_pool.url`) client'ta yeni sekmede açılır.

## 8. Bileşenler & route yapısı

Route-split desenine uyar (`components/dashboard/`):
- `jobs-tab.tsx` → segmented kabuk haline gelir (Feed/Search/Starred/Applied sekmeleri).
  Applied içeriği mevcut takipçi olarak ayrılır (örn. `applied-view.tsx`).
- Yeni: `feed-view.tsx`, `search-view.tsx`, `starred-view.tsx`, ortak `pool-job-row.tsx`
  (satır) ve `pool-job-panel.tsx` (detay; JobDetailPanel desenini paylaşır ya da genişletir).
- `feed-modal.tsx` — feed oluştur/düzenle (keyword/bütçe/platform).
- Ortak görsel token'lar (StatCard, scoreColor, PLATFORM_STYLES, TINT_*) `shared.tsx`'ten.
- Sunucu sayfası `/dashboard/jobs/page.tsx` yalnız ilk veri dilimini çeker (mevcut desen);
  segment içi geçişler client + query param + fetch.

## 9. i18n

Yeni üst-düzey namespace `feed` (EN + TR, anahtar setleri eşit — `catalog.test.ts`):
segment etiketleri, boş durumlar, feed modalı, skor/yıldız/başvur CTA'ları, arama filtreleri,
hata mesajları. Sunucu hataları `errors` namespace'ine eklenir. Sabit string yok;
`useTranslations`/`getTranslations`. AI çıktı dili mevcut `languageDirective` ile UI locale'ine
uyar (skorlama zaten `locale` geçiriyor).

## 10. Seed verisi

`job_pool`'a gerçekçi örnek ilanlar (10-20 kayıt, `source = 'sample'`, çeşitli platform/skill/
bütçe). Migration `0012` içinde `insert` ya da ayrı `supabase/seed/job_pool_sample.sql`.
Bu, Alt-proje B gelene kadar Feed/Search/Starred/Applied'ı tam işlevsel kılar (Mock adaptör
= seed satırları). `source = 'sample'` satırları sonra kolayca ayıklanabilir/silinebilir.

## 11. Güvenlik (üç sütun uyumu)

1. **Hata görünürlüğü:** her route `withErrorHandler`; beklenmeyen hata Sentry'ye.
2. **Güvenli-by-default:** tüm girdi Zod; `job_pool` insert/update yalnız service-role;
   `job_feeds`/`starred_jobs`/`job_scores` RLS sahip-kısıtlı; skor route'u admin yazımını
   match deseniyle sınırlar; deep-link URL'leri `job_pool`'dan (kullanıcı girdisi değil).
   XSS: pool açıklaması render'da metin olarak (HTML değil) gösterilir; gerekiyorsa sanitize.
3. **Dokümantasyon:** iş bitince CLAUDE.md "Neyin nerede" + ROADMAP güncellenir.

## 12. Test stratejisi

- `job_scores` cache: aynı ilan ikinci skorda kredi harcamaz (birim test, spend mock).
- Arama filtresi: keyword/bütçe/platform saf yardımcı fonksiyonu (test edilebilir ayrıştır).
- Katalog testi: `feed` namespace EN/TR eşitliği.
- RLS: `job_pool` başka kullanıcı verisi sızdırmaz (paylaşımlı okuma bilinçli).
- `npm run check` temiz (lint + typecheck + vitest).

## 13. Alt-proje B'ye devir noktası

Alt-proje B (scraper worker) yalnız `job_pool`'a `source='upwork'` satırları upsert eder
(`unique(source, external_id)` dedup). Dashboard değişmeden canlıya geçer. Seed satırları
(`source='sample'`) prod'da temizlenir/gizlenir.

## 14. Kararlar (onaylandı — 2026-07-01)

1. **IA:** segmented sub-view (`/dashboard/jobs?view=…`), yeni üst-nav yok.
2. **Skorlama:** on-demand + `job_scores` cache (otomatik toplu skorlama yok).
3. **Seed:** ayrı dosya `supabase/seed/job_pool_sample.sql` (şema migration'ından ayrık;
   prod'da atlanabilir/temizlenebilir).
4. **Applied:** mevcut takipçiyle birleşir (tek alan).
5. **Limitler:** feed başına 10, feed sayfa boyutu 25.
