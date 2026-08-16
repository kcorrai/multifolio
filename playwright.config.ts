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
        // CI'da üretim build'ine koşarız — dev sunucusunun talep-üzerine
        // derlemesi gerçek davranış değil ve yavaş.
        command: process.env.CI ? "npm run build && npm run start" : "npm run dev",
        // DİKKAT: hazırlık sinyali `/` DEĞİL. Next dev `/`'i erken yanıtlar ama
        // henüz derlenmemiş rotalara bir süre 404 döner → testler sahte düşer.
        // `/api/health` yanıt verdiğinde router gerçekten ayaktadır.
        url: `${baseURL}/api/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
        stdout: "ignore",
        stderr: "pipe",
      },
});
