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
      out.push({ url, caption: (item.title ?? "").slice(0, 120), hidden: false });
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
      .map((im) => ({ url: im.url, caption: (im.caption || p.title || "").slice(0, 120), hidden: false }));
    if (images.length === 0) continue;
    out.push({
      title: (p.title ?? "").slice(0, 200),
      role: (p.role ?? "").slice(0, 200),
      description: (p.description ?? "").slice(0, 4000),
      skills: (p.skills ?? []).slice(0, 30),
      images,
      hidden: false,
    });
    if (out.length >= 12) break;
  }
  return out;
}

// ── Öğe bazlı gizleme (küratörlük) ───────────────────────────────────────────
// Galeri ve proje grupları HER üretimde (generate) ve HER kaydetmede (PUT senkron)
// profilden yeniden kurulur. Kullanıcının "bunu gösterme" seçimi bu yeniden kurulumda
// kaybolmasın diye eski listedeki `hidden` bayrağı anahtar eşleşmesiyle taşınır —
// tema ve iletişim CTA'sının korunduğu desenin aynısı.

type UnknownRecord = Record<string, unknown>;

// Kayıtlı içerik jsonb'den gelir → şekli garanti değil; tolerant okuma.
function asRecords(value: unknown): UnknownRecord[] {
  return Array.isArray(value)
    ? value.filter((v): v is UnknownRecord => typeof v === "object" && v !== null)
    : [];
}

// Bir proje grubunun kimliği: normalize başlık; başlıksız gruplarda ilk görselin url'i
// (görselsiz grup zaten üretilmiyor → anahtar boş kalmaz).
function groupKey(title: string, firstImageUrl: string): string {
  return title.trim().toLowerCase() || firstImageUrl;
}

// Eski galeri listesindeki gizleme seçimlerini yeni listeye taşır (url eşleşmesi).
export function carryGalleryHidden(
  next: PortfolioMedia["gallery"],
  previous: unknown,
): PortfolioMedia["gallery"] {
  const wasHidden = new Set<string>();
  for (const item of asRecords(previous)) {
    if (item.hidden === true && typeof item.url === "string") wasHidden.add(item.url);
  }
  if (wasHidden.size === 0) return next;
  return next.map((item) => (wasHidden.has(item.url) ? { ...item, hidden: true } : item));
}

// Eski proje gruplarındaki gizleme seçimlerini yeni gruplara taşır (grup: başlık,
// grup içi görsel: url). Grup başlığı değişirse seçim düşer — kabul edilebilir:
// yeniden görünür olur, sessizce yanlış projeyi gizlemekten iyidir.
export function carryProjectGroupHidden(
  next: PortfolioMedia["projectGroups"],
  previous: unknown,
): PortfolioMedia["projectGroups"] {
  const hiddenGroups = new Set<string>();
  const hiddenImages = new Set<string>();
  for (const group of asRecords(previous)) {
    const images = asRecords(group.images);
    const firstUrl = typeof images[0]?.url === "string" ? (images[0].url as string) : "";
    const key = groupKey(typeof group.title === "string" ? group.title : "", firstUrl);
    if (group.hidden === true && key) hiddenGroups.add(key);
    for (const image of images) {
      if (image.hidden === true && typeof image.url === "string") hiddenImages.add(image.url);
    }
  }
  if (hiddenGroups.size === 0 && hiddenImages.size === 0) return next;
  return next.map((group) => ({
    ...group,
    hidden: hiddenGroups.has(groupKey(group.title, group.images[0]?.url ?? "")),
    images: group.images.map((im) => (hiddenImages.has(im.url) ? { ...im, hidden: true } : im)),
  }));
}

// Public render'da gösterilecek galeri (editör TÜM öğeleri görür, public gizlileri değil).
export function visibleGallery(gallery: PortfolioMedia["gallery"]): PortfolioMedia["gallery"] {
  return gallery.filter((item) => !item.hidden);
}

// Public render'da gösterilecek proje grupları: gizli gruplar + gizli görseller elenir,
// tüm görselleri gizlenen grup da düşer (görselsiz proje kartı anlamsız).
export function visibleProjectGroups(
  groups: PortfolioMedia["projectGroups"],
): PortfolioMedia["projectGroups"] {
  return groups
    .filter((group) => !group.hidden)
    .map((group) => ({ ...group, images: group.images.filter((im) => !im.hidden) }))
    .filter((group) => group.images.length > 0);
}
