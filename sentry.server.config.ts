// Sunucu (Node.js runtime) için Sentry başlatma.
// DSN yoksa `enabled:false` → Sentry no-op olur (lokalde gürültü/istek yok).
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  tracesSampleRate: 1,
  // Hata mesajlarını/kaynak satırlarını okunur tutmak için. Üretimde source map
  // yüklemesi next.config.ts'teki withSentryConfig ile yapılır.
  debug: false,
});
