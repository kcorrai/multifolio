// Ücretsiz araçların uçtan uca bağlantı testi.
//
// Hesap çekirdekleri zaten vitest'li (lib/rate, lib/roi, lib/headline,
// lib/proposal-check, lib/cv/ats-text). Burada doğrulanan AYRI bir şey:
// girdi → çekirdek → ekran zincirinin gerçekten bağlı olduğu. Bir prop adı
// değişse veya sonuç paneli render edilmese birim testler yine geçer, bu düşer.
import { test, expect } from "@playwright/test";
import { watchErrors, assertNoMissingMessages } from "./helpers";

test("ücret hesaplayıcı girdiden saatlik ücret üretir", async ({ page }) => {
  const watcher = watchErrors(page);
  await page.goto("/rate");

  await page.fill("#rate-net", "5000");
  await page.fill("#rate-exp", "800");
  await page.fill("#rate-hours", "25");

  const primary = page.getByTestId("big-number-primary").first();
  await expect(primary).toBeVisible();
  // Para biçimli, sıfırdan büyük bir rakam bekliyoruz ("$74" gibi).
  const text = await primary.innerText();
  const numeric = Number(text.replace(/[^0-9.]/g, ""));
  expect(numeric).toBeGreaterThan(0);

  // Girdi artınca gerekli ücret de artmalı — panel canlı bağlı mı?
  await page.fill("#rate-net", "12000");
  await expect
    .poll(async () => Number((await primary.innerText()).replace(/[^0-9.]/g, "")))
    .toBeGreaterThan(numeric);

  await assertNoMissingMessages(page);
  watcher.assertClean();
});

test("ROI hesaplayıcı teklif/kazanma girdisiyle sonuç verir", async ({ page }) => {
  const watcher = watchErrors(page);
  await page.goto("/roi");

  await page.fill("#roi-proposals", "40");
  await page.fill("#roi-win", "10");
  await page.fill("#roi-value", "1500");

  await expect(page.getByTestId("big-number-primary").first()).toBeVisible();
  await assertNoMissingMessages(page);
  watcher.assertClean();
});

test("başlık optimizatörü skor ve eksen dökümü gösterir", async ({ page }) => {
  const watcher = watchErrors(page);
  await page.goto("/headline-optimizer");

  // Boşken sonuç paneli olmamalı (EmptyStance duruşu).
  await expect(page.getByTestId("score-value")).toHaveCount(0);

  await page.fill(
    "#headline",
    "Senior React developer — I cut checkout drop-off 32% for DTC brands",
  );

  const score = page.getByTestId("score-value").first();
  await expect(score).toBeVisible();
  const value = Number(await score.innerText());
  expect(value).toBeGreaterThanOrEqual(0);
  expect(value).toBeLessThanOrEqual(100);

  await assertNoMissingMessages(page);
  watcher.assertClean();
});

test("teklif denetleyicisi yapıştırılan metni skorlar", async ({ page }) => {
  const watcher = watchErrors(page);
  await page.goto("/proposal-checker");

  await expect(page.getByTestId("score-value")).toHaveCount(0);

  await page.fill(
    "#proposal-text",
    [
      "Hi Sarah, your checkout has a 32% drop-off on mobile.",
      "I rebuilt a similar flow for a DTC brand and cut it to 11% in three weeks.",
      "I would start by instrumenting the funnel, then ship the two highest-impact fixes.",
      "Can we talk Thursday?",
    ].join(" "),
  );

  await expect(page.getByTestId("score-value").first()).toBeVisible();
  await assertNoMissingMessages(page);
  watcher.assertClean();
});

test("ATS denetleyicisi üyelik duvarı OLMADAN çalışır", async ({ page }) => {
  const watcher = watchErrors(page);
  await page.goto("/ats-check");

  await page.fill(
    "#cv",
    [
      "Jane Doe — Senior Frontend Engineer",
      "Experience: Built and shipped React and TypeScript applications for 6 years.",
      "Reduced page load time by 40% and increased conversion by 12%.",
      "Skills: React, TypeScript, Next.js, Node.js, testing, accessibility.",
      "Education: BSc Computer Science.",
    ].join("\n"),
  );

  // Solar Pop turunda kaldırılan üyelik kilidi geri gelirse bu test düşer.
  await expect(page.getByTestId("score-value").first()).toBeVisible();
  await expect(page.locator('a[href="/signup"]:has-text("unlock")')).toHaveCount(0);

  await assertNoMissingMessages(page);
  watcher.assertClean();
});

test("/analyze kayıtsız kullanıcıya dürüst kilit kartı gösterir", async ({ page }) => {
  const watcher = watchErrors(page);
  await page.goto("/analyze");

  // Sahte bulanık katman kaldırıldı — geri gelirse yakalayalım.
  const blurred = page.locator('[class*="blur-"]');
  await expect(blurred).toHaveCount(0);

  await expect(page.locator("h1").first()).toBeVisible();
  await assertNoMissingMessages(page);
  watcher.assertClean();
});
