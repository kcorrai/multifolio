# Multifolio — Ürün ve Sistem Dokümanı

> Tek dosyada "Multifolio nedir, ne yapar, nasıl çalışır". Kod haritası için `CLAUDE.md`,
> tasarım dili için `docs/DESIGN.md`, yayın adımları için `docs/GO-LIVE-CHECKLIST.md`.
> Son güncelleme: 2026-08-19 · Durum: prod'da canlı (https://multifolio-ecru.vercel.app)

---

## 1. Tek cümlede

**Multifolio, freelancer'ın kariyer verisini bir kez toplayan; sonra her platform için
optimize profil metni, teklif, CV, portfolyo sitesi ve mülakat hazırlığı üreten;
ilanları bulup başvuruları takip eden çoklu-platform kariyer aracıdır.**

### Çözdüğü problem

Bir freelancer aynı bilgiyi (kim olduğu, ne yaptığı, hangi sonucu getirdiği) LinkedIn'de,
Upwork'te, Fiverr'da, CV'sinde, portfolyosunda ve her teklifte **yeniden ve farklı formatta**
yazmak zorunda. Her platformun kendi algoritması, karakter limiti, ton beklentisi ve
anahtar-kelime mantığı var. Sonuç: ya hepsi kopyala-yapıştır (hiçbirinde iyi değil),
ya da haftada saatler giden manuel emek.

### Yaklaşım

1. **Tek kaynak profil** — kullanıcı verisini bir kez girer (ya da mevcut profilinden içe aktarır).
2. **Platform-farkındalıklı üretim** — her platformun kendi yönergesiyle (`lib/ai/platforms.ts`)
   ayrı metin üretilir; jenerik "AI çıktısı" değil.
3. **Kanıta bağlı** — üretilen her şey kullanıcının gerçek projelerine/sonuçlarına referans verir.
4. **Deterministik çekirdek + AI kabuk** — skorlar, filtreler, kontroller saf ve test edilebilir
   fonksiyonlarda; AI yalnız yazım/analiz katmanında (bkz. §8).

### Kasıtlı olarak YAPILMAYANLAR

- **Auto-apply / auto-submit yok.** Teklif taslağı üretilir, kutuya yazılır — göndermek her zaman
  kullanıcının tıklaması. Gerekçe: platformların kanıtlı ban riski.
- **Ham AI çıktısı final diye sunulmaz** — her üretim düzenlenebilir ve kapsama/kalite paneliyle gelir.
- **Tek-platform konumlanması yok** — ürünün adı da vaadi de "multi".
- **Üçüncü-parti izleme yok** — analitik kendi veritabanında (§12).

---

## 2. Hedef kullanıcı ve pazar

- **Kim:** çoklu platformda iş arayan freelancer / kontraktör (yazılım + tasarım ağırlıklı).
- **Pazar:** **GLOBAL-ONLY, İngilizce-only.** 2026-07-12 deep geçişinde TR pazarı, Bionluk/Armut
  platformları, KVKK sayfası ve TR'ye özel araçlar (`/earnings`, `/compare`, `/vergi`) kaldırıldı.
  `lib/markets/` katmanı korundu ama tek pazar döner (`global`); çağıranlar kırılmasın diye API duruyor.
- **Dil:** kullanıcıya görünen tüm metin `messages/en.json` tek kataloğunda (49 namespace).
  Kod yorumları Türkçe. AI çıktısı İngilizce; teklif metni platform diline göre (`PLATFORM_LANGUAGE`).

---

## 3. Desteklenen platformlar (8)

`lib/ai/platforms.ts` → `PLATFORMS`. Yeni platform eklemek = buraya bir giriş eklemek.

| Platform | Profil içe aktarma | Not |
|---|---|---|
| LinkedIn | `server` | public `/in/{user}` sayfasındaki JSON-LD `@graph` |
| Upwork | `extension` | bot duvarı — uzantı login'li sekmeden gönderir |
| Fiverr | `extension` | bot duvarı |
| 99designs | `extension` | bot duvarı |
| Freelancer | `server` | ld+json yok → sayfa metni → AI (`sliceContentRegion` ile nav temizliği) |
| Contra | `server` | ld+json `Person` (2026-07-20 canlı doğrulandı) |
| PeoplePerHour | `server` | sayfa metni → AI |
| Guru | `server` | `ProfilePage` → `mainEntity(Person)`; başlık og:description'dan ayrıştırılır |

