# Observability

> Sütun 1: anlık hata görünürlüğü. Hiçbir hata sessizce yutulmaz.

## Sentry kurulumu
- İstemci: `instrumentation-client.ts`. Sunucu/Edge: `sentry.server.config.ts` /
  `sentry.edge.config.ts`, `instrumentation.ts` üzerinden yüklenir.
- Build/source map: `next.config.ts` içindeki `withSentryConfig`. Source map yüklemesi yalnızca
  `SENTRY_AUTH_TOKEN` tanımlıyken (CI/üretim) yapılır → stack trace'te **doğru kaynak satırı**.
- `NEXT_PUBLIC_SENTRY_DSN` boşsa Sentry **no-op**'tur (lokalde gürültü yok).

## Hata sözleşmesi (`lib/errors`)
- `AppError` taban sınıfı: `code`, `httpStatus`, `expose`, `context`.
  Alt sınıflar: `ValidationError`(400), `AuthError`(401), `ForbiddenError`(403),
  `NotFoundError`(404), `RateLimitError`(429), `InternalError`(500).
- `withErrorHandler(handler)`: her route'u sarar.
  - Bilinen `AppError` → yapılandırılmış JSON `{ error: { code, message, requestId } }` + statü.
  - `expose:false` (5xx) → istemciye generic mesaj; gerçek hata **Sentry'ye** gider.
  - Her cevapta `x-request-id` + sunucu logunda aynı `requestId` (eşleştirme).

## Doğrulama
- `GET /api/debug-sentry` bilerek hata fırlatır → 500 yapılandırılmış cevap; DSN tanımlıysa
  Sentry'de doğru satırla görünür. Faz 0 doğrulamasından sonra bu route kaldırılabilir.
- İstemci tarafı yakalanmayan hatalar `app/global-error.tsx` ile Sentry'ye gider.
