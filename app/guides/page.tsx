// Rehber index'i (public SEO) — tüm cornerstone rehberleri listeler.
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GUIDES } from "@/lib/guides/content";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("guides");
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: { canonical: "/guides" } };
}

export default async function GuidesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  const locale = await getLocale();
  const t = await getTranslations("guides");

  return (
    <div className="sp-page">
      <SiteHeader isLoggedIn={isLoggedIn} />

      <section className="mx-auto max-w-3xl px-8 pt-20 pb-6 text-center space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FA531C]">{t("eyebrow")}</p>
        <h1 className="text-4xl lg:text-5xl font-extrabold leading-[1.1] tracking-tight">{t("title")}</h1>
        <p className="text-lg text-slate-500 dark:text-[#6B4A3C] leading-relaxed max-w-xl mx-auto font-medium">{t("subtitle")}</p>
      </section>

      <section className="mx-auto max-w-3xl px-8 py-8 grid sm:grid-cols-2 gap-5">
        {GUIDES.map((g) => {
          const c = locale === "tr" ? g.tr : g.en;
          return (
            <Link
              key={g.slug}
              href={`/guides/${g.slug}`}
              className="group rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#FFFAF3] p-6 space-y-3 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-[#FA531C]/30"
            >
              <div className="h-10 w-10 rounded-xl bg-[#FA531C]/10 border border-[#FA531C]/20 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-[#FA531C]" />
              </div>
              <h2 className="font-bold text-slate-900 dark:text-white leading-snug">{c.title}</h2>
              <p className="text-sm text-slate-500 dark:text-[#6B4A3C] leading-relaxed font-medium">{c.description}</p>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-[#FA531C]">
                {t("readingMinutes", { count: g.readingMinutes })} <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          );
        })}
      </section>

      <SiteFooter />
    </div>
  );
}
