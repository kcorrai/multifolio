// Ücretsiz araç kataloğu (SAF veri — kopya i18n'de, burada yalnız kimlik+rota).
// Header nav'ı, çapraz-link bloğu, footer ve sitemap aynı listeyi okur; yeni bir
// araç eklerken TEK yer burasıdır.

export type ToolId = "rate" | "roi" | "ats" | "proposal" | "headline" | "analyze";

export interface ToolDef {
  id: ToolId;
  href: string;
  /** AI/sunucu çağrısı var mı — "5 runs an hour" bayrağı bunlara özel. */
  server?: boolean;
}

export const TOOLS: ToolDef[] = [
  { id: "rate", href: "/rate" },
  { id: "roi", href: "/roi" },
  { id: "ats", href: "/ats-check" },
  { id: "proposal", href: "/proposal-checker" },
  { id: "headline", href: "/headline-optimizer" },
  { id: "analyze", href: "/analyze", server: true },
];

export function toolByHref(href: string): ToolDef | undefined {
  return TOOLS.find((t) => t.href === href);
}

/** Çapraz-link bloğunda gösterilecek diğer araçlar (mevcut olan hariç, ilk 3). */
export function otherTools(currentHref: string, count = 3): ToolDef[] {
  return TOOLS.filter((t) => t.href !== currentHref).slice(0, count);
}
