import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

// Arama motoru kuralları: public sayfalar taranır; özel/işlevsel yollar hariç.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/api/", "/auth/", "/checkout"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
