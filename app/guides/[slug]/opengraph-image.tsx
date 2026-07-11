import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/og-image";
import { getGuide } from "@/lib/guides/content";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Multifolio freelance guide";

// Rehber detay OG'si — başlık slug'ın içeriğinden (EN; OG rotasında locale yok).
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getGuide(slug)?.en;
  return renderOgImage({
    eyebrow: "Guide",
    title: c?.title ?? "Freelance guide",
    subtitle: c?.description,
  });
}
