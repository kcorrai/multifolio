// Next.js sunucu tarafı enstrümantasyon giriş noktası.
// register() runtime'a göre doğru Sentry config'ini yükler;
// onRequestError ise sunucu render/route hatalarını Sentry'ye iletir.
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
