# Multifolio

Çoklu platform freelancer kariyer aracı. Kullanıcı işlerini/becerilerini/sonuçlarını
**bir kez** girer; sistem her platform (LinkedIn, Upwork, Fiverr, Bionluk, Armut) için
optimize profil/başvuru metni üretir, otomatik portfolyo sitesi kurar, ilanlarla eşleştirir
ve başvuruları takip eder. Teknik dil İngilizce/global; ilk kullanıcılar Türkiye'den.
**Dil:** Kullanıcıya görünen TÜM metin i18n katalogunda (`messages/{en,tr}.json`) — EN varsayılan, TR opsiyonel; sabit string yazma, `useTranslations`/`getTranslations` kullan (yeni anahtar ekleyince iki katalogu da güncelle). **Kod yorumları Türkçe kalır.** AI çıktı dili UI locale'ine uyar.
Para modeli: kredi tabanlı (pay-as-you-go). **Şu an: Dalga 2 tamamlandı (ücretsiz /analyze aracı + referral kredi programı + profil gücü skoru — 2026-07-04; Dalga 1 aynı gün: sayfalama, exclude keywords, risk rozeti, RemoteOK, iki dilli digest, düşük kredi banner'ı). Sırada: backlog Tier 2 (haftalık özet e-postası, follow-up hatırlatıcı, EN teklifin TR karşılığı, net kazanç hesaplayıcı, portfolyo UI geri getirme) / Iyzico. Migration'lar 0024 dahil.**

## Yığın
Next.js (App Router, TS) · Tailwind · shadcn/ui · Supabase (Postgres+Auth+Storage, RLS açık,
`@supabase/ssr`) · OpenAI `gpt-4o-mini` (uyarlama motoru) · **next-intl (i18n, cookie tabanlı; EN varsayılan + TR)** · Sentry · Zod · DOMPurify · Vercel.

## Neyin nerede
- `app/page.tsx` — ana sayfa (sunucu): her zaman landing gösterir; oturum açıksa nav'da "Dashboard" butonu.
- `app/dashboard/layout.tsx` — korumalı dashboard kabuğu (sunucu): auth + paylaşılan veri (email, kredi, harcama, rozet sayıları) çeker → `DashboardShell`'e iletir; oturum yoksa `/login`.
- `app/dashboard/{page,profile,jobs}/page.tsx` — her sekme ayrı route (sunucu): yalnızca kendi veri dilimini çeker → ilgili `*-tab` client bileşenine iletir. `page.tsx` = Genel Bakış (`/dashboard`); eski Analytics içeriği (tür bazlı kullanım + 30 günlük grafik + başvuru performansı) buraya birleştirildi. **Portfolio ve Analytics sekmeleri kaldırıldı** (portfolio yalnız UI — arka uç duruyor).
- `app/dashboard/import/page.tsx` — onboarding profil içe aktarma wizard'ı (`import-wizard.tsx`): URL/metin/PDF → AI taslak → düzenle → kaydet. Profilsiz kullanıcı Genel Bakış'tan buraya yönlendirilir (yalnız `/dashboard`; diğer sekmeler serbest). `?source=extension` → uzantının bıraktığı bekleyen taslağı (`profile_import_drafts`, ≤60 dk) wizard'a prefill eder.
- `app/dashboard/platforms/{page,[id]}/page.tsx` — platform-bazlı sayfalar (sunucu): `page.tsx` = HUB (5 platform kartı), `[id]/page.tsx` = tek platform detayı (geçersiz id → `notFound()`). Detay 4 bölümü tek yerde toplar: uyarlanmış profil + bağlantı URL'i + platform-filtreli eşleşen işler + platform-filtreli teklif geçmişi/ipuçları. **Eski `adapt`/`accounts` sekmeleri buraya taşındı (kaldırıldı).**
- `app/login`, `app/signup`, `app/forgot-password`, `app/reset-password` — e-posta+şifre auth sayfaları (ortak kabuk `components/auth/auth-layout.tsx`). `app/auth/{confirm,verify-email,signout}` — confirm (recovery code exchange), verify-email (doğrulama callback → `app_metadata.email_verified`, service-role), signout. Giriş/kayıt sonrası `/dashboard`.
- `app/` — sayfalar + `app/api/*/route.ts` uç noktaları. `app/global-error.tsx` kök ErrorBoundary.
  - `app/api/health` — canlılık.
  - `app/api/profile` — **korumalı uç nokta ŞABLONU** (yeni route'lar bunu örnek alır).
  - `app/api/profile/import` — POST: URL/metin/PDF → AI profil taslağı (ücretsiz — kredi düşmez; saatte 10 limit; `usage_events kind='profile_import'`; platform URL'iyse `platform_connections` upsert). **Bionluk + LinkedIn URL'i özel yol:** AI yerine yapılandırılmış public veriden doğrudan taslak (`lib/import/{bionluk,linkedin}.ts`) + avatar (Bionluk ayrıca portfolyo görselleri); ekstralar yanıtta nötr `media:{avatarUrl,portfolio}` alanında. **Upwork/Fiverr bot duvarı `mode:"extension"` ile aşılır:** tarayıcı uzantısı login'li sekmeden metin+medya gönderir → AI yolu + taslak `profile_import_drafts`'a upsert (inceleme wizard'da).
  - `app/api/adapt` — uyarlama uç noktası (profil → platform metni; maliyeti kaydeder; çıktı `adaptations`'a kalıcı upsert edilir — `spendCredits` closure içinde, yazım patlarsa kredi iade).
  - `app/api/usage` — kullanıcının kümülatif kredi kullanımı (`{ creditsUsed, count }`).
  - `app/api/jobs` — GET (liste) / POST (oluştur) iş ilanı uç noktaları; url/budget/notes alanları desteklenir.
  - `app/api/jobs/[id]` — GET (tam veri) / PATCH (durum/başlık/notlar) / DELETE.
  - `app/api/jobs/[id]/match` — POST: AI profil × ilan eşleştirme, maliyet kaydı + Telegram trigger.
  - `app/api/jobs/[id]/followup` — POST: AI takip mesajı (1 kredi; kalıcı DEĞİL — kullanıcı kopyalar). Hatırlatma eşiği `lib/followup.ts` (saf, `followUpDays` — status_changed_at→updated_at fallback); üretim `lib/ai/followup.ts`. UI: job-detail-panel'de amber banner (applied/awaiting_reply + ≥5 gün).
  - `app/api/proposal` — GET (iş bazlı liste) / POST (AI teklif üretir, proposals'a kaydeder). **Teklif içeriği PLATFORM dilinde** (`PLATFORM_LANGUAGE`: upwork/fiverr/linkedin=EN, bionluk/armut=TR; coverage notları UI dilinde — `proposalLanguageDirective`).
  - `app/api/proposal/[id]/translate` — POST: teklif metnini UI diline çevirir (ücretsiz; cache yok, saatte 30 `usage_events kind='proposal_translate'`). UI: proposal-modal'da `TranslationBlock` toggle (teklif dili ≠ UI dili ise).
  - `app/api/credits` — GET: kullanıcının kredi bakiyesi (`credits` tablosu).
  - `app/api/analyze` — POST: HERKESE AÇIK ücretsiz profil analizi (auth opsiyonel; kayıtsız 5/saat IP-hash `public_analyses`, girişli 10/saat `usage_events kind='public_analyze'`; teaser SUNUCUDA kesilir — kayıtsıza `full:null`). Motor `lib/ai/profile-analyze.ts` + saf skor `lib/analyze/{score,ip-hash}.ts`. Sayfa: `/analyze` (`components/analyze/analyze-form.tsx`).
  - `app/api/referral` — GET: kullanıcının davet kodu (yoksa service-role üretir) + istatistik. Ödül tetiği `app/api/profile` POST'ta (`maybeGrantReferralBonus` — İLK profil kaydında iki tarafa +20, `referrals.referred_id` UNIQUE idempotency). Signup `?ref=` → `user_metadata.referred_by_code` (`app/signup/signup-form.tsx`, Suspense'li).
  - `app/api/platform-connections` — GET (liste) / PUT (upsert) / DELETE: platform profil URL'leri.
  - `app/api/platform-profiles` — POST: bağlı URL'den platform profil verisini çek → `platform_profiles` upsert (ücretsiz; saatte 10, `usage_events kind='platform_sync'`). Yalnız Bionluk+LinkedIn sunucudan; Upwork/Fiverr'ı uzantı akışı doldurur (`profile/import` da `platform_profiles`'a yazar). Platform detay "X Profilin" kartı buradan.
  - `app/api/feed` — GET: kullanıcının kayıtlı feed'lerine uyan `job_pool` ilanları (+yıldız+cache skor).
  - `app/api/feed/search` — GET: `job_pool` üzerinde anlık arama.
  - `app/api/feed/[poolId]/score` — POST: on-demand profil×ilan AI skoru (kredi + `job_scores` cache; gövde `{force:true}` cache'i bypass edip üzerine yazar — eski rubriksiz skoru rubrikliyle yenileme).
  - `app/api/feed/[poolId]/translate` — POST: ilan açıklamasını UI diline çevirir (ücretsiz; PAYLAŞIMLI `job_translations` cache; `usage_events kind='job_translate'` + saatlik limit).
  - `app/api/feeds` (+`[id]`) — kayıtlı feed CRUD (kullanıcı başına 10 limit). `app/api/starred` — yıldız GET/POST/DELETE.
  - `app/api/internal/scrape` — POST: dış cron (cron-job.org) `x-cron-secret` ile tetikler; Remotive+Arbeitnow ücretsiz API'lerinden çekip `job_pool`'a upsert (Alt-proje B canlı çekme).
  - `app/api/internal/weekly-digest` — POST: dış cron (haftada 1, AYNI `x-cron-secret`) tetikler; son 7 günün kullanıcı aktivitesi + feed eşleşmelerini kullanıcı başına tek özet e-postada gönderir (motor `lib/digest/weekly.ts`, opt-out `user_settings.weekly_digest`).
  - `app/api/settings` — GET/PATCH: kullanıcı ayarları (`user_settings`; satır yoksa varsayılan `weeklyDigest:true`). Toggle UI: `components/dashboard/weekly-digest-toggle.tsx` (Overview altında).
- `lib/errors/` — tipli `AppError` sınıfları + `withErrorHandler` (her route bundan geçer).
- `lib/ai/` — uyarlama motoru (sunucu-only): `openai-client.ts` (OpenAI gpt-4o-mini istemcisi),
  `platforms.ts` (LinkedIn/Upwork/Fiverr/Bionluk/Armut yönergeleri + `PROPOSAL_GUIDANCE`),
  `adapt.ts` (`adaptProfile`), `portfolio.ts` (`generatePortfolio` — dashboard UI'si kaldırıldı; `/api/portfolio/*` + herkese açık `/p/[slug]` duruyor),
  `match.ts` (`matchJobToProfile` + ilandan `requirements` çıkarımı; 4 boyutlu rubrik üretir + ilan bağlamı `MatchJobContext` alır), `rubric.ts` (SAF, server-only değil: `RUBRIC_WEIGHTS` %40/30/20/10 + `computeRubricScore` — toplam skor rubrikten deterministik + `rubricVerdict` go/maybe/skip; UI da import eder), `proposal.ts` (`generateProposal` — teklif metni + ilan gereksinimlerine karşı kapsama),
  `profile-import.ts` (`extractProfile` — serbest metin → profil taslağı),
  `translate.ts` (`translateJobTitles` batch dil tespiti+EN/TR başlık, `translateJobDescription` on-demand açıklama — ilan çevirisi hibrit: başlık scrape-time, açıklama ilk görüntülemede),
  `coverage.ts` (saf kapsama yardımcıları: pending/summary/prompt blokları), `pricing.ts` (token → USD).
- `lib/notifications/email.ts` — `sendMatchNotificationEmail` (Resend API, fire-and-forget; skor ≥ 70 olunca kullanıcı e-postasına bildirim) + `sendFeedDigestEmail` + `sendWeeklyDigestEmail` (iki dilli).
- `lib/digest/weekly.ts` — haftalık özet motoru: saf `buildWeeklySummaries` (ilan/teklif/kredi aktivitesi + `buildFeedDigests` yeniden kullanımıyla feed eşleşmeleri; sinyalsiz kullanıcıya e-posta yok) + `runWeeklyDigest` orchestrator (notify.ts deseni: admin client + gönderici parametre).
- `lib/validation/` — Zod yardımcıları (`parseJson`/`parseQuery`) + `schemas/`.
- `lib/supabase/` — `server.ts` (RLS'li, varsayılan), `admin.ts` (service-role, RLS bypass — dikkat),
  `client.ts` (tarayıcı), `middleware.ts` (oturum yenileme). Kök `proxy.ts` bunu çağırır.
- `lib/sanitize.ts` — portfolyo HTML'i için XSS sanitize (render öncesi zorunlu).
- `lib/validation/schemas/job.ts` — `jobCreateSchema`, `jobUpdateSchema`, `jobMatchAiSchema` (AI üretimi: rubrik zorunlu, skor YOK) + `jobMatchResultSchema` (kayıtlı: rubric/verdict OPTIONAL — eski rubriksiz satırlar geçerli kalır) + `JobStatus` (awaiting_reply dahil).
- `lib/validation/schemas/proposal.ts` — `proposalCreateSchema`, `proposalWithCoverageSchema` + `ProposalCoverageItem`, `ProposalRow` tipi.
- `lib/validation/schemas/platform-connection.ts` — `platformConnectionUpsertSchema` + `PlatformConnection` tipi.
- `lib/validation/schemas/feed.ts` — feed/arama/yıldız Zod şemaları + `PoolJob`/`PoolJobRow`/`JobFeedRow` tipleri.
- `lib/feed/filter.ts` — saf feed filtre/arama yardımcıları (`extractBudgetFloor`, `matchesFeed`, `searchPool`).
- `lib/import/` — profil içe aktarma saf yardımcıları: `text.ts` (HTML süzme, platform URL tanıma, SSRF koruması), `pdf.ts` (unpdf ile PDF→metin, bellekte — dosya saklanmaz), `bionluk.ts` (Bionluk public API istemcisi: `parseBionlukUsername` + `speed_init`→`super-token` handshake + `get_public_profile`/`portfolio_get_all` → saf `normalizeBionlukProfile`; foto+bio+skills+portfolyo görselleri; sunucudan çalışır, worker/proxy yok), `linkedin.ts` (LinkedIn public profil `/in/{username}` sayfasına gömülü JSON-LD `@graph`'ten profil: `parseLinkedinUsername` + tarayıcı-UA fetch + saf `normalizeLinkedinProfile`; headline←jobTitle, summary←tagline+şirketler+okullar+konum, foto; skills YOK — public ld+json içermez).
- `lib/scrape/` — Alt-proje B canlı çekme katmanı: `types.ts` (`ScrapeSource` arayüzü + `PoolJobUpsert`), `sources/{remotive,arbeitnow,remoteok}.ts` (adaptör: `fetch` I/O + saf `normalize`; `htmlToText` ile açıklama düz metne; remoteok: ilk eleman legal-notice → şema doğal reddeder, salary 0=bilinmiyor), `run.ts` (`runScrape` orchestrator — geçerlileri `job_pool`'a upsert, kaynak başına koşu özetini `scrape_runs`'a yazar, biri patlarsa diğeri devam), `translate-titles.ts` (`translateNewTitles` — cron sonrası `lang IS NULL` başlıkları chunk'la EN/TR'ye çevirip `job_pool`'a yazar; çevirmen + client parametre, hata izole), `notify.ts` (`buildFeedDigests` saf + `notifyFeedMatches` — koşuda yeni eklenen ilanları `notify=true` feed'lerle eşleştirir, kullanıcı başına tek özet e-posta `sendFeedDigestEmail`; hata izole). Service-role client'ı parametre alır (import etmez). Ücretsiz remote-iş API'leri; Upwork/proxy YOK.
- `components/ui/` — shadcn bileşenleri.
- `components/dashboard/` — route-bölünmüş dashboard (her sekme ayrı sayfa). `shell.tsx` (sidebar+topbar+mobil nav, `usePathname` aktif durum, `<Link>` navigasyon; toast) `layout.tsx`'ten sarmalar. `dashboard-context.tsx` — oturum state'i (harcama, rozet sayıları, uyarlama sonuçları, "yakında" toast) sekmeler arası paylaşır (`useDashboard`). `shared.tsx` — tipler/sabitler/`StatCard`/helper'lar (sunucu+client ortak). `copy-button.tsx`, `use-adapt.ts`. `verify-email-banner.tsx` — dashboard'da ertelenmiş e-posta doğrulama banner'ı + toast. Sekme bileşenleri: `overview-tab.tsx` (stat kartları + tür bazlı kullanım + 30 günlük grafik + son ilanlar + başvuru performansı), `profile-tab.tsx`, `jobs-tab.tsx`, `platforms-hub-tab.tsx` (platform kartları), `platform-detail-tab.tsx` (tek platform 4-bölüm: uyarla/bağlantı/işler/teklifler+ipuçları; `use-adapt`+`JobDetailPanel` yeniden kullanır).
  `components/dashboard/match-rubric.tsx` — `MatchRubric` (4 boyutlu skor dökümü barları) + `VerdictBadge` (go/maybe/skip rozeti) + `RiskBadges` (sahte ilan risk sinyalleri, amber çipler — skoru etkilemez); pool-job-panel + job-detail-panel paylaşır, rubriksiz eski sonuçlarda paneller "rubrikli yeniden analiz" butonu gösterir.
  `components/dashboard/low-credits-banner.tsx` — bakiye <20 (ve harcama >0) olunca dashboard içeriği üstünde amber uyarı (verify-email-banner deseni; CTA "yakında" toast'ı).
  `components/job-detail-panel.tsx` — seçili iş için 2-sütun sağ panel (durum, AI skor+rubrik, teklif CTA, notlar).
  `components/proposal-modal.tsx` — platform-spesifik AI teklif üretimi + geçmiş teklifler.
  `components/notification-settings-modal.tsx` — Telegram bağlantı + eşik ayarı.
  `components/job-add-modal.tsx` — hızlı iş ekleme (platform/bütçe/URL) + otomatik AI eşleştirme.
  `jobs-tab.tsx` artık segmented kabuk (Feed/Search/Starred/Applied, `?view=` senkron); alt görünümler `feed-view.tsx` (UpHunt tarzı: sol feed rayı + sayaçlar; seçili feed = dar ilan sütunu + SAYFA İÇİ `feed-settings-panel.tsx` — ön filtre/AI skorlama/bildirim/teklif yönergesi (proposal_prompt) inline PATCH ile, "düşük skorluları göster" toggle'ı, iki-adımlı sil), `search-view.tsx` (filtre çubuğu: zaman çipleri + açılır panel ülke-hariç/platform/min harcama-saatlik-sabit + "feed olarak kaydet" prefill), `starred-view.tsx`/`applied-view.tsx`. Paylaşılan: `pool-job-row.tsx` (satır+platform rozeti), `pool-job-panel.tsx` (skor+Upwork deep-link+apply köprüsü), `job-slide-over.tsx` (sağdan kayan ilan detay paneli + karartılmış backdrop — üç pool görünümünün ortak deseni), `feed-modal.tsx` (yalnız feed OLUŞTURMA + `initial` prefill; düzenleme sayfa içi panelde), `chips-input.tsx` (ortak etiket girişi — feed-modal + profile-tab paylaşır).
  `components/credit-cost.tsx` — kredi harcayan butonlardaki maliyet rozeti (`CreditCost kind=...` → "1 kredi"; CREDIT_COSTS'tan okur; adapt/analyze/proposal/job-add butonlarında). Platform detay sayfası kullanıcının KAYNAK profilini de gösterir (avatar+headline+summary+skills+portfolyo, `InitialProfile` prop — `[id]/page.tsx` tam profil çeker).
  `components/theme-provider.tsx` — next-themes provider (defaultTheme: dark).
  `components/theme-toggle.tsx` — Sun/Moon toggle butonu (her iki header'da kullanılır).
  `components/platform-logo.tsx` — 5 platform için SVG logo bileşeni (PlatformId → SVG).
  `lib/utils.ts` — `cn()`.
  `components/language-toggle.tsx` — EN/TR dil seçici (landing nav + dashboard topbar).
  `components/count-up.tsx` — görünüme girince 0'dan hedefe sayan rakam (landing hero skoru + stats; reduced-motion'da direkt hedef).
- `i18n/` — next-intl cookie tabanlı i18n (URL routing YOK): `detect.ts` (saf `resolveLocale`, test edilebilir), `locale.ts` (`getUserLocale` — cookie/Accept-Language), `actions.ts` (`setUserLocale` server action), `request.ts` (getRequestConfig). `messages/{en,tr}.json` — çeviri katalogları (**EN varsayılan + TR opsiyonel**; anahtar setleri eşit, `messages/catalog.test.ts` doğrular).
- `lib/ai/language.ts` — `languageDirective(locale)`: AI üretim prompt'una eklenen dil direktifi (çıktı UI diline uyar). AI route'ları `getUserLocale()` okuyup üretim fonksiyonuna geçirir.
- `supabase/migrations/` — SQL şema + RLS politikaları (`supabase db push`).
  `0007_proposals.sql` — proposals tablosu; job_listings'e url/notes/budget + awaiting_reply status.
  `0008_notifications.sql` — boş (Telegram sistemi iptal edildi; e-posta Resend API üzerinden).
  `0009_proposal_coverage.sql` — proposals.coverage kolonu (ilan gereksinimlerine karşı kapsama).
  `0012_job_feed.sql` — `job_pool` (paylaşımlı; yalnız service-role yazar) + kullanıcı `job_feeds`/`starred_jobs`/`job_scores` + `job_listings.source_pool_id`. `supabase/seed/job_pool_sample.sql` — örnek pool ilanları (`source='sample'`).
  `0013_feed_filters.sql` — `job_feeds`'e exclude_countries/min_hourly_rate/min_fixed_price/min_client_spent/min_score, `job_pool`'a client_spent (lenient filtre: ilanda veri yoksa elemez).
  `0014_adaptations.sql` — `adaptations` (platform başına SON uyarlama, user×platform unique; platform detay + HUB buradan hydrate olur — yenilemede AI çıktısı kaybolmaz).
  `0015_scrape_runs.sql` — `scrape_runs` (Alt-proje B scraper koşu logu: kaynak/çekilen/yeni/atlanan/hata/süre; yalnız service-role yazar).
  `0016_job_translations.sql` — ilan çevirisi (hibrit): `job_pool`'a lang/title_en/title_tr (scrape-time başlık) + `job_translations` PAYLAŞIMLI on-demand açıklama cache'i (pool×locale unique; yalnız service-role yazar).
  `0017_profile_media.sql` — `profiles`'a `avatar_url` + `portfolio jsonb` (Bionluk içe aktarmasından foto+portfolyo; dış URL saklanır, Storage'a indirme yok).
  `0018_profile_import_drafts.sql` — uzantı içe aktarmasının bekleyen taslağı (kullanıcı başına TEK satır, RLS; route yazar, `/dashboard/import?source=extension` okur; 60 dk tazelik).
  `0019_feed_notify.sql` — `job_feeds.notify` (feed başına e-posta bildirimi opt-in; cron scrape sonrası yeni ilan eşleşirse kullanıcı başına tek özet e-posta).
  `0020_platform_profiles.sql` — `platform_profiles` (kullanıcı×platform ÇEKİLMİŞ profil verisi: headline/summary/skills/avatar/portfolio/fetched_at; sync route + import route yazar, platform detay gösterir).
  `0021_feed_proposal_prompt.sql` — `job_feeds.proposal_prompt` (feed'e özel teklif AI yönergesi; `/api/proposal` source_pool_id'li ilanda uyan İLK prompt'lu feed'inkini prompt'a ekler).
  `0022_feed_exclude_keywords.sql` — `job_feeds.exclude_keywords` (feed başına hariç keyword; `matchesFeed` aynı hay metninde negatif kontrol — exclude pozitiften önce uygulanır).
  `0023_public_analyses.sql` — kayıtsız /analyze rate-limit kaydı (ip_hash+created_at; RLS açık politikasız — yalnız service-role; ham IP saklanmaz).
  `0024_referrals.sql` — `referral_codes` (select-own) + `referrals` (referred_id UNIQUE = idempotency, select-own referrer) + `grant_credits(p_user,p_amount,p_reason)` RPC (yalnız service_role).
  `0025_user_settings.sql` — `user_settings` (user_id PK, `weekly_digest` bool default true; satır yoksa AÇIK sayılır; RLS sahip okur/yazar).
  `0026_job_status_changed.sql` — `job_listings.status_changed_at` (follow-up sayacının referansı; PATCH route durum değişince damgalar — not düzenlemesi sayacı sıfırlamaz).
- `extension/` — Chrome MV3 tarayıcı uzantısı (Upwork/Fiverr/LinkedIn profil içe aktarma; ayrıntı `docs/EXTENSION.md`): KENDİ package.json/check'i var (kök check'ten hariç — tsconfig/eslint/vitest exclude). `src/extract.ts` saf yardımcılar (test'li), `content.ts` shadow-root buton + metin/medya toplama, `background.ts` cookie'li POST → `/api/profile/import mode:"extension"`. UI dili `_locales/{en,tr}` + `chrome.i18n`. Build: esbuild (`npm run build` prod — manifest'ten localhost izni çıkar / `build:dev` localhost / `package` store zip'i); `dist/` = load-unpacked klasörü. Store gizlilik sayfası: `app/extension/privacy/page.tsx` (`/extension/privacy`, i18n `extensionPrivacy`).
- Env: `RESEND_FROM_EMAIL` (opsiyonel; yoksa `onboarding@resend.dev` kullanılır).
- `supabase/email-templates/` — Supabase Auth e-posta şablonları (magic-link HTML). Dashboard'a manuel yapıştırılır.
- Sentry: `instrumentation*.ts`, `sentry.*.config.ts`, `next.config.ts` (`withSentryConfig`).
- `.env.example` — ortam değişkeni şablonu (gerçek değerler `.env.local`'da, commit edilmez).
- `docs/` — tüm detay buradadır (aşağıdaki sert kurallar dışında bu dosyaya detay yazma).

## Komutlar
- `npm run dev` — geliştirme sunucusu.
- `npm run build` — üretim build'i.
- `npm run test` — vitest birim testleri.
- `npm run check` — lint + type-check (`tsc --noEmit`) + test (vitest). PR/iş bitişinde temiz olmalı.

## Kurulum / sık düşülen tuzaklar (tekrarlanmasın)
- **Kabuk:** Bu makinede terminal **PowerShell**. Bash sözdizimi (`export`, `curl -X/-H/-d`, `&&` bazı yerlerde) çalışmaz; PowerShell'de `Invoke-RestMethod`/`Invoke-WebRequest` kullan (veya Bash tool'una geç). `curl` PowerShell'de `Invoke-WebRequest` alias'ıdır.
- **Auth manuel Supabase kurulumu (zorunlu, kodda değil):** Auth → Email → **"Confirm email" KAPALI** olmalı (yeni panelde bu toggle Email modalından kaldırıldı → Management API: `PATCH https://api.supabase.com/v1/projects/{ref}/config/auth` gövde `{"mailer_autoconfirm":true}`, personal access token ile). Redirect URLs'e `/auth/verify-email` + `/reset-password` ekle (localhost + prod).
- **Auth e-postaları Supabase Custom SMTP (Resend) üzerinden gider** — app'in `lib/notifications/email.ts` Resend API'sinden AYRI. Gönderen (from) adresi **Resend'de doğrulanmış bir alan adı** olmalı; değilse `signInWithOtp`/`resetPasswordForEmail` **"Error sending magic link email" (500)** ile patlar. `onboarding@resend.dev` yalnız Resend hesabının kendi adresine gönderir.
- **Enumeration koruması:** var olmayan e-postaya `resetPasswordForEmail` 200 döner ve **mail göndermez** → "E-postanı kontrol et" ekranı SMTP'yi test ETMEZ; gerçek SMTP testinde var olan bir kullanıcı kullan.

## Sert kurallar (üç sütun — pazarlık yok)
1. **Hata görünürlüğü:** Her API route `withErrorHandler`'dan geçer. Hata sessizce yutulmaz.
   Beklenmeyen hatalar Sentry'ye gider; iç detay istemciye sızmaz.
2. **Güvenli-by-default:** Her dış girdi Zod ile doğrulanır — istemci verisine güvenilmez.
   Sırlar/AI anahtarları yalnızca sunucu + `.env` (asla commit). Her DB tablosunda RLS.
   Veri erişimi parametreli Supabase sorgularıyla. Portfolyo HTML'i render öncesi sanitize.
   `service-role` (`lib/supabase/admin.ts`) asla istemciye import edilmez.
3. **Dokümantasyon:** Detay `docs/`'ta — bu dosya minimal kalır. Yeni klasör/modül eklediğinde
   yukarıdaki **"Neyin nerede"** bölümünü güncelle.

## Detay → docs/
`ROADMAP.md` (fazlar) · `ARCHITECTURE.md` · `OBSERVABILITY.md` · `SECURITY.md`.

@AGENTS.md
