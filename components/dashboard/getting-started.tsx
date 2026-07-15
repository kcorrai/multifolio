"use client";

// "Getting Started" onboarding sayfası (/dashboard/start): kullanıcıyı ürüne bağlayan
// GÖRSEL yolculuk. İmza öğe: ilerlemeye göre dolan dikey omurga (sıra gerçek bir kurulum
// akışı olduğundan sıralı düzen bilgi taşır). Adım durumları SUNUCUDAN gerçek veriden
// (done prop). Tümü bitince tek seferlik bonus (server verir). Sadece görsel — backend yok.
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Mail, User, Layers, Sparkles, ListFilter, Globe,
  Check, ArrowRight, PartyPopper, Gift,
  Search, Puzzle, type LucideIcon,
} from "lucide-react";
import { CountUp } from "@/components/count-up";
import { ELEVATED } from "./shared";
import { EXTENSION_STORE_URL } from "@/lib/extension";

export type StepKey = "verifyEmail" | "profile" | "connect" | "adapt" | "feed" | "portfolio";

const STEPS: { key: StepKey; icon: LucideIcon; href: string }[] = [
  { key: "verifyEmail", icon: Mail,      href: "/dashboard" },
  { key: "profile",     icon: User,      href: "/dashboard/import" },
  { key: "connect",     icon: Layers,    href: "/dashboard/platforms" },
  { key: "adapt",       icon: Sparkles,  href: "/dashboard/platforms" },
  { key: "feed",        icon: ListFilter, href: "/dashboard/jobs" },
  { key: "portfolio",   icon: Globe,     href: "/dashboard/portfolio" },
];

const TIPS: { key: string; icon: LucideIcon; href: string; external?: boolean }[] = [
  { key: "analyze",   icon: Search,     href: "/analyze" },
  { key: "extension", icon: Puzzle,     href: EXTENSION_STORE_URL, external: true },
];

/* Hero ilerleme halkası — cyan→violet gradyan yay, dolum animasyonlu. */
function ProgressRing({ pct, done, total }: { pct: number; done: number; total: number }) {
  const t = useTranslations("gettingStarted");
  const r = 46;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="8" className="stroke-muted" />
        <defs>
          <linearGradient id="ob-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00F0FF" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <circle
          cx="60" cy="60" r={r} fill="none" stroke="url(#ob-ring)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-1000 ease-out motion-reduce:transition-none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-baseline">
          <CountUp value={pct} duration={1100} className="text-3xl font-extrabold tabular-nums" />
          <span className="text-lg font-bold text-muted-foreground">%</span>
        </div>
        <span className="text-xs font-semibold text-muted-foreground tabular-nums">{t("progress", { done, total })}</span>
      </div>
    </div>
  );
}

