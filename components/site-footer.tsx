import Link from "next/link";
import { getTranslations } from "next-intl/server";

/* ─── Paylaşılan alt bilgi (landing + pricing) ──────────────────── */
export async function SiteFooter() {
  const t = await getTranslations("landing");

  return (
    <footer className="border-t border-slate-200 dark:border-white/5 py-8">
      <div className="mx-auto max-w-6xl px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-md bg-[#00F0FF]/20 border border-[#00F0FF]/30 flex items-center justify-center">
            <span className="text-[#00F0FF] text-[9px] font-extrabold">M</span>
          </div>
          <span className="text-sm font-bold text-slate-500 dark:text-[#94A3B8]/50">Multifolio</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-6">
          <Link href="/#features" className="text-xs text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white/70 transition-colors font-medium">{t("nav.features")}</Link>
          <Link href="/#how" className="text-xs text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white/70 transition-colors font-medium">{t("nav.howItWorks")}</Link>
          <Link href="/analyze" className="text-xs text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white/70 transition-colors font-medium">{t("nav.analyze")}</Link>
          <Link href="/pricing" className="text-xs text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white/70 transition-colors font-medium">{t("nav.pricing")}</Link>
        </nav>
        <p className="text-xs text-slate-400 dark:text-white/20 font-medium">{t("footer.rights")}</p>
      </div>
    </footer>
  );
}
