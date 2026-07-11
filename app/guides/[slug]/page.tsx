// SEO cornerstone rehber detayı (public). İçerik lib/guides/content.ts'ten
// locale'e göre; ilgili ücretsiz araca CTA. Article JSON-LD + per-sayfa metadata.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/seo/site";
import { GUIDES, getGuide } from "@/lib/guides/content";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  const locale = await getLocale();
  const c = locale === "tr" ? guide.tr : guide.en;
  return { title: `${c.title} — Multifolio`, description: c.description };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  const locale = await getLocale();
  const t = await getTranslations("guides");
  const c = locale === "tr" ? guide.tr : guide.en;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: c.title,
    description: c.description,
    author: { "@type": "Organization", name: "Multifolio" },
    publisher: { "@type": "Organization", name: "Multifolio" },
  };
  // Breadcrumb: Home → Guides → [rehber] (Google zengin sonuç kırıntısı).
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Multifolio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: t("eyebrow"), item: `${SITE_URL}/guides` },
      { "@type": "ListItem", position: 3, name: c.title, item: `${SITE_URL}/guides/${slug}` },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090A0F] text-slate-900 dark:text-white overflow-x-hidden">
      <JsonLd data={articleLd} />
      <JsonLd data={breadcrumbLd} />
      <SiteHeader isLoggedIn={isLoggedIn} />

      <article className="mx-auto max-w-2xl px-8 py-16">
        <Link href="/guides" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />{t("backToGuides")}
        </Link>

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00F0FF] mb-3">{t("eyebrow")}</p>
        <h1 className="text-4xl font-extrabold tracking-tight leading-[1.15]">{c.title}</h1>
        <p className="mt-3 text-lg text-slate-500 dark:text-[#94A3B8] font-medium leading-relaxed">{c.description}</p>
        <p className="mt-3 text-xs text-slate-400 dark:text-[#94A3B8]/60 font-medium">{t("readingMinutes", { count: guide.readingMinutes })}</p>

        <div className="mt-10 space-y-8">
          {c.sections.map((s) => (
            <section key={s.heading} className="space-y-3">
              <h2 className="text-xl font-bold tracking-tight">{s.heading}</h2>
              {s.body.map((p, i) => (
                <p key={i} className="text-[15px] text-slate-600 dark:text-[#94A3B8] leading-relaxed">{p}</p>
              ))}
            </section>
          ))}
        </div>

        {/* İlgili ücretsiz araca CTA (edinim hunisi) */}
        <div className="mt-12 rounded-2xl border border-[#00F0FF]/20 bg-[#00F0FF]/5 p-6 text-center space-y-3">
          <p className="text-base font-bold">{t("ctaTitle")}</p>
          <Link
            href={guide.toolHref}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#00F0FF] text-[#090A0F] font-bold text-sm px-5 py-2.5 hover:bg-[#00d8e8] transition-colors"
          >
            {t("ctaButton")}<ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </article>

      <SiteFooter />
    </div>
  );
}
