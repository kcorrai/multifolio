// /p/[slug]/recommend — public müşteri yorum formu. Owner bu linki paylaşır; müşteri
// yorum bırakır (pending), owner dashboard'dan onaylar → public portfolyoda görünür.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, Quote } from "lucide-react";
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
    <div
      style={{ ...vars, fontFamily: "var(--pf-body-font)" }}
      className="min-h-screen bg-[var(--pf-bg)] text-[var(--pf-text)]"
    >
      <div className="mx-auto flex max-w-lg flex-col px-6 py-14 sm:py-20">
        {/* Portfolyoya dönüş — uzun headline tek satıra kırpılır (taşma bug'ı düzeldi). */}
        <Link
          href={`/p/${slug}`}
          className="group mb-8 inline-flex max-w-full items-center gap-1.5 text-xs font-semibold hover:underline"
          style={{ color: accentHex }}
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:-translate-x-0.5" />
          <span className="truncate">{owner.headline}</span>
        </Link>

        {/* Cilalı kart: portfolyo yüzey/kenarlık tokenları → görsel kopukluk yok. */}
        <div
          className="rounded-3xl border p-6 shadow-xl sm:p-8"
          style={{ background: "var(--pf-surface)", borderColor: "var(--pf-border)" }}
        >
          <div className="mb-6 space-y-3">
            <span
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{ background: `${accentHex}1f`, color: accentHex }}
            >
              <Quote className="h-5 w-5" />
            </span>
            <h1
              className="text-2xl font-extrabold tracking-tight sm:text-3xl"
              style={{ fontFamily: "var(--pf-heading-font)" }}
            >
              {t("title")}
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "var(--pf-muted)" }}>{t("subtitle")}</p>
          </div>
          <RecommendForm slug={slug} accentHex={accentHex} />
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: "var(--pf-muted)" }}>
          {t("poweredBy")}{" "}
          <Link href="/" className="font-semibold hover:underline" style={{ color: accentHex }}>Multifolio</Link>
        </p>
      </div>
    </div>
  );
}
