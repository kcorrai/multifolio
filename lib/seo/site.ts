// SEO/metadata için mutlak site URL'i (SAF sabit). metadataBase, sitemap, robots
// ve OG görselleri bunu kullanır. NEXT_PUBLIC_APP_URL verilirse o, yoksa prod URL.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://multifolio-ecru.vercel.app"
).replace(/\/$/, "");

export const SITE_NAME = "Multifolio";

// Herkese açık (indekslenebilir) rotalar — sitemap için tek kaynak.
export const PUBLIC_ROUTES: string[] = [
  "/",
  "/analyze",
  "/earnings",
  "/rate",
  "/proposal-checker",
  "/compare",
  "/vergi",
  "/pricing",
  "/login",
  "/signup",
  "/privacy",
  "/terms",
  "/kvkk",
  "/contact",
  "/extension/privacy",
];
