// Programmatic SEO: platform × rol landing sayfası (statik, generateStaticParams ile
// 30 sayfa). Uzun-kuyruk arama trafiği → ücretsiz araç + kayıt hunisi. İçerik ŞABLON ama
// platform+rol özgüsü (thin-content değil). Auth YOK → tam statik + hızlı + cache'lenebilir.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Layers, Gauge, Sparkles, ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JsonLd } from "@/components/seo/json-ld";
import { ToolCta } from "@/components/tool-cta";
import { PlatformLogo } from "@/components/platform-logo";
import { SITE_URL } from "@/lib/seo/site";
import { PSEO_ROLES, pseoCombos, findRole, isPseoPlatform, platformLabel } from "@/lib/pseo/data";
import type { PlatformId } from "@/lib/ai/platforms";

interface PageProps {
  params: Promise<{ platform: string; role: string }>;
}

export function generateStaticParams() {
  return pseoCombos();
}

// Rol etiketi UI diline göre (data iki dilli).
async function labels(platform: string, role: string) {
  const r = findRole(role);
  if (!r || !isPseoPlatform(platform)) return null;
  const locale = await getLocale();
  return { roleLabel: locale === "tr" ? r.tr : r.en, platformLabelText: platformLabel(platform), role: r, platform: platform as PlatformId };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { platform, role } = await params;
  const l = await labels(platform, role);
  if (!l) return {};
  const t = await getTranslations("pseo");
  const vars = { role: l.roleLabel, platform: l.platformLabelText };
  const url = `${SITE_URL}/freelance/${platform}/${role}`;
  return {
    title: t("metaTitle", vars),
    description: t("metaDescription", vars),
    alternates: { canonical: `/freelance/${platform}/${role}` },
    openGraph: { title: t("metaTitle", vars), description: t("metaDescription", vars), url, type: "article", siteName: "Multifolio" },
    twitter: { card: "summary_large_image", title: t("metaTitle", vars), description: t("metaDescription", vars) },
  };
}

