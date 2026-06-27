// İstemci (tarayıcı) için Sentry başlatma. Next.js bu dosyayı otomatik yükler.
// DSN yoksa no-op.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  tracesSampleRate: 1,
  debug: false,
});

// Router geçişlerini (navigasyon) izleme için gerekli export.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
