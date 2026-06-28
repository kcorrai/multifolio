# Multifolio

Çoklu platform freelancer kariyer aracı. Kullanıcı işlerini/becerilerini/sonuçlarını
**bir kez** girer; sistem her platform (LinkedIn, Upwork, Fiverr, Bionluk, Armut) için
optimize profil/başvuru metni üretir, otomatik portfolyo sitesi kurar, ilanlarla eşleştirir
ve başvuruları takip eder. Teknik dil İngilizce/global; ilk kullanıcılar Türkiye'den.
Para modeli: kredi tabanlı (pay-as-you-go). **Şu an: Faz 2 (portfolyo sitesi).**

## Yığın
Next.js (App Router, TS) · Tailwind · shadcn/ui · Supabase (Postgres+Auth+Storage, RLS açık,
`@supabase/ssr`) · Anthropic Claude (uyarlama motoru) · Sentry · Zod · DOMPurify · Vercel.

## Neyin nerede
- `app/page.tsx` — ana sayfa (sunucu): oturum varsa Profil Stüdyosu, yoksa giriş çağrısı.
- `app/login`, `app/auth/{confirm,signout}` — magic-link (e-posta OTP) auth akışı.
- `app/` — sayfalar + `app/api/*/route.ts` uç noktaları. `app/global-error.tsx` kök ErrorBoundary.
  - `app/api/health` — canlılık. `app/api/debug-sentry` — Sentry test (kaldırılabilir).
  - `app/api/profile` — **korumalı uç nokta ŞABLONU** (yeni route'lar bunu örnek alır).
  - `app/api/adapt` — uyarlama uç noktası (profil → platform metni; maliyeti kaydeder).
  - `app/api/usage` — kullanıcının kümülatif harcaması (USD).
  - `app/api/jobs` — GET (liste) / POST (oluştur) iş ilanı uç noktaları.
  - `app/api/jobs/[id]` — PATCH (durum/başlık güncelle) / DELETE.
  - `app/api/jobs/[id]/match` — POST: AI profil × ilan eşleştirme, maliyet kaydı.
  - `app/api/analytics` — GET: tür bazında özet + 30 günlük günlük harcama serisi.
- `lib/errors/` — tipli `AppError` sınıfları + `withErrorHandler` (her route bundan geçer).
- `lib/ai/` — uyarlama motoru (sunucu-only): `anthropic.ts` (Claude istemcisi),
  `platforms.ts` (LinkedIn/Upwork/Fiverr/Bionluk/Armut yönergeleri + `platformIdSchema`),
  `adapt.ts` (`adaptProfile`), `portfolio.ts` (`generatePortfolio`),
  `match.ts` (`matchJobToProfile`), `pricing.ts` (token kullanımı → USD maliyet).
- `lib/validation/` — Zod yardımcıları (`parseJson`/`parseQuery`) + `schemas/`.
- `lib/supabase/` — `server.ts` (RLS'li, varsayılan), `admin.ts` (service-role, RLS bypass — dikkat),
  `client.ts` (tarayıcı), `middleware.ts` (oturum yenileme). Kök `proxy.ts` bunu çağırır.
- `lib/sanitize.ts` — portfolyo HTML'i için XSS sanitize (render öncesi zorunlu).
- `lib/validation/schemas/job.ts` — `jobCreateSchema`, `jobUpdateSchema`, `jobMatchResultSchema` + `JobStatus`.
- `components/ui/` — shadcn bileşenleri. `components/profile-studio.tsx` — Faz 1 MVP UI'ı.
  `lib/utils.ts` — `cn()`.
- `supabase/migrations/` — SQL şema + RLS politikaları (`supabase db push`).
- `supabase/email-templates/` — Supabase Auth e-posta şablonları (magic-link HTML). Dashboard'a manuel yapıştırılır.
- Sentry: `instrumentation*.ts`, `sentry.*.config.ts`, `next.config.ts` (`withSentryConfig`).
- `.env.example` — ortam değişkeni şablonu (gerçek değerler `.env.local`'da, commit edilmez).
- `docs/` — tüm detay buradadır (aşağıdaki sert kurallar dışında bu dosyaya detay yazma).

## Komutlar
- `npm run dev` — geliştirme sunucusu.
- `npm run build` — üretim build'i.
- `npm run check` — lint + type-check (`tsc --noEmit`). PR/iş bitişinde temiz olmalı.

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