export default async function FreelancePseoPage({ params }: PageProps) {
  const { platform, role } = await params;
  const l = await labels(platform, role);
  if (!l) notFound();
  const t = await getTranslations("pseo");
  const vars = { role: l.roleLabel, platform: l.platformLabelText };
  const current = `/freelance/${platform}/${role}`;

  const features = [
    { icon: Layers, title: t("featureAdaptTitle", vars), body: t("featureAdaptBody", vars), accent: "#00F0FF" },
    { icon: Gauge, title: t("featureScoreTitle", vars), body: t("featureScoreBody", vars), accent: "#a78bfa" },
    { icon: Sparkles, title: t("featureProposeTitle", vars), body: t("featureProposeBody", vars), accent: "#00F0FF" },
  ];
  const faqs = [
    { q: t("faqQ1", vars), a: t("faqA1", vars) },
    { q: t("faqQ2", vars), a: t("faqA2", vars) },
    { q: t("faqQ3", vars), a: t("faqA3", vars) },
  ];

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t("breadcrumbHome"), item: SITE_URL },
      { "@type": "ListItem", position: 2, name: t("breadcrumbHub"), item: `${SITE_URL}/freelance` },
      { "@type": "ListItem", position: 3, name: t("h1", vars), item: `${SITE_URL}${current}` },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090A0F] text-slate-900 dark:text-white overflow-x-hidden">
      <JsonLd data={faqLd} />
      <JsonLd data={breadcrumbLd} />
      <SiteHeader isLoggedIn={false} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-[400px] w-[400px] rounded-full bg-[#00F0FF]/6 blur-[100px]" />
          <div className="absolute right-1/4 top-10 h-[350px] w-[350px] rounded-full bg-violet-500/8 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-8 pt-20 pb-10 text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00F0FF]/25 bg-[#00F0FF]/8 px-3.5 py-1.5">
            <PlatformLogo platform={l.platform} size={14} />
            <span className="text-xs font-semibold text-slate-600 dark:text-white/70">{t("eyebrow", vars)}</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold leading-[1.1] tracking-tight">{t("h1", vars)}</h1>
          <p className="text-lg text-slate-500 dark:text-[#94A3B8] leading-relaxed max-w-xl mx-auto font-medium">{t("subtitle", vars)}</p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Link href={`/signup?ref=freelance-${platform}`} className="anim-neon-pulse inline-flex h-12 items-center rounded-xl bg-[#00F0FF] px-7 text-base font-bold text-[#090A0F] hover:bg-[#00d8e8] transition-colors">
              {t("ctaPrimary")} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/analyze" className="inline-flex h-12 items-center rounded-xl border border-violet-500/40 px-7 text-base font-semibold text-violet-500 dark:text-violet-400 hover:bg-violet-500/10 transition-colors">
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="mx-auto max-w-3xl px-8 py-10">
        <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#161923] p-6 sm:p-8">
          <h2 className="text-2xl font-bold tracking-tight">{t("problemTitle", vars)}</h2>
          <p className="mt-3 text-slate-500 dark:text-[#94A3B8] leading-relaxed font-medium">{t("problemBody", vars)}</p>
        </div>
      </section>

      {/* Nasıl yardımcı olur — 3 özellik */}
      <section className="mx-auto max-w-5xl px-8 py-8">
        <h2 className="text-center text-3xl font-extrabold tracking-tight mb-10">{t("helpTitle", vars)}</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#161923] p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center border" style={{ backgroundColor: `${f.accent}1a`, borderColor: `${f.accent}33` }}>
                <f.icon className="h-5 w-5" style={{ color: f.accent }} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">{f.title}</h3>
              <p className="text-sm text-slate-500 dark:text-[#94A3B8] leading-relaxed font-medium">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Skiller */}
      <section className="mx-auto max-w-3xl px-8 py-10">
        <h2 className="text-xl font-bold tracking-tight">{t("skillsTitle")}</h2>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-[#94A3B8] font-medium">{t("skillsBody", vars)}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {l.role.skills.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5 rounded-full border border-[#00F0FF]/25 bg-[#00F0FF]/8 px-3 py-1 text-sm font-semibold text-slate-700 dark:text-[#00F0FF]">
              <Check className="h-3.5 w-3.5 text-[#00F0FF]" />{s}
            </span>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-8 py-10">
        <h2 className="text-2xl font-extrabold tracking-tight mb-5">{t("faqTitle")}</h2>
        <div className="space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#161923] px-5 py-4">
              <summary className="flex items-center justify-between cursor-pointer list-none font-semibold">
                {f.q}
                <span className="ml-4 shrink-0 text-[#00F0FF] transition-transform group-open:rotate-45 text-xl leading-none">+</span>
              </summary>
              <p className="mt-3 text-sm text-slate-500 dark:text-[#94A3B8] leading-relaxed font-medium">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* İlgili ücretsiz araçlar + signup hunisi (reuse) */}
      <ToolCta current={current} isLoggedIn={false} />

      {/* Kapanış CTA */}
      <section className="mx-auto max-w-3xl px-8 pb-24 text-center">
        <div className="relative overflow-hidden rounded-3xl border border-[#00F0FF]/15 bg-white dark:bg-[#161923] px-8 py-14">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00F0FF]/6 blur-[80px]" />
          <div className="relative space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight">{t("finalTitle", vars)}</h2>
            <p className="mx-auto max-w-md text-slate-500 dark:text-[#94A3B8] font-medium">{t("finalBody")}</p>
            <Link href={`/signup?ref=freelance-${platform}`} className="anim-neon-pulse inline-flex h-12 items-center rounded-xl bg-[#00F0FF] px-8 text-base font-bold text-[#090A0F] hover:bg-[#00d8e8] transition-colors mt-1">
              {t("finalButton")} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />

      {/* İç link: diğer roller (aynı platform) — SEO + gezinme */}
      <nav aria-label={t("hubTitle")} className="sr-only">
        {PSEO_ROLES.map((r) => (
          <Link key={r.id} href={`/freelance/${platform}/${r.id}`}>{r.en}</Link>
        ))}
      </nav>
    </div>
  );
}
