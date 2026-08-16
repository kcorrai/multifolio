// e2e yardımcıları — konsol/i18n gözcüsü.
//
// En değerli parça `watchErrors`: next-intl eksik bir anahtarı SESSİZCE
// anahtar yolunu basarak geçiştirir (`landing.footer.tagline` gibi). Bu ne
// tsc'ye ne de vitest'e yakalanır; ancak sayfa gerçekten açıldığında görülür.
// Öksüz katalog anahtarlarını temizlemeyi güvenli kılan ağ budur.
import { expect, type Page } from "@playwright/test";

/** Sayfa gövdesinde çözülmemiş i18n anahtarı izi (ör. "landing.hero.title"). */
const MISSING_MESSAGE_RE = /\b[a-z][a-zA-Z0-9]*(?:\.[a-z][a-zA-Z0-9]*){2,}\b/;

/** Gürültü: kaynak yükleme hataları testin konusu değil (analitik, font, resim). */
const IGNORED_CONSOLE = [
  /favicon/i,
  /Failed to load resource/i,
  /net::ERR_/i,
  /\[Fast Refresh\]/i,
  /Download the React DevTools/i,
];

export interface ErrorWatcher {
  /** Toplanan konsol hataları + yakalanmamış istisnalar. */
  messages: string[];
  /** Hiç hata birikmediğini doğrular. */
  assertClean(): void;
}

export function watchErrors(page: Page): ErrorWatcher {
  const messages: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (IGNORED_CONSOLE.some((re) => re.test(text))) return;
    messages.push(`console.error: ${text}`);
  });

  page.on("pageerror", (err) => {
    messages.push(`pageerror: ${err.message}`);
  });

  return {
    messages,
    assertClean() {
      expect(messages, `Sayfada JS/konsol hatası: ${messages.join(" | ")}`).toEqual([]);
    },
  };
}

/**
 * Görünür metinde çözülmemiş i18n anahtarı olmadığını doğrular.
 * next-intl eksik anahtarda anahtarın kendisini render eder — kullanıcıya
 * "landing.footer.tagline" gibi bir metin gösterir. Bunu yakalıyoruz.
 */
export async function assertNoMissingMessages(page: Page) {
  const body = await page.locator("body").innerText();
  const suspicious = body
    .split("\n")
    .map((line) => line.trim())
    // Tam satır bir anahtar yoluna benziyorsa şüpheli (cümle içi nokta değil).
    .filter((line) => line.length > 0 && !line.includes(" ") && MISSING_MESSAGE_RE.test(line));

  expect(suspicious, `Çözülmemiş i18n anahtarı görünüyor: ${suspicious.join(", ")}`).toEqual([]);
}

/** Bir sayfayı aç, temel sağlığını doğrula (h1 var, hata yok, anahtar sızmamış). */
export async function openAndAssertHealthy(page: Page, path: string) {
  const watcher = watchErrors(page);
  const response = await page.goto(path);

  expect(response?.status(), `${path} HTTP durumu`).toBeLessThan(400);
  await expect(page.locator("h1").first()).toBeVisible();
  await assertNoMissingMessages(page);
  watcher.assertClean();

  return watcher;
}
