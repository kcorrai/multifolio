import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/og-image";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Freelance net earnings calculator";

export default function Image() {
  return renderOgImage({
    eyebrow: "Free tool",
    title: "How much do you actually take home?",
    subtitle: "Your net freelance income after platform commission, transfer fees and tax.",
  });
}
