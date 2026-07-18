// We Work Remotely ücretsiz RSS adaptörü. ToS: kaynağa (ilan link'ine) attribution
// gerekir — url alanı WWR'ye gider, UI'da kaynak rozeti gösterilir. KATEGORİ-FİLTRELİ
// feed'ler kullanılır (programming + design) → firehose değil, yalnız kitleye uygun
// ilanlar (feed alaka koruması; Arbeitnow/Himalayas dersi). Bağımlılıksız regex XML
// parse (repo'da XML lib yok). fetch() ağ yapar; parse + normalize saf (test edilebilir).
import { htmlToText } from "@/lib/import/text";
import type { PoolJobUpsert, ScrapeSource } from "@/lib/scrape/types";

// Yalnız yazılım + tasarım kategori feed'leri (WWR bu URL'lerle sunucu-taraflı filtreler).
const WWR_FEEDS = [
  "https://weworkremotely.com/categories/remote-programming-jobs.rss",
  "https://weworkremotely.com/categories/remote-design-jobs.rss",
] as const;

/** RSS <item> bloğundan tek tag'in metnini çıkarır (CDATA sarmalını soyar). */
function extractTag(itemXml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i");
  const m = itemXml.match(re);
  if (!m) return null;
  let v = m[1].trim();
  const cdata = v.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  if (cdata) v = cdata[1].trim();
  return v;
}

/** RFC-822 pubDate'i ISO'ya çevirir; parse edilemezse null (satır atlanmaz). */
function toIso(pubDate: string | null): string | null {
  if (!pubDate) return null;
  const t = Date.parse(pubDate);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

/** URL'den kısa, kararlı external_id (son path segmenti/slug); çözülemezse tüm URL. */
function slugFromUrl(url: string): string {
  try {
    const segs = new URL(url).pathname.split("/").filter(Boolean);
    return segs[segs.length - 1] || url;
  } catch {
    return url;
  }
}

/** RSS gövdesini ham item objelerine ayırır (SAF — I/O yok, test edilebilir). */
export function parseWwrItems(xml: string): unknown[] {
  const items: unknown[] = [];
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
  for (const block of blocks) {
    items.push({
      title: extractTag(block, "title"),
      link: extractTag(block, "link") ?? extractTag(block, "guid"),
      description: extractTag(block, "description"),
      region: extractTag(block, "region"),
      pubDate: extractTag(block, "pubDate"),
    });
  }
  return items;
}

interface WwrRawItem {
  title: unknown;
  link: unknown;
  description: unknown;
  region: unknown;
  pubDate: unknown;
}

export function normalizeWeWorkRemotely(raw: unknown): PoolJobUpsert | null {
  if (typeof raw !== "object" || raw === null) return null;
  const j = raw as WwrRawItem;
  // Zorunlu: title + link (external_id/url kaynağı). Yoksa atla.
  if (typeof j.title !== "string" || !j.title.trim()) return null;
  if (typeof j.link !== "string" || !j.link.trim()) return null;
  const region = typeof j.region === "string" ? j.region.trim() : "";
  // WWR description ÇİFT-kodlanmış: HTML, XML entity'leriyle escape edilmiş
  // (&lt;p&gt; = <p>). htmlToText entity'leri en sonda çözer → tek geçişte gerçek
  // tag'ler geri gelir. İki geçiş: 1. entity çöz (→ gerçek HTML), 2. tag'leri sök.
  const rawDesc = typeof j.description === "string" ? j.description : "";
  return {
    source: "weworkremotely",
    external_id: slugFromUrl(j.link),
    // Başlık "Company: Role" formatında gelir — bilgilendirici, olduğu gibi tutulur.
    title: j.title.trim(),
    description: htmlToText(htmlToText(rawDesc)),
    url: j.link,
    budget: null, // RSS maaş içermez
    // WWR per-ilan beceri vermez (yalnız tek kategori) → boş; relevance başlığa düşer.
    skills: [],
    client_country: region || null,
    client_spent: null,
    posted_at: toIso(typeof j.pubDate === "string" ? j.pubDate : null),
    // WWR RSS güvenilir istihdam-türü sinyali vermez → null (yanlış etiketlemektense boş).
    job_type: null,
  };
}

async function fetchWeWorkRemotely(): Promise<unknown[]> {
  // Kategori feed'leri bağımsız çekilir (biri patlasa diğeri gelir; allSettled).
  const settled = await Promise.allSettled(
    WWR_FEEDS.map(async (url) => {
      const res = await fetch(url, {
        headers: { accept: "application/rss+xml, application/xml, text/xml", "user-agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) throw new Error(`WWR HTTP ${res.status} (${url})`);
      return parseWwrItems(await res.text());
    }),
  );
  const items = settled.flatMap((s) => (s.status === "fulfilled" ? s.value : []));
  if (items.length === 0) {
    const firstErr = settled.find((s): s is PromiseRejectedResult => s.status === "rejected");
    if (firstErr) throw firstErr.reason;
  }
  return items;
}

export const weWorkRemotelySource: ScrapeSource = {
  id: "weworkremotely",
  fetch: fetchWeWorkRemotely,
  normalize: normalizeWeWorkRemotely,
};
