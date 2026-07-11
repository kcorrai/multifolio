import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/og-image";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Turkey freelancer tax guide";

export default function Image() {
  return renderOgImage({
    eyebrow: "Free tool",
    title: "Turkey freelancer tax, simplified",
    subtitle: "Estimate your Turkish freelance tax and what actually lands in your pocket.",
  });
}
