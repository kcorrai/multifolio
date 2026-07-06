"use client";

// "Getting Started" onboarding sayfası (/dashboard/start): kullanıcıyı ürünü
// öğreten görev listesi + keşfet şeridi. Adım tamamlanma durumları SUNUCUDAN gerçek
// veriden gelir (done prop). Tümü bitince tek seferlik bonus kredi (server verir).
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Mail, User, Layers, Sparkles, ListFilter, Globe,
  Check, ArrowRight, PartyPopper, Gift,
  Search, Wallet, GitCompare, Puzzle, type LucideIcon,
} from "lucide-react";
import { ELEVATED } from "./shared";
import { EXTENSION_STORE_URL } from "@/lib/extension";

export type StepKey = "verifyEmail" | "profile" | "connect" | "adapt" | "feed" | "portfolio";

// Adım sırası + ikon + hedef (etiketler i18n gettingStarted.steps.<key>).
const STEPS: { key: StepKey; icon: LucideIcon; href: string }[] = [
  { key: "verifyEmail", icon: Mail,      href: "/dashboard" },
  { key: "profile",     icon: User,      href: "/dashboard/import" },
  { key: "connect",     icon: Layers,    href: "/dashboard/platforms" },
  { key: "adapt",       icon: Sparkles,  href: "/dashboard/platforms" },
  { key: "feed",        icon: ListFilter, href: "/dashboard/jobs" },
  { key: "portfolio",   icon: Globe,     href: "/dashboard/portfolio" },
];

// Keşfet şeridi: ücretsiz araçlar (ürün genişliğini öğretir).
const TIPS: { key: string; icon: LucideIcon; href: string; external?: boolean }[] = [
  { key: "analyze",   icon: Search,     href: "/analyze" },
  { key: "earnings",  icon: Wallet,     href: "/earnings" },
  { key: "compare",   icon: GitCompare, href: "/compare" },
  { key: "extension", icon: Puzzle,     href: EXTENSION_STORE_URL, external: true },
];

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
    <div className="space-y-6">

      {/* ── Karşılama başlığı ─────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#00F0FF]/80">{t("eyebrow")}</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* ── Bitince kutlama VEYA sıradaki adım vurgusu ────────────── */}
      {allDone ? (
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-br from-[#00F0FF]/10 via-violet-500/10 to-transparent p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 shrink-0 rounded-2xl bg-violet-500/15 flex items-center justify-center">
              <PartyPopper className="h-6 w-6 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold">{t("doneTitle")}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{t("doneBody")}</p>
              {bonusEarned && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-sm font-semibold text-violet-300">
                  <Gift className="h-4 w-4" />
                  {justGranted
                    ? t("bonusJustEarned", { count: bonusCredits })
                    : t("bonusEarned", { count: bonusCredits })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : nextStep ? (
        <Link
          href={nextStep.href}
          className="group flex items-center gap-4 rounded-2xl border border-[#00F0FF]/25 bg-[#00F0FF]/5 p-5 hover:border-[#00F0FF]/45 transition-colors"
        >
          <div className="h-11 w-11 shrink-0 rounded-xl bg-[#00F0FF]/10 flex items-center justify-center">
            <nextStep.icon className="h-5 w-5 text-[#00F0FF]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#00F0FF]/80">{t("nextUp")}</p>
            <p className="text-sm font-bold mt-0.5">{t(`steps.${nextStep.key}.title`)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t(`steps.${nextStep.key}.desc`)}</p>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-[#00F0FF]">
            {t(`steps.${nextStep.key}.cta`)}<ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </Link>
      ) : null}

      {/* ── İlerleme + görev listesi ──────────────────────────────── */}
      <div className={`rounded-2xl border border-border bg-card ${ELEVATED}`}>
        <div className="flex items-center justify-between gap-4 p-5 pb-3">
          <h2 className="text-sm font-bold">{t("checklistTitle")}</h2>
          <span className="text-xs font-semibold text-muted-foreground tabular-nums">
            {t("progress", { done: completedCount, total: STEPS.length })}
          </span>
        </div>
        <div className="px-5">
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-[#00F0FF] to-violet-500 transition-[width] duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <ul className="p-3">
          {STEPS.map((step) => {
            const isDone = done[step.key];
            const isNext = !isDone && step.key === nextStep?.key;
            return (
              <li key={step.key}>
                <Link
                  href={step.href}
                  className={`group flex items-center gap-3.5 rounded-xl p-3 transition-colors ${
                    isNext ? "bg-[#00F0FF]/[0.06] hover:bg-[#00F0FF]/10" : "hover:bg-muted"
                  }`}
                >
                  <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${
                    isDone
                      ? "bg-green-500 text-white"
                      : isNext
                      ? "bg-[#00F0FF]/15 text-[#00F0FF]"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {isDone ? <Check className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${isDone ? "text-muted-foreground line-through decoration-muted-foreground/40" : ""}`}>
                      {t(`steps.${step.key}.title`)}
                    </p>
                    <p className="text-xs text-muted-foreground/80 mt-0.5 truncate">{t(`steps.${step.key}.desc`)}</p>
                  </div>
                  {!isDone && (
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
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
            const cls = `block rounded-2xl border border-border bg-card p-4 hover:border-[#00F0FF]/30 transition-colors ${ELEVATED}`;
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
