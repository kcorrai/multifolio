# Architecture

> Taslak — fazlar ilerledikçe genişler.

## Genel bakış
Next.js (App Router) tek uygulama. Sunucu route'ları (`app/api/*`) iş mantığını yürütür;
Supabase Postgres verinin kaynağıdır (RLS ile sahibe sınırlı). Anthropic Claude, platform
uyarlama metinlerini üreten motordur (Faz 1+, yalnızca sunucuda çağrılır).

## Katmanlar
- **Sunum:** `app/` sayfaları + `components/ui/` (shadcn).
- **API:** `app/api/*/route.ts`. Her route `withErrorHandler` ile sarılır ve girdiyi Zod ile
  doğrular. Bkz. `app/api/profile` — referans şablon.
- **Veri:** `lib/supabase/*`. Varsayılan `server.ts` (RLS'li). `admin.ts` yalnızca gerçek
  admin işleri için (RLS bypass). Şema: `supabase/migrations/`.
- **Doğrulama:** `lib/validation/*` (Zod şemaları + parse yardımcıları).
- **Hata/gözlemlenebilirlik:** `lib/errors/*` + Sentry. Bkz. `OBSERVABILITY.md`.
- **Güvenlik:** RLS, sanitize, sır yönetimi. Bkz. `SECURITY.md`.

## Veri akışı (örnek: profil kaydetme)
1. İstemci `POST /api/profile` çağırır.
2. `withErrorHandler` sarar → `getUser()` ile auth → yoksa `AuthError`.
3. `parseJson(profileInputSchema)` gövdeyi doğrular → geçersizse `ValidationError`.
4. RLS'li Supabase client ile `profiles` tablosuna upsert (politika: `auth.uid() = user_id`).
5. Yapılandırılmış JSON cevap; hata olursa Sentry + `x-request-id`.

## Uyarlama motoru (Faz 1+)
Anthropic Claude çağrıları `lib/` altında ayrı bir modülde toplanacak (ör. `lib/ai/`),
yalnızca sunucudan; `ANTHROPIC_API_KEY` istemciye sızdırılmaz. Kredi düşümü bu katmanda.
