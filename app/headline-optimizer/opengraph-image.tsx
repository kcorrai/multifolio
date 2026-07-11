import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/og-image";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Free freelance headline optimizer";

export default function Image() {
  return renderOgImage({
    eyebrow: "Free tool",
    title: "Is your profile headline working?",
    subtitle: "Score your headline against what actually makes clients click — free, no sign-up.",
  });
}
