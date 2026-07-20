// Public profil sayfalarına gömülü schema.org verisi için SAF yardımcılar (ağ YOK).
// LinkedIn / Contra / Guru üçü de `Person` düğümü yayınlıyor; şekil farklı ama
// alanlar aynı aileden. Platform fetcher'ları bu katmanı paylaşır.

export type Json = Record<string, unknown>;

export function toArray<T = unknown>(x: unknown): T[] {
  if (Array.isArray(x)) return x as T[];
  if (x === null || x === undefined) return [];
  return [x as T];
}

/**
 * HTML'deki TÜM ld+json bloklarını ayrıştırıp düz düğüm listesi döner.
 * `<script type="application/ld+json">` etiketinde nitelik sırası/ekstra nitelik
 * (id, nonce, data-*) siteden siteye değişiyor → tolerant eşleşme şart.
 * `@graph` düzleştirilir; `mainEntity` (Guru'nun ProfilePage sarmalayıcısı) açılır.
 */
export function extractJsonLdNodes(html: string): Json[] {
  const out: Json[] = [];
  const blocks = html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const m of blocks) {
    let data: unknown;
    try {
      data = JSON.parse(m[1].trim());
    } catch {
      continue; // bozuk blok diğerlerini engellemesin
    }
    for (const node of toArray<Json>(data)) {
      if (!node || typeof node !== "object") continue;
      const graph = toArray<Json>(node["@graph"]);
      const nodes = graph.length ? graph : [node];
      for (const n of nodes) {
        if (!n || typeof n !== "object") continue;
        out.push(n);
        // ProfilePage → mainEntity(Person) sarmalaması (Guru deseni).
        for (const inner of toArray<Json>(n.mainEntity)) {
          if (inner && typeof inner === "object") out.push(inner);
        }
      }
    }
  }
  return out;
}

/** Düğümler arasından `@type === "Person"` olanları süzer. */
export function personNodes(nodes: Json[]): Json[] {
  return nodes.filter((n) => toArray(n["@type"]).some((t) => String(t) === "Person"));
}

/** Person.image → mutlak https URL (string ya da ImageObject.contentUrl). */
export function personImage(image: unknown): string | null {
  const first = toArray(image)[0];
  const url =
    typeof first === "string"
      ? first
      : first && typeof first === "object"
        ? (first as Json).contentUrl ?? (first as Json).url
        : null;
  return typeof url === "string" && /^https?:\/\//i.test(url) ? url : null;
}

/** Person.address → "Şehir" ya da "Ülke" (string adres de kabul). */
export function personLocation(address: unknown): string {
  const a = toArray<Json | string>(address)[0];
  if (typeof a === "string") return a.trim();
  if (!a || typeof a !== "object") return "";
  const locality = typeof a.addressLocality === "string" ? a.addressLocality.trim() : "";
  const country = typeof a.addressCountry === "string" ? a.addressCountry.trim() : "";
  return locality || country;
}

/** HTML'den <meta property/name="..."> içeriğini okur (og:*, description, twitter:*). */
export function metaContent(html: string, key: string): string {
  const esc = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `<meta\\b[^>]*(?:property|name)=["']${esc}["'][^>]*content=["']([^"']*)["']`,
    "i",
  );
  const m = re.exec(html);
  if (m) return decodeEntities(m[1].trim());
  // content niteliği property'den ÖNCE gelen varyant.
  const re2 = new RegExp(
    `<meta\\b[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${esc}["']`,
    "i",
  );
  const m2 = re2.exec(html);
  return m2 ? decodeEntities(m2[1].trim()) : "";
}

/** Yaygın HTML varlıklarını çözer (meta içerikleri kaçışlı gelir). */
export function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&#x27;/gi, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));
}

/** ld+json description alanları HTML parçacığı taşıyabiliyor (Guru <br /> kullanıyor). */
export function stripHtml(s: string): string {
  return decodeEntities(
    s
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
