// Ücretsiz araç sayfalarının alt bölümü (edinim hunisi): diğer ücretsiz araçlara
// çapraz-link (topical SEO) + paylaş satırı + kayıtsız kullanıcıya signup CTA.
// Sunucu bileşeni; SiteFooter'dan hemen önce yerleştirilir.
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { SITE_URL } from "@/lib/seo/site";
import { ShareButtons } from "@/components/share-buttons";

const TOOLS = [
  { key: "analyze", href: "/analyze" },
  { key: "earnings", href: "/earnings" },
  { key: "rate", href: "/rate" },
  { key: "proposalChecker", href: "/proposal-checker" },
  { key: "headlineOptimizer", href: "/headline-optimizer" },
  { key: "compare", href: "/compare" },
] as const;

export async function ToolCta({ current, isLoggedIn }: { current: string; isLoggedIn: boolean }) {
  const t = await getTranslations("landing.toolCta");
  const tt = await getTranslations("landing.tools");
  const others = TOOLS.filter((x) => x.href !== current);
  const ref = current.replace(/^\//, "") || "tool";

  return (
    <section className="mx-auto max-w-4xl px-8 pb-20 space-y-8">
      {/* Paylaş */}
      <div className="flex justify-center">
        <ShareButtons url={`${SITE_URL}${current}`} text={t("shareText")} />
      </div>

      {/* Diğer ücretsiz araçlar */}
      <div>
        <p className="mb-4 text-center text-xs font-bold uppercase tracking-[0.2em] text-violet-400">{t("more")}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((tool) => (
            <Link
              key={tool.key}
              href={tool.href}
              className="group flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:border-[#00F0FF]/30 hover:shadow-md dark:border-white/8 dark:bg-[#161923]"
            >
              <span className="text-sm font-semibold text-slate-800 dark:text-white">{tt(`${tool.key}.title`)}</span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-[#00F0FF] dark:text-white/40" />
            </Link>
          ))}
        </div>
      </div>

      {/* Signup CTA (yalnız kayıtsız) */}
      {!isLoggedIn && (
        <div className="relative overflow-hidden rounded-3xl border border-[#00F0FF]/15 bg-slate-50 px-8 py-10 text-center dark:border-[#00F0FF]/10 dark:bg-[#161923]">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00F0FF]/6 blur-[80px]" />
          <div className="relative space-y-4">
            <h2 className="text-2xl font-extrabold tracking-tight">{t("unlockTitle")}</h2>
            <p className="mx-auto max-w-md text-slate-500 dark:text-[#94A3B8] font-medium">{t("unlockDesc")}</p>
            <Link
              href={`/signup?ref=${ref}`}
              className="anim-neon-pulse inline-flex h-11 items-center rounded-xl bg-[#00F0FF] px-7 text-base font-bold text-[#090A0F] transition-colors hover:bg-[#00d8e8]"
            >
              {t("unlockCta")} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
