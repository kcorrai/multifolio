// Auth yüzeyleri + (env verilirse) girişli ana akış.
//
// Kimlik gerektiren kısım BİLEREK opsiyonel: gerçek Supabase'e yazar. CI'da
// veya lokalde koşturmak için .env'e E2E_USER_EMAIL + E2E_USER_PASSWORD ver.
// Yoksa testler atlanır — suite yine de auth ekranlarını korur.
import { test, expect } from "@playwright/test";
import { watchErrors, assertNoMissingMessages, openAndAssertHealthy } from "./helpers";

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;
const hasCredentials = !!email && !!password;

test("giriş sayfası formu ve alternatif yolları taşır", async ({ page }) => {
  await openAndAssertHealthy(page, "/login");

  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await expect(page.locator('a[href="/signup"]').first()).toBeVisible();
  await expect(page.locator('a[href="/forgot-password"]').first()).toBeVisible();
});

test("hatalı bilgiyle giriş sessizce kaybolmaz", async ({ page }) => {
  const watcher = watchErrors(page);
  await page.goto("/login");

  await page.fill('input[type="email"]', "definitely-not-a-user@example.com");
  await page.fill('input[type="password"]', "wrong-password-12345");
  await page.locator('button[type="submit"]').first().click();

  // Ya görünür bir hata bandı çıkar ya da sayfada kalırız — ama ASLA
  // "hiçbir şey olmadı" durumu olmamalı (JOBS-FLOWS-REVIEW'daki sessiz 401 deseni).
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator('[role="alert"], [aria-live]').first()).toBeVisible();

  await assertNoMissingMessages(page);
  watcher.assertClean();
});

test("kayıt sayfası şifre gücü göstergesini canlı günceller", async ({ page }) => {
  await openAndAssertHealthy(page, "/signup");

  const pw = page.locator('input[type="password"]').first();
  await pw.fill("a");
  const weakState = await page.locator("form").innerText();

  await pw.fill("Xy7!kQ2#mP9$rL4@");
  await expect
    .poll(async () => page.locator("form").innerText())
    .not.toBe(weakState);
});

test.describe("girişli ana akış", () => {
  test.skip(!hasCredentials, "E2E_USER_EMAIL / E2E_USER_PASSWORD verilmedi");

  test("giriş → dashboard kabuğu → sekmeler arası gezinme", async ({ page }) => {
    const watcher = watchErrors(page);

    await page.goto("/login");
    await page.fill('input[type="email"]', email!);
    await page.fill('input[type="password"]', password!);
    await page.locator('button[type="submit"]').first().click();

    await page.waitForURL("**/dashboard**", { timeout: 20_000 });

    // Kabuk: kredi hapı + kenar çubuğu nav'ı.
    await expect(page.locator('a[href="/dashboard/jobs"]').first()).toBeVisible();

    for (const route of ["/dashboard/profile", "/dashboard/jobs", "/dashboard/portfolio"]) {
      await page.goto(route);
      await expect(page.locator("h1, h2").first()).toBeVisible();
      await assertNoMissingMessages(page);
    }

    watcher.assertClean();
  });
});
