import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/og-image";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Multifolio — one profile, every freelance platform";

export default function Image() {
  // Pazar-nötr (statik OG görseli tüm pazarlarda aynı) → platform sayma, jenerik.
  return renderOgImage({
    title: "Manage your freelance career from one platform",
    subtitle: "One profile. AI adapts it for LinkedIn, Upwork, Fiverr and more — builds your CV, portfolio and finds jobs.",
  });
}
