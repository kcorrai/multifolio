import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import { ScrollReveal } from "@/components/scroll-reveal";
import { BuyCreditsButton } from "@/components/buy-credits-button";
import { isIyzicoConfigured } from "@/lib/payments/iyzico";
import { CREDIT_COSTS } from "@/lib/credits/costs";

// Kredi paketleri (pay-as-you-go): abonelik yok, kredi tükendikçe satın alınır.
// Fiyat locale'e göre: TR kullanıcı TL, yabancı kullanıcı USD görür (ayrı belirlenmiş
// fiyatlar; canlı kur DEĞİL — ödeme henüz yok, satın alma açılınca netleşir).
const plans = [
  { key: "starter", credits: 100,  usd: "$9",  try: "₺349",   featured: false },
  { key: "pro",     credits: 500,  usd: "$29", try: "₺1.149", featured: true  },
  { key: "scale",   credits: 1500, usd: "$69", try: "₺2.749", featured: false },
] as const;

/* ─── Paylaşılan fiyatlandırma bölümü (landing + /pricing) ───────── */
// showHeader=false: /pricing sayfası kendi hero'suna sahip → bölüm başlığı
// tekrarını (çift "PRICING") gizle.
export async function PricingSection({ isLoggedIn = false, showHeader = true }: { isLoggedIn?: boolean; showHeader?: boolean }) {
  const t = await getTranslations("landing");
  const tc = await getTranslations("common");
  const locale = await getLocale();
  const currency: "usd" | "try" = locale === "tr" ? "try" : "usd";
  // Ödeme canlı mı? (iyzico anahtarları tanımlıysa gerçek checkout; değilse "yakında").
  const paymentsEnabled = isIyzicoConfigured();

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-8 py-24">
      {showHeader && (
        <ScrollReveal>
          <div className="text-center space-y-3 mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00F0FF]">{t("pricing.eyebrow")}</p>
            <h2 className="text-4xl font-extrabold tracking-tight">{t("pricing.title")}</h2>
            <p className="text-slate-500 dark:text-[#94A3B8] text-lg max-w-xl mx-auto font-medium">{t("pricing.subtitle")}</p>
          </div>
        </ScrollReveal>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 mb-6 text-xs font-medium text-slate-500 dark:text-[#94A3B8]">
        {[t("pricing.badgePayg"), t("pricing.badgeNoSub"), t("pricing.badgeNeverExpire"), t("pricing.badgeFreeStart")].map((b) => (
          <span key={b} className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#00F0FF] shrink-0" />{b}
          </span>
        ))}
      </div>

      {/* Ödeme henüz canlı değilse dürüst "yakında" işareti; canlıysa gösterilmez. */}
      {!paymentsEnabled && (
        <div className="flex justify-center mb-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-300/50 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-950/30 px-4 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
            <Clock className="h-3.5 w-3.5 shrink-0" />{t("pricing.paymentSoon")}
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
        {plans.map((plan, i) => {
          const { key, credits, featured } = plan;
          const price = plan[currency];
          return (
          <ScrollReveal key={key} delay={i * 80}>
            <div className={`relative h-full rounded-2xl border p-6 flex flex-col ${featured
              ? "border-[#00F0FF]/40 bg-white dark:bg-[#161923] shadow-lg shadow-[#00F0FF]/10"
              : "border-slate-200 dark:border-white/8 bg-white dark:bg-[#161923]"}`}>
              {featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#00F0FF] to-violet-400 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#090A0F]">
                  {t("pricing.popular")}
                </span>
              )}
              <h3 className="font-bold text-lg">{t(`pricing.plans.${key}`)}</h3>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tracking-tight">{price}</span>
                {!paymentsEnabled && (
                  <span className="rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide">
                    {t("pricing.comingSoon")}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-[#94A3B8] font-medium">
                {t("pricing.creditsLine", { count: credits })}
              </p>
              <p className="mt-0.5 text-xs text-slate-400 dark:text-[#94A3B8]/70">
                {/* Aksiyon sayıları CREDIT_COSTS'tan türetilir → maliyet değişince otomatik senkron. */}
                {t("pricing.valueHint", { adaptations: Math.floor(credits / CREDIT_COSTS.adaptation), proposals: Math.floor(credits / CREDIT_COSTS.proposal) })}
              </p>
              <div className="my-5 h-px bg-slate-100 dark:bg-white/6" />
              <p className="text-sm text-slate-500 dark:text-[#94A3B8] font-medium flex-1">{t(`pricing.desc.${key}`)}</p>
              {(() => {
                const btnClass = `w-full inline-flex items-center justify-center h-11 rounded-xl text-sm font-bold transition-colors ${featured
                  ? "bg-[#00F0FF] text-[#090A0F] hover:bg-[#00d8e8]"
                  : "border border-violet-500/40 text-violet-400 hover:bg-violet-500/10"}`;
                // Ödeme canlı + oturum açık → gerçek satın alma. Aksi halde giriş/kayıt (veya
                // "yakında" durumunda dashboard) yönlendirmesi — önceki davranış korunur.
                if (paymentsEnabled && isLoggedIn) {
                  return <BuyCreditsButton packageId={key} label={t("pricing.buy")} className={btnClass} />;
                }
                return (
                  <Link href={isLoggedIn ? "/dashboard" : "/signup"} className={`mt-6 ${btnClass}`}>
                    {isLoggedIn ? tc("goToDashboard") : t("pricing.cta")}
                  </Link>
                );
              })()}
            </div>
          </ScrollReveal>
          );
        })}
      </div>

      {/* Anti-Connects konumlandırma: kredi = ürettiğin ve senin olan iş (belirsiz teklif hakkı değil). */}
      <p className="mt-8 text-center text-sm text-slate-500 dark:text-[#94A3B8] max-w-2xl mx-auto font-medium">
        {t("pricing.antiConnects")}
      </p>

      {/* TL fiyatları canlı kur değil — yaklaşık olduğunu dürüstçe belirt (ROUND5). */}
      {currency === "try" && (
        <p className="mt-6 text-center text-xs text-slate-400 dark:text-[#94A3B8]/70 max-w-lg mx-auto">
          {t("pricing.tryApprox")}
        </p>
      )}
    </section>
  );
}
