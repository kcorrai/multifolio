// pSEO keşif hub'ı: tüm platform × rol landing sayfalarına iç link (SEO + gezinme).
// Statik, auth yok. Footer'dan ve sitemap'ten erişilir.
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PlatformLogo } from "@/components/platform-logo";
import { PSEO_PLATFORMS, PSEO_ROLES, platformLabel } from "@/lib/pseo/data";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pseo");
  return {
    title: t("hubTitle"),
    description: t("hubSubtitle"),
    alternates: { canonical: "/freelance" },
  };
}

export default async function FreelanceHubPage() {
  const t = await getTranslations("pseo");
  const locale = await getLocale();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090A0F] text-slate-900 dark:text-white overflow-x-hidden">
      <SiteHeader isLoggedIn={false} />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-[400px] w-[400px] rounded-full bg-[#00F0FF]/6 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-8 pt-20 pb-6 text-center space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00F0FF]">{t("hubEyebrow")}</p>
          <h1 className="text-4xl lg:text-5xl font-extrabold leading-[1.1] tracking-tight">{t("hubTitle")}</h1>
          <p className="text-lg text-slate-500 dark:text-[#94A3B8] leading-relaxed max-w-xl mx-auto font-medium">{t("hubSubtitle")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-8 py-10 space-y-8">
        {PSEO_PLATFORMS.map((platform) => (
          <div key={platform}>
            <div className="flex items-center gap-2.5 mb-4">
              <PlatformLogo platform={platform} size={20} />
              <h2 className="text-lg font-bold">{platformLabel(platform)}</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PSEO_ROLES.map((r) => (
                <Link
                  key={r.id}
                  href={`/freelance/${platform}/${r.id}`}
                  className="group flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:border-[#00F0FF]/30 hover:shadow-md dark:border-white/8 dark:bg-[#161923]"
                >
                  <span className="text-sm font-semibold">{locale === "tr" ? r.tr : r.en}</span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-[#00F0FF] dark:text-white/40" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <SiteFooter />
    </div>
  );
}
