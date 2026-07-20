// Guru.com public profil içe aktarma (guru.com/freelancers/{slug}).
//
// 2026-07-20 canlı ölçüm: tarayıcı-UA'lı düz fetch 200 dönüyor; sayfa ld+json
// `ProfilePage` yayınlıyor ve profil verisi `mainEntity` altındaki `Person`'da:
//   name / description (bio — İÇİNDE <br /> var, temizlenmeli) / image / identifier
// Başlık (tagline) ld+json'da YOK ama og:description'ın başında duruyor:
//   "{İsim} - {Başlık}{bio...} - Find and hire freelancers on Guru"
// → headline og:description'dan türetilir, bio ld+json'dan gelir.
//
// NOT: guru.com/robots.txt düz istemciye 406 döner (MIME pazarlığı) ama profil
// sayfaları normal Accept başlığıyla 200 dönüyor — engel profil yolunda değil.
//
// fetch() ağ yapar; normalize* SAF ve test edilebilir (linkedin.ts deseni).
import type { ProfileDraft } from "@/lib/validation/schemas/profile-import";
import {
  extractJsonLdNodes,
  personNodes,
  personImage,
  metaContent,
  stripHtml,
} from "./ldjson";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const FETCH_TIMEOUT_MS = 10_000;

/** guru.com/freelancers/{slug} → slug (profil değilse null). */
export function parseGuruSlug(url: string): string | null {
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  if (!/(^|\.)guru\.com$/i.test(u.hostname)) return null;
  const segments = u.pathname.split("/").filter(Boolean);
  // /freelancers/{slug} — /d/freelancers/... dizin sayfasıdır, profil değil.
  if (segments.length !== 2 || segments[0].toLowerCase() !== "freelancers") return null;
  const slug = segments[1];
  if (!/^[A-Za-z0-9._-]{2,120}$/.test(slug)) return null;
  return slug;
}

export interface GuruProfile {
  slug: string;
  draft: ProfileDraft;
  avatarUrl: string | null;
}

/**
 * og:description'dan başlığı ayıklar.
 * Biçim: "{İsim} - {Başlık}{bio'nun ilk ~200 karakteri} - Find and hire freelancers on Guru"
 *
 * Kritik detay (canlı ölçüldü): başlık ile bio ARASINDA AYRAÇ YOK — birbirine yapışık
 * gelir ("...Scale Without ChaosIf you are unsure where to start..."). Bu yüzden bio
 * ld+json'dan biliniyorken og metninden ÇIKARILIR: bio'nun başlangıcı og içinde nerede
 * geçiyorsa başlık orada biter. Noktalama/büyük-küçük harf sınırına güvenilemez.
 */
export function guruHeadlineFromOg(ogDescription: string, name: string, bio = ""): string {
  let s = ogDescription.replace(/\s+/g, " ").trim();
  if (!s) return "";
  s = s.replace(/\s*-\s*Find and hire freelancers on Guru\s*$/i, "");
  if (name) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    s = s.replace(new RegExp(`^${escaped}\\s*-\\s*`, "i"), "");
  }
  // Bio'nun baş kısmı og'da nerede başlıyorsa başlık orada biter.
  const bioHead = bio.replace(/\s+/g, " ").trim().slice(0, 30);
  if (bioHead.length >= 12) {
    const idx = s.indexOf(bioHead);
    if (idx > 0) s = s.slice(0, idx);
  }
  return s.trim().replace(/[\s-]+$/, "").slice(0, 120);
}

/**
 * Bio yazmamış profillerde Guru kendi KALIP metnini basıyor:
 * "Review the skills and services offered by {İsim} on Guru."
 * Bu bir özet değil — kullanıcının profiline yazılırsa çöp olur, elenir.
 */
export function isGuruBoilerplate(description: string): boolean {
  return /^review the skills and services offered by .+ on guru\.?$/i.test(description.trim());
}

/** Ham HTML → yapılandırılmış GuruProfile. Anlamlı veri yoksa null. */
export function normalizeGuruProfile(html: string, slug: string): GuruProfile | null {
  const persons = personNodes(extractJsonLdNodes(html));
  const person = persons.find((p) => p.description || p.name) ?? persons[0] ?? null;
  if (!person) return null;

  const name = typeof person.name === "string" ? person.name.trim() : "";
  const rawBio = typeof person.description === "string" ? stripHtml(person.description) : "";
  const bio = isGuruBoilerplate(rawBio) ? "" : rawBio;
  const headline = guruHeadlineFromOg(metaContent(html, "og:description"), name, bio);

  const summary = bio.slice(0, 2000);
  // headline yalnız isimden ibaretse gerçek bir başlık değil → yok say.
  const headlineIsJustName = !!name && headline.trim().toLowerCase() === name.toLowerCase();
  const finalHeadline = (headlineIsJustName ? "" : headline || bio.split(/(?<=[.!?])\s/)[0] || "").slice(0, 120);
  // İsim dışında hiçbir şey yoksa içe aktarmaya değer veri yok demektir.
  if (!finalHeadline && !summary) return null;

  return {
    slug,
    draft: { headline: finalHeadline, summary, skills: [] },
    avatarUrl: personImage(person.image) ?? (metaContent(html, "og:image") || null),
  };
}

/** Slug'dan public Guru profilini çeker; ayrıştırılamazsa null. */
export async function fetchGuruProfile(slug: string): Promise<GuruProfile | null> {
  const target = `https://www.guru.com/freelancers/${encodeURIComponent(slug)}`;
  const res = await fetch(target, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      "user-agent": UA,
      accept: "text/html,application/xhtml+xml",
      "accept-language": "en-US,en;q=0.9",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Guru HTTP ${res.status}`);
  let finalHost = "";
  try { finalHost = new URL(res.url).hostname.toLowerCase(); } catch { throw new Error("bad_final_url"); }
  if (!/(^|\.)guru\.com$/.test(finalHost)) throw new Error("unexpected_host");

  return normalizeGuruProfile(await res.text(), slug);
}
