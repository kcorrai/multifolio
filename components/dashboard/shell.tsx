"use client";

// Dashboard kabuğu — Solar Pop tasarımı.
// Referans komp: docs/design/solar-pop/multifolio-dashboard-solar-pop.html
//
// Yapı: 248px yapışkan kenar çubuğu (gruplu nav + kredi kartı) + ana kolon
// (başlık şeridi + sayfa içeriği). Tema seçici KALDIRILDI (Solar Pop tek modlu).
// DashboardContext, tur sağlayıcısı ve banner'lar aynen korunur.
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogOut, ShieldCheck, Sun } from "lucide-react";
import { NotificationBell } from "./notification-bell";
import { NAV_ITEMS, NAV_GROUPS, isNavActive, type AdaptOutput } from "./shared";
import { DashboardContext } from "./dashboard-context";
import { VerifyEmailBanner } from "./verify-email-banner";
import { LowCreditsBanner } from "./low-credits-banner";
import { TourProvider } from "./tour/tour-context";
import { TourOverlay } from "./tour/tour-overlay";
import type { PlatformId } from "@/lib/ai/platforms";
import { marketPlatforms, type MarketId } from "@/lib/markets/config";

/** Başlık şeridi için rota → i18n anahtarı (dashboard.sp.titles.<key>). */
function titleKeyFor(pathname: string): string {
  if (pathname === "/dashboard") return "overview";
  const seg = pathname.split("/")[2] ?? "overview";
  return ["profile", "platforms", "portfolio", "cv", "jobs", "interview", "feedback", "start", "import"].includes(seg)
    ? seg
    : "overview";
}

