// Tüm herkese açık rotaların duman testi: açılıyor mu, h1 var mı,
// konsolda hata var mı, i18n anahtarı sızmış mı.
import { test, expect } from "@playwright/test";
import { openAndAssertHealthy } from "./helpers";

const PUBLIC_ROUTES = [
  "/",
  "/pricing",
  "/rate",
  "/roi",
  "/ats-check",
  "/proposal-checker",
  "/headline-optimizer",
  "/analyze",
  "/guides",
  "/freelance",
  "/privacy",
  "/terms",
  "/contact",
  "/extension/privacy",
  "/login",
  "/signup",
  "/forgot-password",
];

for (const route of PUBLIC_ROUTES) {
  test(`${route} sağlıklı açılır`, async ({ page }) => {
    await openAndAssertHealthy(page, route);
  });
}

test("landing ana bölümleri ve dönüşüm yolları duruyor", async ({ page }) => {
  await openAndAssertHealthy(page, "/");

  // Vitrin rayı (Remotion videosunun yerini alan bölüm) sayfada.
  await expect(page.locator("#showcase")).toBeVisible();

  // Kayıt yolu her zaman erişilebilir olmalı — huninin girişi burası.
  // `.first()` KULLANMA: masaüstü header CTA'sı mobilde DOM'da ama gizli;
  // asıl soru "görünür en az bir kayıt yolu var mı".
  await expect(page.locator('a[href="/signup"]:visible').first()).toBeVisible();
});

test("landing'den ücretsiz bir araca gidilebilir", async ({ page }) => {
  await page.goto("/");
  await page.locator('a[href="/rate"]').first().click();
  await page.waitForURL("**/rate");
  await expect(page.locator("h1").first()).toBeVisible();
});

test("robots ve sitemap üretiliyor", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  // Sitemap araç kataloğunu okur — bir araç düşerse burada görünür.
  expect(xml).toContain("/rate");
  expect(xml).toContain("/proposal-checker");
});

test("sağlık uç noktası ayakta", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
});
