import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  /* config options here */
};

// Sentry sarmalayıcısı: source map yüklemesi yalnızca SENTRY_AUTH_TOKEN
// tanımlıyken (CI/üretim) gerçekleşir; lokalde sessizce atlanır.
export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Build günlüklerini sessizleştir (CI dışında).
  silent: !process.env.CI,
  // İstemci paketinde daha geniş source map kapsamı → stack trace'te doğru satır.
  widenClientFileUpload: true,
  // Ad-blocker'ları aşmak için Sentry isteklerini kendi alan adımız üzerinden geçir.
  tunnelRoute: "/monitoring",
});
