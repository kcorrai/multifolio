import type { MetadataRoute } from "next";
import { SITE_URL, PUBLIC_ROUTES } from "@/lib/seo/site";

// Herkese açık rotaların sitemap'i (tek kaynak: PUBLIC_ROUTES). Google keşfi.
const HIGH_PRIORITY = /^\/(analyze|earnings|rate|proposal-checker|compare|pricing)$/;

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route === "/" ? "" : route}`,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : HIGH_PRIORITY.test(route) ? 0.8 : 0.5,
  }));
}
