# Multifolio

Çoklu platform freelancer kariyer aracı. Kullanıcı işlerini/becerilerini/sonuçlarını
**bir kez** girer; sistem her platform (LinkedIn, Upwork, Fiverr, Bionluk, Armut) için
optimize profil/başvuru metni üretir, otomatik portfolyo sitesi kurar, ilanlarla eşleştirir
ve başvuruları takip eder. Teknik dil İngilizce/global; ilk kullanıcılar Türkiye'den.
Para modeli: kredi tabanlı (pay-as-you-go). **Şu an: Faz 0 (zemin).**

## Yığın
Next.js (App Router, TS) · Tailwind · shadcn/ui · Supabase (Postgres+Auth+Storage, RLS açık,
`@supabase/ssr`) · Anthropic Claude (uyarlama motoru) · Sentry · Zod · DOMPurify · Vercel.

## Neyin nerede
- `app/` — sayfalar + `app/api/*/route.ts` uç noktaları. `app/global-error.tsx` kök ErrorBoundary.
  - `app/api/health` — canlılık. `app/api/debug-sentry` — Sentry test (kaldırılabilir).
  - `app/api/profile` — **korumalı uç nokta ŞABLONU** (yeni route'lar bunu örnek alır).
- `lib/errors/` — tipli `AppError` sınıfları + `withErrorHandler` (her route bundan geçer).
- `lib/validation/` — Zod yardımcıları (`parseJson`/`parseQuery`) + `schemas/`.
- `lib/supabase/` — `server.ts` (RLS'li, varsayılan), `admin.ts` (service-role, RLS bypass — dikkat),
  `client.ts` (tarayıcı).
- `lib/sanitize.ts` — portfolyo HTML'i için XSS sanitize (render öncesi zorunlu).
- `components/ui/` — shadcn bileşenleri. `lib/utils.ts` — `cn()`.
- `supabase/migrations/` — SQL şema + RLS politikaları (`supabase db push`).
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
