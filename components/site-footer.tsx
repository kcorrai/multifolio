import Link from "next/link";
import { getTranslations } from "next-intl/server";

/* ─── Paylaşılan alt bilgi (landing + pricing + yasal sayfalar) ──────── */
export async function SiteFooter() {
  const t = await getTranslations("landing");

  const productLinks = [
    { href: "/#features", label: t("nav.features") },
    { href: "/#how", label: t("nav.howItWorks") },
    { href: "/analyze", label: t("nav.analyze") },
    { href: "/rate", label: t("nav.rate") },
    { href: "/roi", label: t("nav.roi") },
    { href: "/proposal-checker", label: t("nav.proposalChecker") },
    { href: "/headline-optimizer", label: t("nav.headlineOptimizer") },
    { href: "/ats-check", label: t("nav.atsCheck") },
    { href: "/guides", label: t("nav.guides") },
    { href: "/freelance", label: t("nav.freelance") },
    { href: "/pricing", label: t("nav.pricing") },
  ];
  const legalLinks = [
    { href: "/privacy", label: t("footer.privacy") },
    { href: "/terms", label: t("footer.terms") },
    { href: "/contact", label: t("footer.contact") },
  ];

  const linkCls =
    "text-xs text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white/70 transition-colors font-medium";

  return (
    <footer className="border-t border-slate-200 dark:border-white/5 py-10">
      <div className="mx-auto max-w-6xl px-8 space-y-6">
        {/* Üst: logo + ürün linkleri */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-[#00F0FF]/20 border border-[#00F0FF]/30 flex items-center justify-center">
              <span className="text-[#00F0FF] text-[9px] font-extrabold">M</span>
            </div>
            <span className="text-sm font-bold text-slate-500 dark:text-[#94A3B8]/50">Multifolio</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {productLinks.map(({ href, label }) => (
              <Link key={href} href={href} className={linkCls}>{label}</Link>
            ))}
          </nav>
        </div>

        {/* Alt: yasal linkler + telif */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100 dark:border-white/5 pt-5">
          <p className="text-xs text-slate-400 dark:text-white/20 font-medium">{t("footer.rights")}</p>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {legalLinks.map(({ href, label }) => (
              <Link key={href} href={href} className={linkCls}>{label}</Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