**"server" vs "extension" ayrımı** ürünün en pratik kararlarından biri: Upwork/Fiverr/99designs
sunucudan okunamaz (bot duvarı), ama kullanıcının kendi tarayıcısında zaten login. Bu yüzden Chrome
uzantısı (§4.10) o üç platformda köprü görevi görür — proxy/antidetect parası harcanmaz.

---

## 4. Modüller

### 4.1 Profil — tek kaynak

- `app/dashboard/profile` — çekirdek profil (headline, summary, skills, projeler, portfolyo, avatar).
- **Kimlik hero'su:** avatar + headline + bağlı platform rozetleri + tamamlanma halkası.
- **Profil güç paneli** (`lib/profile/optimization.ts`) — deterministik checklist; "neyin eksik"
  AI'sız söylenir.
- **AI öneri paneli** (`/api/profile/suggest`) — bağlı platform profillerinden çok-platform sentezi;
  öneri kaydedilmez, alan bazlı "Uygula" ile alınır.
- **Platform bazlı merge** (`lib/profile/merge.ts`) — Upwork'ten import, Fiverr'dan geleni silmez.

### 4.2 İçe aktarma — "boş form" yerine "profilini getir"

`/dashboard/import` wizard'ı; kanallar tek motora akar:

1. **Profil URL'i** — bilinen platformsa yapılandırılmış çekim (`lib/import/*`), değilse HTML süzme.
2. **Metin yapıştırma** → `extractProfile` (AI).
3. **CV/PDF/DOCX** (`unpdf` + `mammoth`, bellekte — **dosya saklanmaz**).
4. **GitHub repo** (`lib/import/github.ts`, resmî API) → projeler.
5. **Uzantı** (`?source=extension`) — bekleyen taslağı (`profile_import_drafts`, ≤60 dk) prefill eder.

Ücretsizdir (kredi düşmez), saatte 10 limit, SSRF koruması var; gerçek AI maliyeti yine de
`usage_events`'e yazılır.

### 4.3 Platform uyarlama (çekirdek vaat)

`/dashboard/platforms` — HUB (platform kartları) + `[id]` detay sayfası. Detay dört bölümü tek yerde
toplar: uyarlanmış profil metni · bağlantı URL'i · platform-filtreli eşleşen işler · teklif geçmişi
ve ipuçları.

- `POST /api/adapt` — profil → platform metni. **Kaynak seçici:** `core` (çekirdek profil) /
  `platform` (çekilmiş public veri) / `both` (varsayılan).
- Çıktı `adaptations` tablosuna kalıcı upsert edilir → sayfa yenilemede kaybolmaz.
- **Hesap sağlığı taraması** (`lib/health/scan.ts`) — üretilen metinde platform kuralı ihlali
  (e-posta/telefon/mesajlaşma/ödeme = circumvention → ban riski) deterministik regex ile aranır,
  amber panelle **uyarır, engellemez**. LinkedIn muaf (kişisel networking profili).

### 4.4 İş keşfi — feed ve arama

- **Toplama** (`lib/scrape/`): Remotive + RemoteOK + WeWorkRemotely + (env varsa) Freelancer resmî API.
  Dış cron `POST /api/internal/scrape`'i `x-cron-secret` ile tetikler → `job_pool` upsert +
  `scrape_runs` koşu logu. Bir kaynak patlarsa diğerleri devam eder.
  *Arbeitnow düşürüldü* — filtresiz Alman on-site ilanları feed alakasını bozuyordu.
- **Kalite süzgeci** (`quality.ts`) + **near-duplicate tekilleştirme** + **istihdam türü**
  normalizasyonu (`job-type.ts`).
- **Alaka motoru** (`lib/feed/relevance.ts`) — **AI'sız, kredisiz**: skill kesişimi + başlık bonusu
  → 0-100; feed'i sıralar, düşük alakalıyı gizler. Kullanıcı kredi harcamadan önce sıralama görür.
