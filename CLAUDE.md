# Multifolio

Çoklu platform freelancer kariyer aracı. Kullanıcı işlerini/becerilerini/sonuçlarını
**bir kez** girer; sistem her platform (LinkedIn, Upwork, Fiverr, Bionluk, Armut) için
optimize profil/başvuru metni üretir, otomatik portfolyo sitesi kurar, ilanlarla eşleştirir
ve başvuruları takip eder. Teknik dil İngilizce/global; ilk kullanıcılar Türkiye'den.
**Dil:** Kullanıcıya görünen TÜM metin i18n katalogunda (`messages/{en,tr}.json`) — EN varsayılan, TR opsiyonel; sabit string yazma, `useTranslations`/`getTranslations` kullan (yeni anahtar ekleyince iki katalogu da güncelle). **Kod yorumları Türkçe kalır.** AI çıktı dili UI locale'ine uyar.
Para modeli: kredi tabanlı (pay-as-you-go). **Şu an: Faz 8 tamamlandı (Global i18n — EN varsayılan + TR, cookie tabanlı). Sırada: backlog / Faz 6 (iki taraflı pazar).**

## Yığın
Next.js (App Router, TS) · Tailwind · shadcn/ui · Supabase (Postgres+Auth+Storage, RLS açık,
`@supabase/ssr`) · OpenAI `gpt-4o-mini` (uyarlama motoru) · **next-intl (i18n, cookie tabanlı; EN varsayılan + TR)** · Sentry · Zod · DOMPurify · Vercel.

