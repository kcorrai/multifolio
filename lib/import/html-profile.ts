// ld+json YAYINLAMAYAN ama public profil sayfası sunucudan okunabilen platformlar
// için ortak katman: Freelancer.com ve PeoplePerHour.
//
// 2026-07-20 canlı ölçüm:
//   freelancer.com/u/{username}  → 200, ~11.5k düz metin, og:title/description var
//                                  (og:image JENERİK paylaşım görseli — avatar DEĞİL)
//   peopleperhour.com/freelancer/{kategori}/{slug}
//                                → 200, ~5k düz metin, og:description = başlık,
//                                  og:image = GERÇEK avatar
// Yapılandırılmış veri olmadığı için özet/beceriler sayfa metninden AI ile çıkarılır
// (çağıran route yapar) — bu modül yalnız ağ + SAF ayıklama sağlar.
import { htmlToText } from "./text";
import { metaContent } from "./ldjson";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const FETCH_TIMEOUT_MS = 10_000;

/** AI'a giden metnin tavanı (route ayrıca kırpar). */
const TEXT_MAX = 20_000;

export interface HtmlProfileSource {
  /** AI'ın profil taslağı çıkaracağı sayfa metni. */
  text: string;
  /** og'dan gelen başlık ipucu (AI başlığı zayıf kalırsa kullanılır); yoksa "". */
  headlineHint: string;
  /** Gerçek profil fotoğrafı (jenerik paylaşım görselleri elenir); yoksa null. */
  avatarUrl: string | null;
}

/** freelancer.com/u/{username} → kullanıcı adı (profil değilse null). */
export function parseFreelancerUsername(url: string): string | null {
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  if (!/(^|\.)freelancer\.[a-z.]{2,10}$/i.test(u.hostname)) return null; // .com/.com.tr/.co.uk…
  const segments = u.pathname.split("/").filter(Boolean);
  if (segments.length !== 2 || segments[0].toLowerCase() !== "u") return null;
  const name = segments[1].replace(/\.html$/i, "");
  if (!/^[A-Za-z0-9._-]{2,60}$/.test(name)) return null;
  return name;
}

/** peopleperhour.com/freelancer/{kategori}/{slug} → tam yol (profil değilse null). */
export function parsePeopleperhourPath(url: string): string | null {
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  if (!/(^|\.)peopleperhour\.com$/i.test(u.hostname)) return null;
  const segments = u.pathname.split("/").filter(Boolean);
  // /freelancer/{kategori}/{slug} — /freelancer/{kategori} kategori sayfasıdır.
  if (segments.length !== 3 || segments[0].toLowerCase() !== "freelancer") return null;
  if (!segments.every((s) => /^[A-Za-z0-9._-]{1,120}$/.test(s))) return null;
  return `/${segments.join("/")}`;
}

/**
 * Freelancer.com'un og:image'ı her profilde AYNI jenerik paylaşım görselini veriyor
 * (…/share-make-it-real-thumbnail-1200x630.jpg) — avatar sanıp kaydetmemek gerek.
 */
export function isGenericShareImage(url: string): boolean {
  return /share-make-it-real|thumbnail-1200x630|default-avatar|placeholder/i.test(url);
}

/**
 * Sayfanın PROFİL bölgesini kesip çıkarır.
 *
 * NEDEN kritik: Freelancer.com'un profil sayfasında site navigasyonu devasa bir
 * kategori listesi taşıyor ("Shopify Web Designers", "WordPress…", 44 kez "Shopify").
 * Tüm gövdeyi AI'a verince model kullanıcının profilinden değil MENÜDEN başlık
 * uyduruyordu (canlı yakalandı: PHP/JavaScript uzmanına "Shopify & WordPress Expert"
 * başlığı üretildi). Bölgeye daraltmak bu kirliliği kaynağında kesiyor.
 *
 * Etiketler sırayla denenir; hiçbiri yoksa tüm gövdeye düşülür (best-effort).
 * Kapanış etiketi `>` ile birlikte aranır → `app-user-profile-header` gibi
 * ÖNEK paylaşan iç bileşenler yanlışlıkla eşleşmez.
 */
export function sliceContentRegion(html: string, tags: readonly string[]): string {
  for (const tag of tags) {
    const open = new RegExp(`<${tag}(?:\\s[^>]*)?>`, "i").exec(html);
    if (!open) continue;
    const start = open.index + open[0].length;
    const end = html.lastIndexOf(`</${tag}>`);
    if (end > start) return html.slice(start, end);
  }
  return html;
}

/** Profil içeriğini saran bilinen kapsayıcılar (canlı ölçümle belirlendi). */
export const REGION_TAGS = {
  freelancer: ["app-user-profile", "main"],
  peopleperhour: ["main"],
} as const;

/** Ham HTML → SAF ayıklama (ağ yok; test edilebilir). */
export function normalizeHtmlProfile(html: string, regionTags: readonly string[] = ["main"]): HtmlProfileSource {
  // og/meta TÜM belgeden okunur (head'de yaşar), metin ise yalnız profil bölgesinden.
  const ogImage = metaContent(html, "og:image");
  const headlineHint = (metaContent(html, "og:description") || metaContent(html, "description")).slice(0, 120);
  return {
    text: htmlToText(sliceContentRegion(html, regionTags)).slice(0, TEXT_MAX),
    headlineHint,
    avatarUrl: ogImage && /^https?:\/\//i.test(ogImage) && !isGenericShareImage(ogImage) ? ogImage : null,
  };
}

/** Verilen public profil URL'ini tarayıcı-UA ile çeker; host doğrulaması çağıranda. */
export async function fetchHtmlProfile(
  target: string,
  hostPattern: RegExp,
  regionTags: readonly string[] = ["main"],
): Promise<HtmlProfileSource> {
  const res = await fetch(target, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      "user-agent": UA,
      accept: "text/html,application/xhtml+xml",
      "accept-language": "en-US,en;q=0.9",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  // Güvenlik: yönlendirme sonrası bile beklenen alan adında kalmalıyız.
  let finalHost = "";
  try { finalHost = new URL(res.url).hostname.toLowerCase(); } catch { throw new Error("bad_final_url"); }
  if (!hostPattern.test(finalHost)) throw new Error("unexpected_host");
  return normalizeHtmlProfile(await res.text(), regionTags);
}

export function fetchFreelancerProfile(username: string): Promise<HtmlProfileSource> {
  return fetchHtmlProfile(
    `https://www.freelancer.com/u/${encodeURIComponent(username)}`,
    /(^|\.)freelancer\.[a-z.]{2,10}$/,
    REGION_TAGS.freelancer,
  );
}

export function fetchPeopleperhourProfile(path: string): Promise<HtmlProfileSource> {
  return fetchHtmlProfile(
    `https://www.peopleperhour.com${path}`,
    /(^|\.)peopleperhour\.com$/,
    REGION_TAGS.peopleperhour,
  );
}