- **Dolandırıcılık ön-filtresi** (`lib/feed/scam.ts`) — off-platform yönlendirme, önden ödeme,
  kripto ödeme, finansal bilgi talebi. Yüksek kesinlik hedeflenir: küratörlü feed'de yanlış-pozitif
  güveni aşındırır → her desen "dolandırıcılık bağlamı" sözcüğü şart koşar.
- **On-demand AI skorlama** (`/api/feed/[poolId]/score`) — kredili, `job_scores` cache'li,
  4 boyutlu rubrik + go/maybe/skip kararı.
- **Çeviri hibrit** — başlıklar scrape-time (batch), açıklama ilk görüntülemede (paylaşımlı cache).
- **Kayıtlı feed'ler** — filtreler (keyword, hariç-keyword, ülke hariç, min saatlik/sabit ücret,
  min skor, platform, istihdam türü) + e-posta bildirimi opt-in + feed'e özel teklif yönergesi +
  **opt-in günlük otomatik teklif taslağı** (≤10/gün, auto-submit YOK).

### 4.5 Başvuru takibi — mini-CRM

`/dashboard/jobs` segmented: **Feed / Search / Starred / Applied**.

- Pipeline: `saved → applied → awaiting_reply → interview → offer → rejected`; kanban + liste.
- **İki kadanslı follow-up** (`lib/followup.ts`) — 1. takip 5-7 iş günü, 2. takip +7-10 gün,
  3. takip önerilmez. Banner + AI takip mesajı.
- **Hatırlatıcı + teslim tarihi** (`lib/jobs/reminder.ts`, timezone kaymayan gün farkı).
- **Etiketler** ve **"referans ile geldi"** bayrağı (referanslı başvurular ~2x dönüşür).
- **Pipeline benchmark** — sektör aralığı bantlarıyla ("gayriresmî aralık" etiketli).
- **Nakit akışı tahmini** (`lib/jobs/cashflow.ts`) — aşama ağırlıklı (applied .1 / awaiting .15 /
  interview .4 / offer .8; saatlik bütçeler hariç).
- **Retention içgörüleri** (`lib/jobs/insights.ts`) — yanıt oranı + en aktif platform, Overview'da.

### 4.6 Teklif üretimi

- `POST /api/proposal` — platform-spesifik AI teklif + **ilan gereksinimlerine karşı kapsama tablosu**
  (`lib/ai/coverage.ts`): hangi gereksinim karşılandı, hangisi eksik.
- **Ses hafızası** (`lib/proposal/voice.ts`) — kullanıcının geçmiş tekliflerinden üslup örnekleri
  prompt'a enjekte edilir. İçerik kopyalanmaz, yalnız ton eşlenir → jenerik AI'dan farklılaşma.
- **Kalite/özgüllük paneli** (`lib/proposal/quality.ts`, `style.ts`) — jenerik açılış, ilandan somut
  terim eksikliği, klişe ifadeler.
- **Çeviri** — teklif dili ≠ UI dili ise ücretsiz çeviri toggle'ı.
- **AI cover letter** ayrı modül (`lib/ai/coverletter.ts`).

### 4.7 CV / ATS modülü

`/dashboard/cv` + `lib/cv/` + `app/api/cv/*`.

- **8 şablon × 6 renk** — 5'i tek-sütun ATS-güvenli, 3'ü görsel (sidebar/banner/monogram).
- **ATS skoru** (`ats.ts`, saf) + **anahtar-kelime kapsama paneli** (`keywords.ts`, birebir unvan kontrolü).
- **Skor geçmişi** (migration 0036) — zaman içindeki değişim.
- **PDF export** (`@react-pdf`, OpenSans gömülü — TR karakter + ligatürsüz ATS metni).
- İlana göre uyarlama (`tailor`), madde yazımı (`bullets`), özet (`summary`) — kredili.
- **Kural:** ATS "efsaneleri" (ör. "%75 otomatik red") UI'da yasak; `ats-truth-guide` rehberi çürütür.

### 4.8 Mülakat ve pazarlık

