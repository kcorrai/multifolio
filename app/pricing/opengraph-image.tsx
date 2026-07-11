import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/og-image";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Multifolio pricing";

export default function Image() {
  return renderOgImage({
    eyebrow: "Pricing",
    title: "Simple, credit-based pricing",
    subtitle: "Pay only for what you use across all five platforms. No subscription, no expiry.",
  });
}
