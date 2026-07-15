import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/og-image";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Upwork Connects ROI calculator";

export default function Image() {
  return renderOgImage({
    eyebrow: "Free tool",
    title: "Are your Connects paying off?",
    subtitle: "See your return on every Connect you spend — and the win rate you need to break even.",
  });
}
