// SAF portfolyo medya kurucuları (AI/I/O yok, vitest'li). Profil/platform görsellerini
// portfolyo galerisine ve yapılandırılmış projeleri "proje-proje" gösterim gruplarına
// çevirir. Hem generate route (AI üretimi) hem PUT route (ücretsiz senkron) kullanır →
// tek doğru kaynak, tekrar yok.
import type { PortfolioMedia } from "@/lib/validation/schemas/portfolio";
import type { PortfolioItem, ProfileProject } from "@/lib/validation/schemas/profile";

// Profil/platform görsellerini portfolyo galerisine çevirir (url'siz atlanır,
// caption 120'ye kırpılır, url'ye göre dedup, 24 ile sınırlı).
export function buildGallery(...sources: (PortfolioItem[] | null | undefined)[]): PortfolioMedia["gallery"] {
  const seen = new Set<string>();
  const out: PortfolioMedia["gallery"] = [];
  for (const list of sources) {
    for (const item of list ?? []) {
      const url = item?.imageUrl?.trim();
      if (!url || seen.has(url)) continue;
      seen.add(url);
      out.push({ url, caption: (item.title ?? "").slice(0, 120) });
      if (out.length >= 24) return out;
    }
  }
  return out;
}

// Yapılandırılmış projeleri "proje-proje" gösterim grupları'na çevirir (her grup =
// başlık + rol + açıklama + beceriler + görselleri). Görselsiz proje atlanır (görsel
// gösterim modu); 12 grup / grup başına 24 görselle sınırlı. role/description/skills
// public sayfadaki proje detay modalını (Upwork tarzı) besler.
export function buildProjectGroups(projects: ProfileProject[] | null | undefined): PortfolioMedia["projectGroups"] {
  const out: PortfolioMedia["projectGroups"] = [];
  for (const p of projects ?? []) {
    const images = (p.images ?? [])
      .filter((im) => im?.url?.trim())
      .slice(0, 24)
      .map((im) => ({ url: im.url, caption: (im.caption || p.title || "").slice(0, 120) }));
    if (images.length === 0) continue;
    out.push({
      title: (p.title ?? "").slice(0, 200),
      role: (p.role ?? "").slice(0, 200),
      description: (p.description ?? "").slice(0, 4000),
      skills: (p.skills ?? []).slice(0, 30),
      images,
    });
    if (out.length >= 12) break;
  }
  return out;
}
