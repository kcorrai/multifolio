import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// Tüm yanıtlara uygulanan güvenlik header'ları (defense-in-depth).
// CSP bilinçli olarak eklenmedi: Next.js inline script/style + Sentry tünel
// nonce altyapısı gerektirir; yanlış CSP uygulamayı kırar. Clickjacking,
// MIME-sniff ve referrer sızıntısı bu header'larla kapatılır.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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
