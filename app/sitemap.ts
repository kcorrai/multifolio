import type { MetadataRoute } from "next";
import { SITE_URL, PUBLIC_ROUTES } from "@/lib/seo/site";
import { GUIDES } from "@/lib/guides/content";

// Herkese açık rotaların sitemap'i (PUBLIC_ROUTES + rehber detayları). Google keşfi.
const HIGH_PRIORITY = /^\/(analyze|earnings|rate|proposal-checker|ats-check|compare|pricing)$/;

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = PUBLIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route === "/" ? "" : route}`,
    changeFrequency: (route === "/" ? "weekly" : "monthly") as "weekly" | "monthly",
    priority: route === "/" ? 1 : HIGH_PRIORITY.test(route) ? 0.8 : 0.5,
  }));
  const guideRoutes = GUIDES.map((g) => ({
    url: `${SITE_URL}/guides/${g.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  return [...staticRoutes, ...guideRoutes];
}
