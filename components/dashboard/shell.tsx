"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Wallet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { NAV_ITEMS, isNavActive, type AdaptOutput } from "./shared";
import { DashboardContext } from "./dashboard-context";
import { VerifyEmailBanner } from "./verify-email-banner";
import { LowCreditsBanner } from "./low-credits-banner";
import type { PlatformId } from "@/lib/ai/platforms";

export function DashboardShell({
  userEmail, credits: initialCredits, initialCreditsUsed, initialJobsCount, initialConnectionsCount, emailVerified, children,
}: {
  userEmail: string;
  credits: number;
  initialCreditsUsed: number;
  initialJobsCount: number;
  initialConnectionsCount: number;
  emailVerified: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const t = useTranslations("dashboard");
  const [credits, setCredits] = useState(initialCredits);
  const [creditsUsed, setCreditsUsed] = useState(initialCreditsUsed);
  const [jobsCount, setJobsCount] = useState(initialJobsCount);
  const [connectionsCount, setConnectionsCount] = useState(initialConnectionsCount);
  const [adaptResults, setAdaptResults] = useState<Partial<Record<PlatformId, AdaptOutput>>>({});
  const [showComingSoon, setShowComingSoon] = useState(false);

  function triggerComingSoon() {
    setShowComingSoon(true);
    setTimeout(() => setShowComingSoon(false), 3000);
  }

  const badgeCount = (badge?: "jobs" | "connections") =>
    badge === "jobs" ? jobsCount : badge === "connections" ? connectionsCount : undefined;

  const userInitial = userEmail?.[0]?.toUpperCase() ?? "?";
  const activeItem = NAV_ITEMS.find((n) => isNavActive(n.href, pathname));
  const pageTitle = activeItem ? t(`nav.${activeItem.labelKey}`) : "Dashboard";

  return (
    <DashboardContext.Provider
      value={{
        credits,
        creditsUsed,
        applyCredits: ({ balance, spent }) => {
          setCredits(balance);
          setCreditsUsed((u) => u + spent);
        },
        jobsCount, setJobsCount,
        connectionsCount, setConnectionsCount,
        adaptResults,
        setAdaptResult: (platform, output) => setAdaptResults((prev) => ({ ...prev, [platform]: output })),
        triggerComingSoon,
      }}
    >
      <div className="flex h-dvh overflow-hidden bg-background">

        {/* ── SIDEBAR (desktop) ──────────────────────────────────────── */}
        <aside className="hidden lg:flex w-60 flex-col shrink-0 border-r border-border bg-background">

          {/* Brand */}
          <div className="flex items-center gap-2.5 px-5 h-14 border-b border-border shrink-0">
            <div className="relative h-7 w-7 rounded-lg bg-gradient-to-br from-[#00F0FF]/25 to-[#00F0FF]/5 border border-[#00F0FF]/30 flex items-center justify-center shadow-sm shadow-[#00F0FF]/20">
              <span className="text-[#00F0FF] text-sm font-extrabold drop-shadow-[0_0_6px_rgba(0,240,255,0.4)]">M</span>
            </div>
            <span className="font-bold tracking-tight text-sm bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Multifolio</span>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.map(({ href, labelKey, icon: Icon, badge }) => {
              const active = isNavActive(href, pathname);
              const count = badgeCount(badge);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`group relative w-full flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
                    active
                      ? "bg-[#00F0FF]/10 text-[#00F0FF]"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span className={`absolute left-1 top-1/2 -translate-y-1/2 w-1 rounded-full bg-[#00F0FF] transition-all duration-200 ${
                    active ? "h-5 opacity-100" : "h-0 opacity-0 group-hover:h-3 group-hover:opacity-40"
                  }`} />
                  <Icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <span className="flex-1">{t(`nav.${labelKey}`)}</span>
                  {count !== undefined && count > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                      active ? "bg-[#00F0FF]/20 text-[#00F0FF]" : "bg-muted-foreground/20 text-muted-foreground"
                    }`}>{count}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom: credits + user */}
          <div className="shrink-0 px-3 pb-4 pt-3 border-t border-border space-y-3">
            <div className="rounded-xl bg-violet-500/8 dark:bg-violet-500/10 border border-violet-500/15 dark:border-violet-500/20 px-3 py-2.5 flex items-center gap-2.5 transition-colors hover:border-violet-500/35">
              <Wallet className="h-4 w-4 text-violet-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium leading-none mb-0.5">{t("shell.credits")}</p>
                <p className="text-sm font-bold tabular-nums leading-none">{credits}</p>
              </div>
              <button
                onClick={triggerComingSoon}
                className="text-[11px] font-semibold text-violet-400 hover:text-violet-300 transition-colors cursor-pointer"
              >
                {t("shell.buyCredits")}
              </button>
            </div>
            <div className="flex items-center gap-2.5 px-1">
              <div className="h-7 w-7 rounded-full bg-[#00F0FF]/15 border border-[#00F0FF]/20 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-[#00F0FF]">{userInitial}</span>
              </div>
              <span className="text-xs text-muted-foreground truncate flex-1 min-w-0">{userEmail}</span>
              <form action="/auth/signout" method="post">
                <button type="submit" title={t("shell.logout")} aria-label={t("shell.logout")} className="text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer">
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* ── MAIN AREA ─────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Top bar */}
          <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-border shrink-0 bg-background/80 backdrop-blur-sm">
            {/* Mobile: logo */}
            <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
              <div className="h-6 w-6 rounded-md bg-[#00F0FF]/20 border border-[#00F0FF]/30 flex items-center justify-center">
                <span className="text-[#00F0FF] text-xs font-extrabold">M</span>
              </div>
              <span className="font-bold text-sm tracking-tight">Multifolio</span>
            </Link>
            {/* Desktop: page title */}
            <h1 className="hidden lg:block text-base font-semibold text-foreground">{pageTitle}</h1>
            {/* Actions */}
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
              <form action="/auth/signout" method="post" className="lg:hidden">
                <Button type="submit" variant="ghost" size="sm" title={t("shell.logout")} aria-label={t("shell.logout")} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </form>
            </div>
          </header>

          {/* Mobile tab scroll */}
          <div className="lg:hidden flex overflow-x-auto border-b border-border px-3 py-2 gap-1 shrink-0 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {NAV_ITEMS.map(({ href, labelKey, icon: Icon, badge }) => {
              const active = isNavActive(href, pathname);
              const count = badgeCount(badge);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                    active
                      ? "bg-[#00F0FF]/10 text-[#00F0FF]"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {t(`nav.${labelKey}`)}
                  {count !== undefined && count > 0 && (
                    <span className={`rounded-full px-1 text-[9px] font-bold py-0.5 ${
                      active ? "bg-[#00F0FF]/20 text-[#00F0FF]" : "bg-muted-foreground/20 text-muted-foreground"
                    }`}>{count}</span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Scrollable content */}
          <main className="flex-1 overflow-y-auto min-h-0">
            <div className="mx-auto max-w-5xl 2xl:max-w-6xl px-4 sm:px-6 py-6 overflow-x-clip">
              <VerifyEmailBanner emailVerified={emailVerified} email={userEmail} />
              <LowCreditsBanner />
              {children}
            </div>
          </main>
        </div>

        {/* ── Coming soon toast ──────────────────────────────────────── */}
        {showComingSoon && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-violet-200 bg-white dark:bg-slate-900 dark:border-violet-800/60 px-4 py-3 shadow-lg shadow-violet-500/10">
            <div className="h-7 w-7 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center shrink-0">
              <Wallet className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{t("shell.comingSoonTitle")}</p>
              <p className="text-xs text-muted-foreground">{t("shell.comingSoonBody")}</p>
            </div>
          </div>
        )}
      </div>
    </DashboardContext.Provider>
  );
}
