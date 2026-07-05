// /p/[slug]/recommend — public müşteri yorum formu. Owner bu linki paylaşır; müşteri
// yorum bırakır (pending), owner dashboard'dan onaylar → public portfolyoda görünür.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { RecommendForm } from "@/components/testimonials/recommend-form";
import { portfolioTheme, ACCENT_HEX, type PortfolioAccent, type PortfolioPreset } from "@/lib/portfolio/theme";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface OwnerInfo { headline: string; preset: PortfolioPreset; accent: PortfolioAccent }

// Owner başlığı + görsel temasını çeker → yorum formu portfolyoyla aynı görünsün
// (marka tutarlılığı: müşteri referans isterken görsel kopukluk olmasın).
async function fetchOwner(slug: string): Promise<OwnerInfo | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("portfolios")
    .select("content")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  const content = data?.content as { headline?: unknown; theme?: { preset?: unknown; accent?: unknown } } | null;
  const headline = content?.headline;
  if (typeof headline !== "string") return null;
  const preset = (content?.theme?.preset as PortfolioPreset) ?? "studio";
  const accent = (content?.theme?.accent as PortfolioAccent) ?? "blue";
  return { headline, preset, accent };
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("recommend");
  return { title: t("metaTitle"), robots: { index: false } };
}

export default async function RecommendPage({ params }: PageProps) {
  const { slug } = await params;
  const owner = await fetchOwner(slug);
  if (owner === null) notFound();

  const t = await getTranslations("recommend");
  const { vars } = portfolioTheme(owner.preset, owner.accent);
  const accentHex = ACCENT_HEX[owner.accent] ?? ACCENT_HEX.blue;

  return (
    <div style={vars} className="min-h-screen bg-[var(--pf-bg)] text-[var(--pf-text)]">
      <div className="mx-auto max-w-xl px-6 py-16 space-y-6">
        <div className="text-center space-y-2">
          <Link href={`/p/${slug}`} className="text-xs font-bold uppercase tracking-[0.2em] hover:underline" style={{ color: accentHex }}>
            {owner.headline}
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">{t("title")}</h1>
          <p className="text-sm" style={{ color: "var(--pf-muted)" }}>{t("subtitle")}</p>
        </div>
        <RecommendForm slug={slug} accentHex={accentHex} />
      </div>
    </div>
  );
}
