// Programmatic SEO (pSEO) verisi: platform × rol landing sayfaları için SAF veri.
// Amaç uzun-kuyruk arama trafiği ("Upwork'te React geliştirici" vb.) → ücretsiz
// araç + kayıt hunisi. İçerik ŞABLON ama platform+rol özgüsüyle anlamlı (thin-content
// değil). Platform etiketleri lib/ai/platforms'tan; rol verisi iki dilli.
import { PLATFORM_IDS, PLATFORMS, type PlatformId } from "@/lib/ai/platforms";

export interface PseoRole {
  id: string;
  en: string;
  tr: string;
  skills: string[];
  focusEn: string;
  focusTr: string;
}

// Yüksek-niyet, arama hacmi olan freelance rolleri.
export const PSEO_ROLES: PseoRole[] = [
  { id: "web-developer", en: "Web Developer", tr: "Web Geliştirici", skills: ["React", "Next.js", "Node.js", "TypeScript", "APIs"], focusEn: "fast, reliable web apps", focusTr: "hızlı ve sağlam web uygulamaları" },
  { id: "designer", en: "Designer", tr: "Tasarımcı", skills: ["UI/UX", "Figma", "Branding", "Design Systems", "Prototyping"], focusEn: "clean, on-brand product design", focusTr: "temiz, markaya uygun ürün tasarımı" },
  { id: "writer", en: "Content Writer", tr: "İçerik Yazarı", skills: ["Copywriting", "SEO", "Editing", "Blogging"], focusEn: "clear copy that converts", focusTr: "dönüştüren net metinler" },
  { id: "digital-marketer", en: "Digital Marketer", tr: "Dijital Pazarlamacı", skills: ["SEO", "Paid Ads", "Analytics", "Email", "Social"], focusEn: "measurable growth", focusTr: "ölçülebilir büyüme" },
  { id: "video-editor", en: "Video Editor", tr: "Video Editörü", skills: ["Premiere Pro", "After Effects", "Motion", "Color"], focusEn: "scroll-stopping edits", focusTr: "dikkat çeken kurgular" },
  { id: "virtual-assistant", en: "Virtual Assistant", tr: "Sanal Asistan", skills: ["Admin", "Research", "Scheduling", "Data Entry"], focusEn: "reliable day-to-day support", focusTr: "güvenilir günlük destek" },
];

export const PSEO_PLATFORMS: PlatformId[] = [...PLATFORM_IDS];

export function platformLabel(id: PlatformId): string {
  return PLATFORMS[id]?.label ?? id;
}

export function findRole(id: string): PseoRole | undefined {
  return PSEO_ROLES.find((r) => r.id === id);
}

export function isPseoPlatform(id: string): id is PlatformId {
  return (PLATFORM_IDS as readonly string[]).includes(id);
}

// Tüm platform×rol kombinasyonları (generateStaticParams + sitemap + hub).
export function pseoCombos(): { platform: PlatformId; role: string }[] {
  return PSEO_PLATFORMS.flatMap((platform) => PSEO_ROLES.map((r) => ({ platform, role: r.id })));
}
