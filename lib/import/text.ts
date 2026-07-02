// Profil içe aktarma için saf metin yardımcıları (sunucu tarafında kullanılır,
// ama saf/test-edilebilir kalsın diye burada framework bağımlılığı yok).
import type { PlatformId } from "@/lib/ai/platforms";

export const IMPORT_AI_TEXT_LIMIT = 20_000;

/** HTML'den kaba metin: script/style blokları atılır, tag'ler boşluk olur. */
export function htmlToText(html: string): string {
  const noBlocks = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  const noTags = noBlocks.replace(/<[^>]+>/g, " ");
  const decoded = noTags
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, " ");
  return decoded.replace(/\s+/g, " ").trim();
}

/** AI'a gidecek metni token maliyeti tavanı için kırpar. */
export function clampImportText(text: string): string {
  return text.length > IMPORT_AI_TEXT_LIMIT ? text.slice(0, IMPORT_AI_TEXT_LIMIT) : text;
}

const PLATFORM_HOSTS: Record<PlatformId, string> = {
  linkedin: "linkedin.com",
  upwork: "upwork.com",
  fiverr: "fiverr.com",
  bionluk: "bionluk.com",
  armut: "armut.com",
};

/** URL bilinen bir platforma mı ait? (host tam eşleşme veya *.host) */
export function detectPlatformFromUrl(url: string): PlatformId | null {
  let host: string;
  try { host = new URL(url).hostname.toLowerCase(); } catch { return null; }
  for (const [id, h] of Object.entries(PLATFORM_HOSTS) as [PlatformId, string][]) {
    if (host === h || host.endsWith(`.${h}`)) return id;
  }
  return null;
}

/** SSRF temel koruması: yalnız http(s), localhost/özel-IP host'lar reddedilir. */
export function isSafeExternalUrl(url: string): boolean {
  let u: URL;
  try { u = new URL(url); } catch { return false; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local")) return false;
  // IPv4 özel/loopback/link-local aralıkları
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 127 || a === 10 || a === 0) return false;
    if (a === 192 && b === 168) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 169 && b === 254) return false;
  }
  if (host === "::1" || host.startsWith("[")) return false; // IPv6 literal reddi (basit)
  return true;
}
