import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/og-image";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Free proposal & cover letter checker";

export default function Image() {
  return renderOgImage({
    eyebrow: "Free tool",
    title: "Is your proposal good enough to win?",
    subtitle: "Score your cover letter against what actually wins clients — instantly, no sign-up.",
  });
}
