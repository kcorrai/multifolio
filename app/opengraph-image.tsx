import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/og-image";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Multifolio — one profile, five platforms";

export default function Image() {
  return renderOgImage({
    title: "Manage your freelance career from one platform",
    subtitle: "One profile. AI adapts it for LinkedIn, Upwork, Fiverr, Bionluk and Armut.",
  });
}
