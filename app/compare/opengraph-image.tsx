import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/og-image";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Freelance platform net income comparison";

export default function Image() {
  return renderOgImage({
    eyebrow: "Free tool",
    title: "Same project — which platform pays most?",
    subtitle: "Compare your net take-home across Upwork, Fiverr, Bionluk and more, side by side.",
  });
}
