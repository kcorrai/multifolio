import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "@/components/mobile-nav";
import { FreeToolsNav } from "@/components/free-tools-nav";

/* ─── Paylaşılan üst gezinme (landing + pricing) ─────────────────── */
export async function SiteHeader({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const t = await getTranslations("landing");
  const tc = await getTranslations("common");

  return (
    <header className="border-b border-slate-200 dark:border-white/5 anim-fade-in anim-d0">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-[#00F0FF]/20 border border-[#00F0FF]/30 flex items-center justify-center shadow-lg shadow-[#00F0FF]/20">
            <span className="text-[#00F0FF] text-sm font-extrabold">M</span>
          </div>
          <span className="font-bold text-lg tracking-tight">Multifolio</span>
        </Link>

        {/* Sadeleştirilmiş nav: "Free Tools" (araçlar açılır menüde) + "Pricing" */}
        <nav className="hidden md:flex items-center gap-7">
          <FreeToolsNav
            label={t("nav.freeTools")}
            items={[
              { label: t("nav.analyze"),  href: "/analyze" },
              { label: t("nav.rate"),     href: "/rate" },
              { label: t("nav.proposalChecker"), href: "/proposal-checker" },
              { label: t("nav.headlineOptimizer"), href: "/headline-optimizer" },
            ]}
          />
          <Link href="/pricing" className="text-sm text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-colors font-medium">
            {t("nav.pricing")}
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          {isLoggedIn ? (
            <Button asChild size="sm" className="font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/30">
              <Link href="/dashboard">{tc("dashboard")}</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/8">
                <Link href="/login">{t("cta.login")}</Link>
              </Button>
              <Button asChild size="sm" className="font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/30">
                <Link href="/signup">{t("cta.signupFree")}</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobil: hamburger + açılır menü (tüm nav + toggle + CTA) */}
        <MobileNav isLoggedIn={isLoggedIn} />
      </div>
    </header>
  );
}
