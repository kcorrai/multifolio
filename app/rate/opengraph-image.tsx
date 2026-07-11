import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/og-image";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Freelance rate calculator";

export default function Image() {
  return renderOgImage({
    eyebrow: "Free tool",
    title: "What rate should you charge?",
    subtitle: "Work backwards from your income goal to the hourly and day rate you need.",
  });
}
