import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/og-image";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Freelance guides";

export default function Image() {
  return renderOgImage({
    eyebrow: "Guides",
    title: "Freelance guides",
    subtitle: "Short, practical playbooks to win more work — with the free tools to apply them.",
  });
}
