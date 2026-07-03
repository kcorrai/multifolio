// Saf çıkarım yardımcıları — DOM'a dokunmaz, vitest ile test edilir.
// content.ts bunları tarayıcı bağlamında çağırır.

export type ProfilePlatform = "upwork" | "fiverr" | "linkedin";

// Fiverr'da kullanıcı adları kök yolda yaşar (fiverr.com/<username>) — profil
// OLMAYAN bilinen kök yollar burada elenir. Kaçak olursa zararsız: sayfada profil
// DOM işareti aranır ve import anlamsız metinde zaten reddedilir.
const FIVERR_RESERVED = new Set([
  "search", "categories", "category", "gigs", "gig", "s", "stories", "resources",
  "login", "logout", "join", "start_selling", "become-a-seller", "dashboard",
  "inbox", "messages", "orders", "notifications", "settings", "account",
  "terms_of_service", "privacy_policy", "intellectual_property", "support",
  "support_center", "community", "forum", "blog", "guides", "learn", "events",
  "pro", "business", "enterprise", "logo-maker", "workspace", "seller_dashboard",
  "users", "levels", "news", "press", "careers", "about", "team", "partnerships",
  "affiliates", "invite", "referral", "collections", "lists", "payments", "billing",
]);

/** Host+path'ten profil sayfası platformunu tespit eder; profil değilse null. */
export function detectProfilePage(host: string, pathname: string): ProfilePlatform | null {
  const h = host.toLowerCase();
  const path = pathname.replace(/\/+$/, "") || "/";

  if (h === "www.upwork.com" || h === "upwork.com") {
    // Klasik ~hex id, yeni slug ve kısa /fl/ biçimleri. Alt sayfalar (ör.
    // /freelancers/~id/portfolio) da profil sayılır — ana içerik yine profil.
    if (/^\/freelancers\/~[0-9a-f]{6,}(\/|$)/i.test(path)) return "upwork";
    if (/^\/freelancers\/[a-z0-9][a-z0-9-]*$/i.test(path)) return "upwork";
    if (/^\/fl\/[a-z0-9][a-z0-9-]*(\/|$)/i.test(path)) return "upwork";
    return null;
  }

  if (h === "www.fiverr.com" || h === "fiverr.com") {
    const m = /^\/(?:users\/)?([a-z0-9_]{2,})$/i.exec(path);
    if (!m) return null;
    if (FIVERR_RESERVED.has(m[1].toLowerCase())) return null;
    return "fiverr";
  }

  // LinkedIn: /in/{username} profil sayfaları (yerel alt alan adları dahil).
  // Login'li sayfa public ld+json'da olmayan skills bölümünü de metin olarak taşır.
  if (h === "linkedin.com" || h.endsWith(".linkedin.com")) {
    if (/^\/in\/[A-Za-z0-9._%-]{2,100}(\/|$)/.test(path)) return "linkedin";
    return null;
  }

  return null;
}

/** Metni sunucu şemasının tavanına kırpar (sunucu AI öncesi 20k'ya ayrıca kırpar). */
export function clampText(text: string, max = 50_000): string {
  const t = text.trim();
  return t.length > max ? t.slice(0, max) : t;
}

/** Görsel URL adaylarını süzer: yalnız https, tekrarsız, svg/data:/ikon-boyutu elenir. */
export function pickImageUrls(candidates: string[], max = 12): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of candidates) {
    const url = (raw ?? "").trim();
    if (!/^https:\/\//i.test(url)) continue;
    if (url.length > 1000) continue; // sunucu httpUrl(1000) tavanı
    if (/\.svg(\?|#|$)/i.test(url)) continue;
    if (/(sprite|favicon|logo|icon|avatar-placeholder|1x1|pixel)/i.test(url)) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    out.push(url);
    if (out.length >= max) break;
  }
  return out;
}
