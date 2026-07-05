// /p/[slug]/recommend — public müşteri yorum formu. Owner bu linki paylaşır; müşteri
// yorum bırakır (pending), owner dashboard'dan onaylar → public portfolyoda görünür.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { RecommendForm } from "@/components/testimonials/recommend-form";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function fetchOwnerHeadline(slug: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("portfolios")
    .select("content")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  const headline = (data?.content as { headline?: unknown } | null)?.headline;
  return typeof headline === "string" ? headline : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const t = await getTranslations("recommend");
  return { title: t("metaTitle"), robots: { index: false } };
}

export default async function RecommendPage({ params }: PageProps) {
  const { slug } = await params;
  const headline = await fetchOwnerHeadline(slug);
  if (headline === null) notFound();

  const t = await getTranslations("recommend");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090A0F] text-slate-900 dark:text-white">
      <div className="mx-auto max-w-xl px-6 py-16 space-y-6">
        <div className="text-center space-y-2">
          <Link href={`/p/${slug}`} className="text-xs font-bold uppercase tracking-[0.2em] text-[#00F0FF] hover:underline">
            {headline}
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <RecommendForm slug={slug} />
      </div>
    </div>
  );
}
