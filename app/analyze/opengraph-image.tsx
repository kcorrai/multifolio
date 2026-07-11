import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/og-image";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Free freelancer profile check";

export default function Image() {
  return renderOgImage({
    eyebrow: "Free tool",
    title: "How strong is your freelancer profile?",
    subtitle: "Paste your profile and get an instant AI score — including whether it passes Upwork's bar.",
  });
}
