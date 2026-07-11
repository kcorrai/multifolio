import { getTranslations } from "next-intl/server";
import { ScrollReveal } from "@/components/scroll-reveal";
import { JsonLd } from "@/components/seo/json-ld";

const FAQ_KEYS = ["credits", "expire", "subscription", "platforms", "beta"];

/* ─── Paylaşılan SSS bölümü (landing + /pricing) ────────────────── */
export async function FaqSection() {
  const t = await getTranslations("landing");

  // FAQPage structured data (Google zengin sonuç: açılır SSS).
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_KEYS.map((key) => ({
      "@type": "Question",
      name: t(`faq.q.${key}`),
      acceptedAnswer: { "@type": "Answer", text: t(`faq.a.${key}`) },
    })),
  };

  return (
    <section id="faq" className="border-t border-slate-200 dark:border-white/5 bg-slate-100/60 dark:bg-[#161923]/40 py-24">
      <JsonLd data={faqLd} />
      <div className="mx-auto max-w-3xl px-8">
        <ScrollReveal>
          <div className="text-center space-y-3 mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">{t("faq.eyebrow")}</p>
            <h2 className="text-4xl font-extrabold tracking-tight">{t("faq.title")}</h2>
          </div>
        </ScrollReveal>
        <div className="space-y-3">
          {FAQ_KEYS.map((key, i) => (
            <ScrollReveal key={key} delay={i * 60}>
              <details className="group rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#161923] px-5 py-4">
                <summary className="flex items-center justify-between cursor-pointer list-none font-semibold text-slate-900 dark:text-white">
                  {t(`faq.q.${key}`)}
                  <span className="ml-4 shrink-0 text-[#00F0FF] transition-transform group-open:rotate-45 text-xl leading-none">+</span>
                </summary>
                <p className="mt-3 text-sm text-slate-500 dark:text-[#94A3B8] leading-relaxed font-medium">
                  {t(`faq.a.${key}`)}
                </p>
              </details>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
