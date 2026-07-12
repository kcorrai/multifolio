import type { MetadataRoute } from "next";
import { SITE_URL, PUBLIC_ROUTES } from "@/lib/seo/site";
import { GUIDES } from "@/lib/guides/content";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Herkese açık rotaların sitemap'i (PUBLIC_ROUTES + rehberler + yayınlanmış portfolyolar).
// Google keşfi. Portfolyolar service-role ile çekilir (public select politikası var ama
// admin client sitemap'te oturum gerektirmeden okur); DB hatası sitemap'i düşürmez.
const HIGH_PRIORITY = /^\/(analyze|earnings|rate|proposal-checker|ats-check|compare|pricing)$/;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  let portfolioRoutes: MetadataRoute.Sitemap = [];
  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase.from("portfolios").select("slug").eq("published", true);
    portfolioRoutes = (data ?? [])
      .filter((p): p is { slug: string } => typeof p.slug === "string" && p.slug.length > 0)
      .map((p) => ({
        url: `${SITE_URL}/p/${p.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
  } catch {
    // Sitemap DB olmadan da geçerli kalmalı (build/edge güvenliği).
  }

  return [...staticRoutes, ...guideRoutes, ...portfolioRoutes];
}
