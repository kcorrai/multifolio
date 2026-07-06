import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Layers, Briefcase, FileText, Globe } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PricingSection } from "@/components/pricing-section";
import { FaqSection } from "@/components/faq-section";
import { ScrollReveal } from "@/components/scroll-reveal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CREDIT_COSTS, type CreditKind } from "@/lib/credits/costs";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pricingPage");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

// Maliyet tablosu satırları: CREDIT_COSTS ile birebir, sabit gösterim sırası + ikon
const COST_ROWS: { kind: CreditKind; icon: typeof Layers }[] = [
  { kind: "adaptation",           icon: Layers    },
  { kind: "job_match",            icon: Briefcase },
  { kind: "proposal",             icon: FileText  },
  { kind: "portfolio_generation", icon: Globe     },
  { kind: "cv_generation",        icon: FileText  },
  { kind: "cv_tailor",            icon: FileText  },
];

export default async function PricingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  const t = await getTranslations("pricingPage");
  const tc = await getTranslations("common");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090A0F] text-slate-900 dark:text-white overflow-x-hidden">
      <SiteHeader isLoggedIn={isLoggedIn} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-[400px] w-[400px] rounded-full bg-[#00F0FF]/6 blur-[100px]" />
          <div className="absolute right-1/4 top-10 h-[350px] w-[350px] rounded-full bg-violet-500/8 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-8 pt-20 pb-4 text-center space-y-4">
          <p className="anim-fade-up anim-d0 text-xs font-bold uppercase tracking-[0.2em] text-[#00F0FF]">{t("heroEyebrow")}</p>
          <h1 className="anim-fade-up anim-d1 text-4xl lg:text-5xl font-extrabold leading-[1.1] tracking-tight">{t("heroTitle")}</h1>
          <p className="anim-fade-up anim-d2 text-lg text-slate-500 dark:text-[#94A3B8] leading-relaxed max-w-xl mx-auto font-medium">
            {t("heroSubtitle")}
          </p>
        </div>
      </section>

      {/* Kredi paketleri (landing ile paylaşılan bölüm) */}
      <PricingSection isLoggedIn={isLoggedIn} />

      {/* Kredi maliyet tablosu */}
      <section className="border-y border-slate-200 dark:border-white/5 bg-slate-100/60 dark:bg-[#161923]/40 py-24">
        <div className="mx-auto max-w-3xl px-8">
          <ScrollReveal>
            <div className="text-center space-y-3 mb-12">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">{t("costsEyebrow")}</p>
              <h2 className="text-4xl font-extrabold tracking-tight">{t("costsTitle")}</h2>
              <p className="text-slate-500 dark:text-[#94A3B8] text-lg max-w-xl mx-auto font-medium">{t("costsSubtitle")}</p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#161923] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 dark:border-white/6 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30">
                <span>{t("colAction")}</span>
                <span>{t("colCost")}</span>
              </div>
              {COST_ROWS.map(({ kind, icon: Icon }, i) => (
                <div
                  key={kind}
                  className={`flex items-center justify-between px-6 py-4 ${i > 0 ? "border-t border-slate-100 dark:border-white/6" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-[#00F0FF]" />
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white">{t(`actions.${kind}`)}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-white/80 tabular-nums">
                    {t("creditUnit", { count: CREDIT_COSTS[kind] })}
                  </span>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={160}>
            <p className="mt-5 text-center text-sm text-slate-500 dark:text-[#94A3B8] font-medium">{t("actionsNote")}</p>
          </ScrollReveal>
        </div>
      </section>

      {/* SSS (landing ile paylaşılan bölüm) */}
      <FaqSection />

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-8 py-24 text-center">
        <ScrollReveal scale>
          <div className="relative rounded-3xl border border-[#00F0FF]/15 dark:border-[#00F0FF]/10 bg-slate-50 dark:bg-[#161923] px-8 py-16 overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/3 top-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-[#00F0FF]/6 blur-[80px]" />
              <div className="absolute right-1/3 top-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-violet-500/8 blur-[80px]" />
            </div>
            <div className="relative space-y-5">
              <h2 className="text-4xl font-extrabold tracking-tight">{t("ctaTitle")}</h2>
              <p className="text-slate-500 dark:text-[#94A3B8] text-lg font-medium max-w-md mx-auto">{t("ctaSubtitle")}</p>
              <Link
                href={isLoggedIn ? "/dashboard" : "/signup"}
                className="anim-neon-pulse inline-flex items-center h-12 px-8 rounded-xl text-base font-bold bg-[#00F0FF] text-[#090A0F] hover:bg-[#00d8e8] transition-colors mt-2"
              >
                {isLoggedIn ? tc("goToDashboard") : t("ctaButton")} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <SiteFooter />
    </div>
  );
}