export function GettingStarted({
  done, allDone, bonusEarned, justGranted, bonusCredits,
}: {
  done: Record<StepKey, boolean>;
  allDone: boolean;
  bonusEarned: boolean;
  justGranted: boolean;
  bonusCredits: number;
}) {
  const t = useTranslations("gettingStarted");

  const completedCount = STEPS.filter((s) => done[s.key]).length;
  const pct = Math.round((completedCount / STEPS.length) * 100);
  const nextStep = STEPS.find((s) => !done[s.key]);

  return (
    <div className="mx-auto max-w-3xl space-y-7">

      {/* ── Hero: karşılama + ilerleme halkası ────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-[#00F0FF]/[0.07] via-violet-500/[0.05] to-transparent p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#00F0FF]/10 blur-[70px]" />
        <div className="relative flex flex-col-reverse items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00F0FF]/80">{t("eyebrow")}</p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-sm text-muted-foreground max-w-md">{t("subtitle")}</p>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-500 dark:text-violet-300">
              <Gift className="h-3.5 w-3.5" />
              {allDone && bonusEarned ? t("rewardDone") : t("rewardPill", { count: bonusCredits })}
            </div>
          </div>
          <ProgressRing pct={pct} done={completedCount} total={STEPS.length} />
        </div>
      </div>

      {/* ── Tümü bitti kutlaması ──────────────────────────────────── */}
      {allDone && (
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-br from-[#00F0FF]/10 via-violet-500/10 to-transparent p-5 animate-in fade-in-0 zoom-in-95 duration-500 motion-reduce:animate-none">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 shrink-0 rounded-2xl bg-violet-500/15 flex items-center justify-center">
              <PartyPopper className="h-5 w-5 text-violet-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold">{t("doneTitle")}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{t("doneBody")}</p>
              {bonusEarned && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-sm font-semibold text-violet-500 dark:text-violet-300">
                  <Gift className="h-4 w-4" />
                  {justGranted ? t("bonusJustEarned", { count: bonusCredits }) : t("bonusEarned", { count: bonusCredits })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Yolculuk: dolan omurga + adım kartları ────────────────── */}
      <div>
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <h2 className="text-sm font-bold">{t("checklistTitle")}</h2>
          <span className="text-xs text-muted-foreground">{t("journeyHint")}</span>
        </div>

        <ol className="relative pl-1">
          {/* Omurga: gri hat + ilerlemeye göre dolan gradyan (node merkezleri hizası) */}
          <span aria-hidden className="absolute left-[19px] top-5 bottom-5 w-0.5 rounded-full bg-border" />
          <span
            aria-hidden
            className="absolute left-[19px] top-5 w-0.5 rounded-full bg-gradient-to-b from-[#00F0FF] to-violet-500 transition-[height] duration-1000 ease-out motion-reduce:transition-none"
            style={{ height: `calc((100% - 2.5rem) * ${completedCount / STEPS.length})` }}
          />

          {STEPS.map((step) => {
            const isDone = done[step.key];
            const isNext = !isDone && step.key === nextStep?.key;
            return (
              <li key={step.key} className="relative flex items-stretch gap-4 pb-3 last:pb-0">
                {/* Node */}
                <div className="relative z-10 shrink-0 pt-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background transition-colors ${
                      isDone
                        ? "border-transparent bg-gradient-to-br from-[#00F0FF] to-violet-500 text-white"
                        : isNext
                          ? "border-[#00F0FF] text-[#00F0FF] ring-4 ring-[#00F0FF]/15"
                          : "border-border text-muted-foreground"
                    }`}
                  >
                    {isDone ? <Check className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                  </div>
                </div>

                {/* Kart */}
                <Link
                  href={step.href}
                  className={`group flex flex-1 items-center gap-3 rounded-2xl border p-4 transition-all ${ELEVATED} ${
                    isNext
                      ? "border-[#00F0FF]/40 bg-[#00F0FF]/[0.05] hover:border-[#00F0FF]/60"
                      : isDone
                        ? "border-border/60 bg-card"
                        : "border-border bg-card hover:border-border/80 hover:-translate-y-0.5"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-semibold ${isDone ? "text-muted-foreground line-through decoration-muted-foreground/40" : ""}`}>
                        {t(`steps.${step.key}.title`)}
                      </p>
                      {isNext && (
                        <span className="rounded-full bg-[#00F0FF]/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#00F0FF]">{t("statusNext")}</span>
                      )}
                      {isDone && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-emerald-500 dark:text-emerald-400"><Check className="h-3 w-3" />{t("statusDone")}</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground/80">{t(`steps.${step.key}.desc`)}</p>
                  </div>
                  {!isDone && (
                    <span className={`shrink-0 inline-flex items-center gap-1 text-xs font-bold ${isNext ? "text-[#00F0FF]" : "text-muted-foreground group-hover:text-foreground"}`}>
                      {t(`steps.${step.key}.cta`)}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ol>
      </div>

      {/* ── Keşfet şeridi (ücretsiz araçlar) ──────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">{t("exploreTitle")}</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {TIPS.map((tip) => {
            const inner = (
              <>
                <div className="h-9 w-9 rounded-xl bg-[#00F0FF]/10 flex items-center justify-center mb-2.5">
                  <tip.icon className="h-4 w-4 text-[#00F0FF]" />
                </div>
                <p className="text-sm font-semibold">{t(`explore.${tip.key}.title`)}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{t(`explore.${tip.key}.desc`)}</p>
              </>
            );
            const cls = `block rounded-2xl border border-border bg-card p-4 hover:border-[#00F0FF]/30 hover:-translate-y-0.5 transition-all ${ELEVATED}`;
            return tip.external ? (
              <a key={tip.key} href={tip.href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
            ) : (
              <Link key={tip.key} href={tip.href} className={cls}>{inner}</Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