## Neyin nerede
- `app/page.tsx` — ana sayfa (sunucu): her zaman landing gösterir; oturum açıksa nav'da "Dashboard" butonu.
- `app/dashboard/layout.tsx` — korumalı dashboard kabuğu (sunucu): auth + paylaşılan veri (email, kredi, harcama, rozet sayıları) çeker → `DashboardShell`'e iletir; oturum yoksa `/login`.
- `app/dashboard/{page,profile,adapt,portfolio,jobs,analytics,accounts}/page.tsx` — her sekme ayrı route (sunucu): yalnızca kendi veri dilimini çeker → ilgili `*-tab` client bileşenine iletir. `page.tsx` = Genel Bakış (`/dashboard`).
- `app/login`, `app/signup`, `app/forgot-password`, `app/reset-password` — e-posta+şifre auth sayfaları (ortak kabuk `components/auth/auth-layout.tsx`). `app/auth/{confirm,verify-email,signout}` — confirm (recovery code exchange), verify-email (doğrulama callback → `app_metadata.email_verified`, service-role), signout. Giriş/kayıt sonrası `/dashboard`.
- `app/` — sayfalar + `app/api/*/route.ts` uç noktaları. `app/global-error.tsx` kök ErrorBoundary.
  - `app/api/health` — canlılık. `app/api/debug-sentry` — Sentry test (kaldırılabilir).
  - `app/api/profile` — **korumalı uç nokta ŞABLONU** (yeni route'lar bunu örnek alır).
  - `app/api/adapt` — uyarlama uç noktası (profil → platform metni; maliyeti kaydeder).
  - `app/api/usage` — kullanıcının kümülatif harcaması (USD).
  - `app/api/jobs` — GET (liste) / POST (oluştur) iş ilanı uç noktaları; url/budget/notes alanları desteklenir.
  - `app/api/jobs/[id]` — GET (tam veri) / PATCH (durum/başlık/notlar) / DELETE.
  - `app/api/jobs/[id]/match` — POST: AI profil × ilan eşleştirme, maliyet kaydı + Telegram trigger.
  - `app/api/proposal` — GET (iş bazlı liste) / POST (AI teklif üretir, proposals'a kaydeder).
  - `app/api/analytics` — GET: tür bazında özet + 30 günlük harcama + `applicationStats` (başvuru performansı).
  - `app/api/credits` — GET: kullanıcının kredi bakiyesi (`credits` tablosu).
  - `app/api/platform-connections` — GET (liste) / PUT (upsert) / DELETE: platform profil URL'leri.
- `lib/errors/` — tipli `AppError` sınıfları + `withErrorHandler` (her route bundan geçer).
- `lib/ai/` — uyarlama motoru (sunucu-only): `openai-client.ts` (OpenAI gpt-4o-mini istemcisi),
  `platforms.ts` (LinkedIn/Upwork/Fiverr/Bionluk/Armut yönergeleri + `PROPOSAL_GUIDANCE`),
  `adapt.ts` (`adaptProfile`), `portfolio.ts` (`generatePortfolio`),
  `match.ts` (`matchJobToProfile` + ilandan `requirements` çıkarımı), `proposal.ts` (`generateProposal` — teklif metni + ilan gereksinimlerine karşı kapsama),
  `coverage.ts` (saf kapsama yardımcıları: pending/summary/prompt blokları), `pricing.ts` (token → USD).
- `lib/notifications/email.ts` — `sendMatchNotificationEmail` (Resend API, fire-and-forget; skor ≥ 70 olunca kullanıcı e-postasına bildirim).
- `lib/validation/` — Zod yardımcıları (`parseJson`/`parseQuery`) + `schemas/`.
- `lib/supabase/` — `server.ts` (RLS'li, varsayılan), `admin.ts` (service-role, RLS bypass — dikkat),
  `client.ts` (tarayıcı), `middleware.ts` (oturum yenileme). Kök `proxy.ts` bunu çağırır.
- `lib/sanitize.ts` — portfolyo HTML'i için XSS sanitize (render öncesi zorunlu).
- `lib/validation/schemas/job.ts` — `jobCreateSchema`, `jobUpdateSchema`, `jobMatchResultSchema` (artık `requirements` içerir) + `JobStatus` (awaiting_reply dahil).
- `lib/validation/schemas/proposal.ts` — `proposalCreateSchema`, `proposalWithCoverageSchema` + `ProposalCoverageItem`, `ProposalRow` tipi.
- `lib/validation/schemas/platform-connection.ts` — `platformConnectionUpsertSchema` + `PlatformConnection` tipi.
- `components/ui/` — shadcn bileşenleri.
- `components/dashboard/` — route-bölünmüş dashboard (her sekme ayrı sayfa). `shell.tsx` (sidebar+topbar+mobil nav, `usePathname` aktif durum, `<Link>` navigasyon; toast) `layout.tsx`'ten sarmalar. `dashboard-context.tsx` — oturum state'i (harcama, rozet sayıları, uyarlama sonuçları, "yakında" toast) sekmeler arası paylaşır (`useDashboard`). `shared.tsx` — tipler/sabitler/`StatCard`/helper'lar (sunucu+client ortak). `copy-button.tsx`, `use-adapt.ts`. `verify-email-banner.tsx` — dashboard'da ertelenmiş e-posta doğrulama banner'ı + toast. Sekme bileşenleri: `overview-tab.tsx`, `profile-tab.tsx`, `adapt-tab.tsx`, `portfolio-tab.tsx`, `jobs-tab.tsx`, `analytics-tab.tsx`, `accounts-tab.tsx`.
  `components/job-detail-panel.tsx` — seçili iş için 2-sütun sağ panel (durum, AI skor, teklif CTA, notlar).
  `components/proposal-modal.tsx` — platform-spesifik AI teklif üretimi + geçmiş teklifler.
  `components/notification-settings-modal.tsx` — Telegram bağlantı + eşik ayarı.
  `components/job-add-modal.tsx` — hızlı iş ekleme (platform/bütçe/URL) + otomatik AI eşleştirme.
  `components/theme-provider.tsx` — next-themes provider (defaultTheme: dark).
  `components/theme-toggle.tsx` — Sun/Moon toggle butonu (her iki header'da kullanılır).
  `components/platform-logo.tsx` — 5 platform için SVG logo bileşeni (PlatformId → SVG).
  `lib/utils.ts` — `cn()`.
  `components/language-toggle.tsx` — EN/TR dil seçici (landing nav + dashboard topbar).
- `i18n/` — next-intl cookie tabanlı i18n (URL routing YOK): `detect.ts` (saf `resolveLocale`, test edilebilir), `locale.ts` (`getUserLocale` — cookie/Accept-Language), `actions.ts` (`setUserLocale` server action), `request.ts` (getRequestConfig). `messages/{en,tr}.json` — çeviri katalogları (**EN varsayılan + TR opsiyonel**; anahtar setleri eşit, `messages/catalog.test.ts` doğrular).
- `lib/ai/language.ts` — `languageDirective(locale)`: AI üretim prompt'una eklenen dil direktifi (çıktı UI diline uyar). AI route'ları `getUserLocale()` okuyup üretim fonksiyonuna geçirir.
- `supabase/migrations/` — SQL şema + RLS politikaları (`supabase db push`).
  `0007_proposals.sql` — proposals tablosu; job_listings'e url/notes/budget + awaiting_reply status.
  `0008_notifications.sql` — boş (Telegram sistemi iptal edildi; e-posta Resend API üzerinden).
  `0009_proposal_coverage.sql` — proposals.coverage kolonu (ilan gereksinimlerine karşı kapsama).
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
