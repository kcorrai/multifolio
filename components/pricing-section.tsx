import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ScrollReveal } from "@/components/scroll-reveal";

// Kredi paketleri (pay-as-you-go): abonelik yok, kredi tükendikçe satın alınır
const plans = [
  { key: "starter", credits: 100,  price: "$9",  featured: false },
  { key: "pro",     credits: 500,  price: "$29", featured: true  },
  { key: "scale",   credits: 1500, price: "$69", featured: false },
] as const;

/* ─── Paylaşılan fiyatlandırma bölümü (landing + /pricing) ───────── */
export async function PricingSection({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const t = await getTranslations("landing");

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-8 py-24">
      <ScrollReveal>
        <div className="text-center space-y-3 mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00F0FF]">{t("pricing.eyebrow")}</p>
          <h2 className="text-4xl font-extrabold tracking-tight">{t("pricing.title")}</h2>
          <p className="text-slate-500 dark:text-[#94A3B8] text-lg max-w-xl mx-auto font-medium">{t("pricing.subtitle")}</p>
        </div>
      </ScrollReveal>

      <div className="flex flex-wrap items-center justify-center gap-3 mb-10 text-xs font-medium text-slate-500 dark:text-[#94A3B8]">
        {[t("pricing.badgePayg"), t("pricing.badgeNoSub"), t("pricing.badgeNeverExpire"), t("pricing.badgeFreeStart")].map((b) => (
          <span key={b} className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#00F0FF] shrink-0" />{b}
          </span>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
        {plans.map(({ key, credits, price, featured }, i) => (
          <ScrollReveal key={key} delay={i * 80}>
            <div className={`relative h-full rounded-2xl border p-6 flex flex-col ${featured
              ? "border-[#00F0FF]/40 bg-white dark:bg-[#161923] shadow-lg shadow-[#00F0FF]/10"
              : "border-slate-200 dark:border-white/8 bg-white dark:bg-[#161923]"}`}>
              {featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#00F0FF] to-violet-400 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#090A0F]">
                  {t("pricing.popular")}
                </span>
              )}
              <h3 className="font-bold text-lg">{t(`pricing.plans.${key}`)}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight">{price}</span>
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-[#94A3B8] font-medium">
                {t("pricing.creditsLine", { count: credits })}
              </p>
              <div className="my-5 h-px bg-slate-100 dark:bg-white/6" />
              <p className="text-sm text-slate-500 dark:text-[#94A3B8] font-medium flex-1">{t(`pricing.desc.${key}`)}</p>
              <Link
                href={isLoggedIn ? "/dashboard" : "/signup"}
                className={`mt-6 inline-flex items-center justify-center h-11 rounded-xl text-sm font-bold transition-colors ${featured
                  ? "bg-[#00F0FF] text-[#090A0F] hover:bg-[#00d8e8]"
                  : "border border-violet-500/40 text-violet-400 hover:bg-violet-500/10"}`}
              >
                {t("pricing.cta")}
              </Link>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