export function DashboardShell({
  userEmail, credits: initialCredits, initialCreditsUsed, initialJobsCount, initialConnectionsCount,
  emailVerified, isAdmin = false, market, hasProfile = false, children,
}: {
  userEmail: string;
  credits: number;
  initialCreditsUsed: number;
  initialJobsCount: number;
  initialConnectionsCount: number;
  emailVerified: boolean;
  isAdmin?: boolean;
  market: MarketId;
  hasProfile?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const t = useTranslations("dashboard");
  const ts = useTranslations("dashboard.sp");

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
  const titleKey = titleKeyFor(pathname);
  // Jobs sayfası UpHunt tarzı tam-ekran 3-kolon uygulama: kendi yüksekliğini yönetir.
  const fullBleed = pathname.startsWith("/dashboard/jobs");

  return (
    <TourProvider hasProfile={hasProfile}>
      <DashboardContext.Provider
        value={{
          market,
          platforms: marketPlatforms(market),
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
        <div className="sp-page sp-appshell">

          {/* ── Kenar çubuğu ───────────────────────────────────────────── */}
          <aside className="sp-side">
            <Link href="/dashboard" className="flex items-center gap-[11px] px-1.5">
              <span
                className="inline-grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[var(--radius-pill)]"
                style={{ background: "var(--action-primary)", color: "var(--white)", font: "var(--fw-black) 16px/1 var(--font-display)" }}
              >
                m
              </span>
              <span
                style={{
                  font: "var(--fw-black) 18px/1 var(--font-display)",
                  letterSpacing: "var(--tracking-display)", textTransform: "uppercase", color: "var(--text-strong)",
                }}
              >
                multifolio
              </span>
            </Link>

            <nav className="sp-sidenav">
              {NAV_GROUPS.map((group) => {
                const items = NAV_ITEMS.filter((n) => n.group === group);
                if (items.length === 0) return null;
                return (
                  <div key={group} className="grid min-w-0 gap-[5px]">
                    <span className="sp-label sp-sidegroup px-2 whitespace-nowrap">{ts(`navGroup.${group}`)}</span>
                    {items.map(({ href, labelKey, icon: Icon, badge }) => {
                      const active = isNavActive(href, pathname);
                      const count = badgeCount(badge);
                      return (
                        <Link
                          key={href}
                          href={href}
                          data-tour={`nav-${labelKey}`}
                          aria-current={active ? "page" : undefined}
                          className="sp-navitem"
                          data-active={active ? "true" : undefined}
                        >
                          <Icon size={15} className="shrink-0" />
                          <span className="mr-auto">{t(`nav.${labelKey}`)}</span>
                          {count !== undefined && count > 0 ? (
                            <span className="sp-navbadge">{count}</span>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                );
              })}

              {isAdmin ? (
                <div className="grid min-w-0 gap-[5px]">
                  <span className="sp-label sp-sidegroup px-2">{ts("navGroup.admin")}</span>
                  <Link href="/admin" className="sp-navitem" data-active={pathname.startsWith("/admin") ? "true" : undefined}>
                    <ShieldCheck size={15} className="shrink-0" />
                    <span className="mr-auto">{t("shell.admin")}</span>
                  </Link>
                </div>
              ) : null}
            </nav>

            {/* Kredi kartı — bakiye her zaman görünür, birinci sınıf kavram. */}
            <div className="sp-sidefoot grid gap-3 rounded-[var(--radius-sp-lg)] p-4" style={{ background: "var(--surface-card-peach)" }}>
              <div className="flex items-baseline gap-2">
                <span
                  className="tabular-nums"
                  style={{ font: "var(--fw-black) var(--fs-stat)/.9 var(--font-display)", letterSpacing: "var(--tracking-display)", color: "var(--text-heading)" }}
                >
                  {credits}
                </span>
                <span className="sp-label">{t("shell.credits")}</span>
              </div>
              <span style={{ font: "var(--fw-regular) var(--fs-label)/1.5 var(--font-body)", color: "var(--text-body)" }}>
                {ts("creditsNote")}
              </span>
              <button type="button" onClick={triggerComingSoon} className="sp-btn sp-btn--sm sp-btn--quiet sp-btn--block">
                {t("shell.buyCredits")}
              </button>
            </div>
          </aside>

          {/* ── Ana kolon ──────────────────────────────────────────────── */}
          <main className="grid min-w-0 content-start">
            <header className="sp-topbar flex flex-wrap items-center gap-3.5">
              <div className="mr-auto grid min-w-0 gap-2">
                <h1
                  className="sp-dashh1"
                  style={{
                    font: "var(--fw-black) var(--fs-display-m)/var(--lh-display) var(--font-display)",
                    letterSpacing: "var(--tracking-display)", textTransform: "uppercase", color: "var(--text-strong)",
                  }}
                >
                  {ts(`titles.${titleKey}.title`)}
                  <span className="sp-script ml-3" style={{ fontSize: "var(--fs-script-m)" }}>
                    {ts(`titles.${titleKey}.script`)}
                  </span>
                </h1>
                <p className="sp-body" style={{ maxWidth: "62ch" }}>{ts(`titles.${titleKey}.sub`)}</p>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="sp-chip sp-chip--static tabular-nums">
                  <Sun size={12} />
                  {ts("creditsPill", { count: credits })}
                </span>
                <NotificationBell />
                <span
                  className="inline-grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-pill)]"
                  title={userEmail}
                  style={{ background: "var(--action-primary)", color: "var(--white)", font: "var(--fw-black) 15px/1 var(--font-display)" }}
                >
                  {userInitial}
                </span>
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    title={t("shell.logout")}
                    aria-label={t("shell.logout")}
                    className="inline-grid h-10 w-10 cursor-pointer place-items-center rounded-[var(--radius-pill)] border-none"
                    style={{ background: "var(--white)", color: "var(--text-muted)", boxShadow: "var(--shadow-soft)" }}
                  >
                    <LogOut size={15} />
                  </button>
                </form>
              </div>
            </header>

            <div className={fullBleed ? "min-h-0" : "sp-dashpage"}>
              {fullBleed ? (
                children
              ) : (
                <>
                  <VerifyEmailBanner emailVerified={emailVerified} email={userEmail} />
                  <LowCreditsBanner />
                  {children}
                </>
              )}
            </div>
          </main>

          {/* Kredi satın alma henüz açık değil — dürüst geçici bildirim. */}
          {showComingSoon ? (
            <div
              className="sp-rise fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-[var(--radius-sp-lg)] px-4 py-3"
              style={{ background: "var(--white)", boxShadow: "var(--shadow-lift)" }}
            >
              <span
                className="inline-grid h-7 w-7 shrink-0 place-items-center rounded-[var(--radius-pill)]"
                style={{ background: "var(--surface-card-alt)", color: "var(--pink-600)" }}
              >
                <Sun size={14} />
              </span>
              <div className="grid gap-0.5">
                <span className="sp-sub" style={{ fontSize: "var(--fs-body)" }}>{t("shell.comingSoonTitle")}</span>
                <span className="sp-body sp-body--small">{t("shell.comingSoonBody")}</span>
              </div>
            </div>
          ) : null}

          <TourOverlay />
        </div>
      </DashboardContext.Provider>
    </TourProvider>
  );
}
