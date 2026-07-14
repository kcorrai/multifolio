// Profil içe aktarma için saf metin yardımcıları (sunucu tarafında kullanılır,
// ama saf/test-edilebilir kalsın diye burada framework bağımlılığı yok).
import { lookup } from "node:dns/promises";
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
  freelancer: "freelancer.com",
  contra: "contra.com",
  peopleperhour: "peopleperhour.com",
  "99designs": "99designs.com",
  guru: "guru.com",
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

/** Bir IP adresi (v4/v6) özel/loopback/link-local/reserved aralıkta mı? */
export function isPrivateIp(address: string): boolean {
  const v4 = address.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 169 && b === 254) return true; // link-local (cloud metadata)
    if (a >= 224) return true; // multicast/reserved
    return false;
  }
  // IPv6 (kaba ama güvenli tarafta): loopback, unique-local (fc00::/7),
  // link-local (fe80::/10) ve IPv4-mapped (::ffff:a.b.c.d) reddedilir.
  const ip = address.toLowerCase();
  if (ip === "::1" || ip === "::") return true;
  if (ip.startsWith("fc") || ip.startsWith("fd")) return true; // fc00::/7
  if (ip.startsWith("fe8") || ip.startsWith("fe9") || ip.startsWith("fea") || ip.startsWith("feb")) return true; // fe80::/10
  const mapped = ip.match(/::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (mapped) return isPrivateIp(mapped[1]);
  return false;
}

/**
 * DNS-rebinding koruması: hostname'i çözer ve HERHANGİ bir çözümlenen adres
 * özel/iç aralıktaysa reddeder. isSafeExternalUrl yalnız string'e bakar; bu,
 * "public görünen ama iç IP'ye çözülen" host'u connect ÖNCESİ elemeye yarar.
 */
async function assertPublicHost(url: string): Promise<void> {
  const host = new URL(url).hostname;
  // IP literali ise isSafeExternalUrl zaten string bazlı kontrol etti; yine de doğrula.
  const results = await lookup(host, { all: true });
  if (results.length === 0) throw new Error("dns_no_result");
  for (const { address } of results) {
    if (isPrivateIp(address)) throw new Error("private_ip_target");
  }
}

/**
 * SSRF-güvenli dış HTML çekimi. `fetch(redirect:"follow")` bir yönlendirmeyi
 * KÖR takip eder; izin verilen public bir host 3xx ile iç servise (ör. cloud
 * metadata 169.254.169.254) yönlendirebilir. Bu yüzden yönlendirmeleri ELLE
 * takip eder ve HER adımın hedefini hem isSafeExternalUrl (string) hem
 * assertPublicHost (DNS çözümleme → iç IP reddi) ile doğrular.
 */
export async function fetchExternalHtml(
  url: string,
  opts: { timeoutMs: number; maxRedirects?: number },
): Promise<string> {
  const maxRedirects = opts.maxRedirects ?? 4;
  let current = url;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    if (!isSafeExternalUrl(current)) throw new Error("unsafe_redirect_target");
    await assertPublicHost(current); // DNS-rebinding: çözümlenen IP iç ise reddet
    const res = await fetch(current, {
      signal: AbortSignal.timeout(opts.timeoutMs),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MultifolioBot/1.0)", Accept: "text/html" },
      redirect: "manual",
    });

    // 3xx + Location → sonraki hedefi doğrula ve devam et.
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new Error(`HTTP ${res.status} (no location)`);
      current = new URL(location, current).toString(); // göreli Location'ı çöz
      continue;
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  }
  throw new Error("too_many_redirects");
}