- **Mülakat hazırlığı** (`/api/interview/prep`) — STAR hikâye bankası (gerçek projelerden),
  "tell me about yourself" (Present→Past→Future), zayıflık cevabı (ilanın must-have'lerini dışlar),
  4-5 soru önerisi, 24 saat teşekkür-notu hatırlatması.
- **AI sahte mülakat oturumu** — kurulum (zorluk × soru sayısı × kategori) → soru → cevap (yazılı
  veya **sesli dikte**; Web Speech API, sunucu/kredi yok) → AI puan + güçlü/gelişim + profilden model
  cevap + gerekirse derinleştirici takip sorusu → **deterministik rapor** (`lib/interview/report.ts`)
  → geçmiş oturumlar. Oturum DB'de (`interview_sessions`) → sayfa yenilemeye dayanıklı.
- **Maaş pazarlığı koçluğu** (`/api/negotiation`).

### 4.9 Portfolyo sitesi

- `POST /api/portfolio/generate` → düzenle → yayınla → **public `/p/[slug]`**.
- **Tema sistemi saf** (`lib/portfolio/theme.ts`): 3 preset × 6 vurgu. Preset'ler renkte değil
  **ritimde** ayrışır — ölçü genişliği, bölüm aralığı, başlık ölçeği, yarıçap, görsel oranı, galeri
  kolonu, hero hizası, etiket biçimi.
- **Proje kartlarında SONUÇ satırı en üstte** — kanıt açıklamayı yener.
- **Öğe bazlı küratörlük** — galeri/proje görselleri gizlenebilir; seçim her yeniden üretimde taşınır
  (silme değil gizleme; silinen geri gelirdi).
- **Güvenli gömme** (`lib/portfolio/embed.ts`) — rastgele iframe src ASLA; yalnız allowlist host
  (YouTube/Vimeo/Loom/Figma) → sabit embed src.
- **PDF export** (public, ücretsiz), **"İşe al" lead formu** (`portfolio_leads` + lead skoru),
  **müşteri yorumu** akışı (link → pending → owner onayı → public "Wall of Love").
- HTML render öncesi **DOMPurify sanitize** — sert kural.

### 4.10 Chrome uzantısı (MV3, v0.3.0)

Store'da yayında: `chromewebstore.google.com/detail/iccpbihjghfekoodcjpddcnfbnnilpbp`

1. **Profil import** — Upwork/Fiverr/LinkedIn/99designs login'li sekmeden metin+medya toplar →
   `POST /api/profile/import mode:"extension"` → taslak wizard'da incelenir.
2. **İş yakalama** — Upwork `/jobs/*` + LinkedIn `/jobs/view/*` → doğrudan `job_listings`.
3. **Sayfaya yapıştır** — Upwork teklif sayfasında cover-letter kutusunu doldurur. **Auto-submit YOK.**
4. **Canlı eşleşme skoru** — `/api/match/quick` (ücretsiz).

Kendi `package.json`/build'i var (esbuild); kök `npm run check`'ten hariç tutulmuştur.

### 4.11 Ücretsiz araçlar + SEO hunisi

Girişsiz kullanılabilen 6 araç — hem gerçek fayda hem edinim kanalı:

| Araç | Rota | Motor |
|---|---|---|
| Saatlik ücret hesaplayıcı | `/rate` | `lib/rate/calculator.ts` (saf) |
| Kredi/Connects ROI | `/roi` | `lib/roi/calculator.ts` (saf) |
| ATS kontrolü | `/ats-check` | `lib/cv/ats-text.ts` (saf) |
| Teklif kontrolü | `/proposal-checker` | `lib/proposal-check/checker.ts` (saf) |
| Headline skoru | `/headline-optimizer` | `lib/headline/scorer.ts` (saf) |
| Profil analizi | `/analyze` | **tek AI'lı araç** — teaser sunucuda kesilir |

Ek SEO yüzeyleri: **9 rehber** (`/guides/*` — Upwork teklif anatomisi, ücret belirleme, Fiverr gig,
profil optimizasyonu, ilk müşteriler, LinkedIn, dolandırıcılıktan kaçınma, ATS gerçeği, mülakat
hazırlığı) + **pSEO** (`/freelance/[platform]/[role]`) + `/pricing` + sitemap/robots (`lib/seo/site.ts`).

Kayıtsız kullanıcı IP-hash ile saatte 5 çalıştırma (`public_analyses`; **ham IP saklanmaz**).

### 4.12 Bildirim, e-posta, retention

- **Dashboard içi bildirim merkezi** (zil + inbox, `notifications` tablosu) — match ≥70, follow-up,
  feed eşleşmesi.
- **E-posta** (Resend API): match bildirimi · feed digest · **haftalık özet** (cron, opt-out'lu,
  yalnız sinyali olan kullanıcıya).
- **Referral** — davet kodu; ilk profil kaydında iki tarafa +20 kredi (`referrals.referred_id`
  UNIQUE = idempotency).
- **Onboarding** — `/dashboard/start` Getting Started + **zorunlu-rehberli tur** (13 adımlı spotlight,
  yalnız profilsiz kullanıcıda otomatik başlar) + tamamlayana **+15 kredi** bonus.

---

## 5. Kredi ekonomisi

Pay-as-you-go. Kayıtta **100 ücretsiz kredi**, onboarding tamamlamada **+15**, referansta **+20/+20**.

| Aksiyon | Kredi | Aksiyon | Kredi |
|---|---|---|---|
| Platform uyarlama | 2 | Portfolyo üretimi | 5 |
| İş eşleştirme | 2 | CV üretimi | 5 |
| Teklif | 3 | CV ilana uyarlama | 3 |
| Profil önerisi | 3 | CV madde yazımı | 3 |
| Takip mesajı | 2 | CV özeti | 2 |
| Mülakat hazırlığı | 3 | Sahte mülakat soruları | 3 |
| Cover letter | 3 | Sahte mülakat cevabı | 1 |
| Maaş pazarlığı | 3 | | |

**Ücretsiz (kredi düşmez):** profil içe aktarma · platform profil senkronu · çeviriler ·
`/analyze` teaser · alaka skoru · uzantı hızlı skor · tüm saf hesaplayıcılar.

**Paketler** (`lib/payments/packages.ts` — SUNUCU tek doğru kaynağı; istemci fiyatına asla güvenilmez):

| Paket | Kredi | USD | TRY |
|---|---|---|---|
| Starter | 100 | $9 | ₺349 |
| Pro | 500 | $29 | ₺1149 |
| Scale | 1500 | $69 | ₺2749 |

**Yarış güvenliği:** `grant_credits` / `deduct_credits` / `refund_credits` RPC'leri `security definer`
+ `for update` satır kilidi; `execute` yalnız `service_role`'e. Harcama closure içinde kalıcılık:
**AI yazımı patlarsa kredi iade edilir.**

**Ödeme:** Iyzico entegrasyonu tamamen kodlanmış (`lib/payments/*`, `/api/checkout` + callback,
`purchases` tablosu, IYZWSv2 HMAC imzası test'li). Callback token'ı **sunucudan** retrieve ile
doğrular (status + paymentStatus + fraudStatus) → atomik `pending → paid` + kredi.
**Anahtar yok → UI "yakında" gösteriyor.**

---

## 6. Mimari

### Yığın

Next.js 16 (App Router, TS) · React 19 · Tailwind 4 · shadcn/ui + Radix · Supabase (Postgres + Auth +
Storage, RLS açık, `@supabase/ssr`) · OpenAI `gpt-4o-mini` · next-intl · Zod 4 · Sentry · DOMPurify ·
`@react-pdf/renderer` · Vercel.

### Üç sütun (pazarlık yok)

1. **Hata görünürlüğü** — her API route `withErrorHandler`'dan geçer; hata sessizce yutulmaz;
   beklenmeyenler Sentry'ye gider; iç detay istemciye sızmaz.
2. **Güvenli-by-default** — her dış girdi Zod ile doğrulanır; sırlar yalnız sunucuda; her tabloda RLS;
   parametreli sorgular; portfolyo HTML'i sanitize; `service-role` istemciye ASLA import edilmez.
3. **Dokümantasyon** — detay `docs/`'ta; `CLAUDE.md` minimal kalır.

### Katmanlar

```
app/            route'lar (sunucu bileşeni varsayılan) + app/api/*/route.ts
components/     UI — solar/ (tasarım dili), dashboard/, landing/, ui/ (shadcn)
lib/
  ai/           AI motorları (server-only): adapt, match, proposal, portfolio, cv,
                interview, mock-interview, negotiation, coverletter, profile-*, translate
  <domain>/     SAF çekirdekler (vitest'li, AI/kredi yok): jobs, feed, cv, rate, roi,
                headline, proposal-check, health, portfolio, profile, interview, analytics
  supabase/     server (RLS) · admin (service-role) · client · middleware
  errors/       AppError + withErrorHandler
  validation/   Zod şemaları
supabase/migrations/   43 SQL dosyası, hepsinde RLS
e2e/            Playwright duman testleri
extension/      Chrome MV3 (ayrı build)
```

**Tekrarlanan desen:** her özellik = *saf çekirdek (vitest'li)* + *AI kabuğu (server-only)* +
*route (Zod + auth + kredi + `withErrorHandler`)* + *client bileşen*. `app/api/profile` bu şablonun
referansıdır.

---

## 7. Veri modeli

43 migration; tamamı RLS'li. Ana gruplar:

| Grup | Tablolar |
|---|---|
| Kimlik/profil | `profiles` (+avatar, portfolio, projects), `platform_connections`, `platform_profiles`, `profile_import_drafts` |
| Üretim | `adaptations`, `proposals` (+coverage), `portfolios`, `cvs` (+skor geçmişi) |
| İş akışı | `job_listings` (status, tags, reminder/deadline, referred, status_changed_at), `job_pool` (paylaşımlı), `job_feeds`, `starred_jobs`, `job_scores`, `job_reads`, `job_translations` |
| Ekonomi | `credits`, `usage_events`, `purchases`, `referral_codes`, `referrals` |
| İletişim | `notifications`, `user_settings` (digest opt-out), `feedback` |
| Portfolyo public | `portfolio_leads`, `testimonials` |
| Operasyon | `scrape_runs`, `public_analyses`, `product_events`, `interview_sessions` |

**Erişim modeli:** kullanıcı verisi RLS ile sahibine; `job_pool` paylaşımlı-okunur / service-role-yazar;
`public_analyses` ve `product_events` **politikasız RLS** = yalnız service-role (kullanıcı hiç okumaz).
Kullanıcı silinince `product_events.user_id` null'a düşer, satır kalır → huni geçmişi bozulmaz.

---

## 8. AI katmanı

- **Model:** OpenAI `gpt-4o-mini` (`lib/ai/openai-client.ts`). Tüm üretim buradan geçer.
  *(`lib/ai/anthropic.ts` eski geçişten kalma — hiçbir yerden import edilmiyor, ölü kod.)*
- **Maliyet takibi:** `lib/ai/pricing.ts` token → USD; her çağrı `usage_events`'e yazılır
  (ücretsiz özelliklerin gerçek maliyeti de görünür kalır).
- **Yapılandırılmış çıktı:** OpenAI structured-output + Zod doğrulama. *Tuzak: depolama şemasındaki
  `.optional()` url alanı OpenAI'ı 400'ler → portfolyo için ayrı `portfolioGenSchema` var.*
- **Deterministik / AI ayrımı** ürünün omurgası:
  - **AI:** metin yazımı, profil çıkarımı, ilan-profil eşleştirme yorumu, mülakat geri bildirimi.
  - **Saf kod:** alaka skoru, rubrik toplamı (`RUBRIC_WEIGHTS` %40/30/20/10), ATS skoru, ücret/ROI
    hesabı, dolandırıcılık ve sağlık taraması, pipeline/cashflow, oturum raporu, aktivasyon hunisi.
  - Gerekçe: skorların tekrarlanabilir, test edilebilir ve **ücretsiz** olması.
- **Dil direktifi:** `lib/ai/language.ts` — üretim UI diline uyar; teklif metni platform diline.

---

## 9. Tasarım dili — "Solar Pop"

`app/solar-pop.css` + `components/solar/`. **Tüm site bu dilde** (2026-08-15); yeni her yüzey de.

- Token'lar birebir kopya (elle değiştirilmez); `globals.css` shadcn semantik token'larını
  (`--background`/`--card`/`--primary`) Solar Pop'a bağlar → eski ekranlar da ısınır.
- Fontlar: **Poppins** (display + gövde) + **Yellowtail** (el yazısı vurgu).
- `components/solar/`: `primitives.tsx` (hook'suz — sunucu+client ortak), `fields.tsx`,
  `site-chrome.tsx` (tüm public sayfaların tek header/footer'ı), `tool-shell.tsx`, `landing-nav.tsx`.
- **Koyu tema YOK** — `forcedTheme="light"`, tema seçici kaldırıldı.
- Dashboard kabuğu: 248px yapışkan kenar çubuğu; nav **gruplu** (Work / Assets / Practice / Help).

Detay + tasarımla birlikte gelen ürün kararları: `docs/DESIGN.md`.

---

## 10. Güvenlik ve gizlilik

- **RLS her tabloda**; service-role yalnız sunucuda, `lib/supabase/admin.ts` istemciye import edilmez.
- **SSRF koruması** import fetch'lerinde; **allowlist** iframe gömmede; **DOMPurify** portfolyo HTML'inde.
- **Ham dosya saklanmaz** — PDF/DOCX bellekte parse edilir, atılır.
- **Ham IP saklanmaz** — `/analyze` rate-limit'i tuzlu hash ile (`ANALYZE_IP_SALT`).
- **Enumeration koruması** — var olmayan e-postaya şifre sıfırlama 200 döner, mail gitmez.
- **İstemciye analitik script'i/çerezi eklenmez, sayfa görüntüleme izlenmez** → gizlilik metni vendor
  eklemek zorunda kalmadı.
- **Ödeme doğrulaması sunucuda** — istemciden gelen fiyat/kredi/başarı bilgisine güvenilmez.

---

## 11. Kalite ve test

- `npm run check` = lint + `tsc --noEmit` + vitest. İş bitişinde temiz olmalı.
- **72 birim test dosyası** — hepsi saf çekirdeklerde (hesap, filtre, skor, imza, parse).
- **Playwright duman testleri** (`e2e/`, masaüstü + Pixel 7): 17 public rota + landing bölümleri +
  5 hesaplayıcının girdi→çekirdek→ekran zinciri + auth ekranları.
  - `assertNoMissingMessages` — **next-intl eksik anahtarı sessizce anahtar yolunu render eder;**
    ne tsc ne vitest görür. Öksüz i18n anahtarı temizliğini güvenli kılan ağ budur.
  - **Tuzak:** e2e `npm run dev`'e koşmaz — Next dev route'ları talep üzerine derler, paralel yükte
    aynı sayfaya rastgele 404/500 döner (hiçbir değişiklik yokken 17 sahte düşüş görüldü).
    Varsayılan `build && start`.
- Sentry: `instrumentation*.ts` + `withSentryConfig`; source map upload doğrulandı.

---

## 12. Ürün analitiği (vendor yok)

`lib/analytics/` — veri kendi veritabanında.

- `PRODUCT_EVENTS` kanonik olay listesi → `product_events` tablosuna server-only, fire-and-forget
  (`trackEvent`; hata Sentry'ye gider, **kullanıcı akışını asla bozmaz**).
- Huni **kohort bazlı**: bir adım yalnız o dönemde kayıt olan kullanıcı için sayılır — aksi hâlde
  eski kullanıcı aktivitesi dönüşümü %100'ün üstüne çıkarır.
- Huninin ilk adımı olay değil `auth.users` sayımı → **kayıt için istemci enstrümantasyonu gerekmez.**
- Yazan rotalar: profil import → profil kaydet → uyarlama → teklif → portfolyo yayın → checkout.
- UI: `/admin` (allowlist `ADMIN_EMAILS`) en üstte huni paneli + geri bildirim kutusu.

---

## 13. Operasyon

- **Deploy:** Vercel; `main`'e push = otomatik deploy. Prod: `https://multifolio-ecru.vercel.app`.
- **Cron (dış, cron-job.org):** `POST /api/internal/scrape` (günde ≤2) ve
  `POST /api/internal/weekly-digest` (Pazartesi) — ikisi de `x-cron-secret` ile.
- **Zorunlu env:** Supabase URL/anon/service-role · `OPENAI_API_KEY` · `SCRAPER_CRON_SECRET` ·
  `RESEND_SMTP_PASS` + `RESEND_FROM_EMAIL` · `ANALYZE_IP_SALT` · Sentry DSN/token ·
  (opsiyonel) `FREELANCER_OAUTH_TOKEN` · (ödeme için) `IYZICO_*` + `NEXT_PUBLIC_APP_URL`.
- **Kabuk notu:** geliştirme makinesi PowerShell — bash sözdizimi çalışmaz.
- **Supabase manuel ayarı (kodda değil):** "Confirm email" KAPALI (Management API
  `mailer_autoconfirm:true`), Redirect URLs'e `/auth/verify-email` + `/reset-password`.

---

## 14. Durum (2026-08-19)

**Tamamlanmış:** çekirdek (profil/uyarlama/teklif/eşleştirme/portfolyo) · CV modülü · feed + scrape +
kalite/dolandırıcılık filtresi · mini-CRM + follow-up + benchmark + cashflow · mülakat + pazarlık ·
6 ücretsiz araç + 9 rehber + pSEO · uzantı (store'da canlı) · referral + digest + bildirim merkezi ·
admin panel + aktivasyon hunisi · Solar Pop tasarım dili tüm sitede · e2e ağı.

**Kalan — kod-dışı (kullanıcı aksiyonu):**

1. `0042_product_events` migration'ı prod'a push (`supabase db push`) — yoksa huni paneli boş.
2. Resend domain doğrulama (SPF/DKIM) — **auth mailleri, bildirim ve digest bunsuz gitmiyor.**
3. Iyzico anahtarları + `NEXT_PUBLIC_APP_URL` — kod hazır; anahtar girilince ödeme açılır.
4. Yasal: `[Şirket Ünvanı]/[Adres]/[VKN]` yer tutucuları + hukuki inceleme (ödeme öncesi).

**Kalan — kod (küçük / opsiyonel):**

- Solar Pop durum renkleri: dashboard'da başarı/hata hâlâ Tailwind `emerald`/`red`. Design system'de
  durum rengi token'ı yok (~40 dosya, 200+ eşleşme). Renk tek sinyal olmadığı için (kelime + glif var)
  işlevsel olarak doğru, sadece dil dışı.
- Bazı eski panellerde token'a bağlı olmayan `rounded-2xl` yarıçapları.
- Ölü kod: `lib/ai/anthropic.ts` (hiçbir importer yok).
- Opsiyonel genişleme: platform Dalga 2 (Wellfound, Behance, Dribbble, Indeed, Braintrust…),
  özel domain portfolyo, saat dilimi/vize filtresi (⛔ `job_pool`'da veri yok),
  Faz 6 işveren tarafı (roadmap'te "çok sonra").

> ⚠️ `PLATFORM_IDS` büyüdükçe enumerate eden UI'lar otomatik büyür: HUB kart sayısı ve
> `/api/adapt/all` kredi maliyeti orantılı artar → yeni platform eklemeden önce kullanıcıya
> platform seçimi sunulmalı.

---

## 15. İlgili dokümanlar

| Dosya | İçerik |
|---|---|
| `CLAUDE.md` | Kod haritası ("neyin nerede") + sert kurallar |
| `docs/DESIGN.md` | Solar Pop tasarım dili, token'lar, komp durumu |
| `docs/ARCHITECTURE.md` | Mimari detay |
| `docs/SECURITY.md` | Güvenlik modeli |
| `docs/OBSERVABILITY.md` | Sentry / log |
| `docs/ROADMAP.md` | Faz geçmişi |
| `docs/EXPANSION-PLAN.md` | Platform genişletme + başvuru taktikleri araştırması |
| `docs/EXTENSION.md` | Chrome uzantısı detayı |
| `docs/GO-LIVE-CHECKLIST.md` | Yayın adımları (hesap / DNS / hukuk) |
