// Playwright e2e — public yüzeylerin duman testi.
// Birim testler (vitest) saf hesap çekirdeklerini korur; buradaki testler
// SAYFANIN GERÇEKTEN AÇILDIĞINI, i18n anahtarlarının çözüldüğünü ve
// hesaplayıcıların uçtan uca bağlı olduğunu doğrular.
//
// Çalıştırma: `npm run test:e2e` (dev sunucusunu kendisi ayağa kaldırır).
// Farklı bir hedefe koşmak için: `E2E_BASE_URL=https://... npm run test:e2e`
// (bu durumda webServer başlatılmaz).
import { defineConfig, devices } from "@playwright/test";

const externalTarget = process.env.E2E_BASE_URL;
const baseURL = externalTarget ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL,
    trace: "on-first-retry",
    // Türkçe/İngilizce karışıklığı olmasın: katalog EN-only, tarayıcı da EN.
    locale: "en-US",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // Mobil yapışkan sonuç çubuğu ve hamburger nav yalnız dar ekranda görünür.
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],

  // Dış hedefe koşarken sunucu başlatma.
  webServer: externalTarget
    ? undefined
    : {
        // VARSAYILAN: üretim build'i. `npm run dev` BİLEREK kullanılmıyor —
        // Next dev rotaları talep üzerine derler ve Playwright'in paralel
        // yükü altında aynı sayfaya kimi zaman 404/500 döner. Bu, testleri
        // ürün hatası varmış gibi düşürüyordu (2026-08-16'da doğrulandı:
        // aynı hatalar hiçbir değişiklik yokken de çıkıyor).
        // Dev sunucusuyla hızlı yinelemek için: E2E_DEV=1 npm run test:e2e
        command: process.env.E2E_DEV ? "npm run dev" : "npm run build && npm run start",
        // Hazırlık sinyali `/` DEĞİL: dev `/`'i derlenmemiş rotalardan önce
        // yanıtlar. `/api/health` cevap verdiğinde router gerçekten ayaktadır.
        url: `${baseURL}/api/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
        stdout: "ignore",
        stderr: "pipe",
      },
});
