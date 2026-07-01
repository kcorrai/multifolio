"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles, X, Check, CheckCircle2, AlertCircle,
  Wallet, Zap, Layers, Briefcase, ShoppingCart,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformLogo } from "@/components/platform-logo";
import { PLATFORMS, PLATFORM_IDS } from "@/lib/ai/platforms";
import {
  StatCard, TINT_CYAN, TINT_VIOLET, ELEVATED, PLATFORM_STYLES,
  STATUS_DOT, scoreColor, formatUsd, type JobRow,
} from "./shared";
import { useDashboard } from "./dashboard-context";
import { useAdapt } from "./use-adapt";

export function OverviewTab({
  profileSaved, portfolioPublished, jobs, totalCount, credits,
}: {
  profileSaved: boolean;
  portfolioPublished: boolean;
  jobs: JobRow[];
  totalCount: number;
  credits: number;
}) {
  const t = useTranslations("dashboard.overview");
  const ts = useTranslations("jobs");
  const locale = useLocale();
  const { spend, adaptResults, triggerComingSoon } = useDashboard();
  const { adapt, adapting } = useAdapt();
  const [onboardingDismissed, setOnboardingDismissed] = useState(profileSaved);

  const readyPlatforms = PLATFORM_IDS.filter((id) => adaptResults[id]).length;
  const onboardingStep = !profileSaved ? 1 : readyPlatforms === 0 ? 2 : !portfolioPublished ? 3 : 4;

  return (
    <div className="space-y-6">

      {/* Onboarding banner */}
      {!onboardingDismissed && onboardingStep < 4 && (
        <div className="relative rounded-2xl border border-[#00F0FF]/20 dark:border-[#00F0FF]/15 bg-[#00F0FF]/5 overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-transparent via-[#00F0FF] to-violet-500" />
          <div className="p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-sm font-bold text-[#00F0FF] flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  {t("welcome")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("welcomeSub")}</p>
              </div>
              <button
                onClick={() => setOnboardingDismissed(true)}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
                title={t("close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { step: 1, label: t("step1Label"), desc: t("step1Desc"), href: "/dashboard/profile" },
                { step: 2, label: t("step2Label"), desc: t("step2Desc"), href: "/dashboard/platforms" },
                { step: 3, label: t("step3Label"), desc: t("step3Desc"), href: "/dashboard/portfolio" },
              ].map(({ step, label, desc, href }) => {
                const done = onboardingStep > step;
                const active = onboardingStep === step;
                return (
                  <Link
                    key={step}
                    href={href}
                    className={`text-left rounded-xl p-3 border transition-all cursor-pointer ${
                      done
                        ? "border-green-200 bg-green-50 dark:border-green-800/40 dark:bg-green-950/20"
                        : active
                        ? "border-[#00F0FF]/30 bg-white dark:border-[#00F0FF]/20 dark:bg-[#00F0FF]/5 shadow-sm"
                        : "border-border opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-extrabold ${
                        done ? "bg-green-500 text-white" : active ? "bg-[#00F0FF] text-[#090A0F]" : "bg-muted text-muted-foreground"
                      }`}>
                        {done ? <Check className="h-3 w-3" /> : step}
                      </div>
                      <span className={`text-xs font-semibold ${done ? "text-green-700 dark:text-green-400" : active ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground/70 leading-snug pl-7">{desc}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Section title */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#00F0FF]/80">{t("eyebrow")}</p>
        <h2 className="text-2xl font-bold tracking-tight mt-1">{t("title")}</h2>
        <p className="text-sm text-muted-foreground mt-0.5 capitalize">
          {new Date().toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Wallet} tint={TINT_VIOLET} label={t("credits")} value={credits}>
          <button onClick={triggerComingSoon} className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 font-medium transition-colors cursor-pointer">
            <ShoppingCart className="h-3 w-3" />{t("buyCredits")}
          </button>
        </StatCard>

        <StatCard icon={Zap} tint={TINT_CYAN} label={t("aiSpend")} value={formatUsd(spend)}
          sub={t("transactions", { count: totalCount })} />

        <StatCard icon={Layers} tint={TINT_CYAN} label={t("platform")}
          value={<>{readyPlatforms}<span className="text-base font-normal text-muted-foreground">/{PLATFORM_IDS.length}</span></>}
          sub={t("platformsAdapted")} />

        <StatCard icon={Briefcase} tint={TINT_VIOLET} label={t("jobs")} value={jobs.length}
          sub={t("jobsTracked")} />
      </div>

      {/* Platform status + Recent jobs */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Card className={`shadow-sm ${ELEVATED}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{t("platformAdaptation")}</CardTitle>
              <Link href="/dashboard/platforms" className="text-xs text-[#00F0FF] hover:underline transition-colors cursor-pointer">
                {t("viewAll")}
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {PLATFORM_IDS.map((id) => {
              const adapted = !!adaptResults[id];
              const pStyle = PLATFORM_STYLES[id];
              return (
                <div key={id} className="flex items-center gap-3">
                  <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${pStyle.icon}`}>
                    <PlatformLogo platform={id} size={14} />
                  </div>
                  <span className="text-sm font-medium flex-1">{PLATFORMS[id].label}</span>
                  {adapted ? (
                    <span className="flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" />{t("ready")}
                    </span>
                  ) : (
                    <Button size="sm" onClick={() => adapt(id)} disabled={adapting === id || !profileSaved} className="h-6 text-[11px] gap-1 px-2.5">
                      <Sparkles className="h-3 w-3" />
                      {adapting === id ? "..." : t("adapt")}
                    </Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className={`shadow-sm ${ELEVATED}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{t("recentJobs")}</CardTitle>
              <Link href="/dashboard/jobs" className="text-xs text-[#00F0FF] hover:underline transition-colors cursor-pointer">
                {jobs.length > 0 ? t("viewAll") : t("addJob")}
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2 text-center">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-muted-foreground/40" />
                </div>
                <p className="text-xs text-muted-foreground">{t("noJobs")}</p>
                <p className="text-[11px] text-muted-foreground/60 max-w-[180px]">{t("noJobsHint")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.slice(0, 4).map((job) => (
                  <div key={job.id} className="flex items-start gap-2.5">
                    <div className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_DOT[job.status]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{job.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {[job.company, ts(`status.${job.status}`)].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    {job.match_score !== null && (
                      <span className={`text-[10px] font-bold rounded-md px-1.5 py-0.5 tabular-nums shrink-0 ${scoreColor(job.match_score)}`}>
                        {job.match_score}
                      </span>
                    )}
                  </div>
                ))}
                {jobs.length > 4 && (
                  <Link href="/dashboard/jobs" className="block text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    {t("moreJobs", { count: jobs.length - 4 })}
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Profile incomplete alert */}
      {!profileSaved && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-center gap-4">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">{t("profileIncomplete")}</p>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/60 mt-0.5">
              {t("profileIncompleteDesc")}
            </p>
          </div>
          <Button size="sm" asChild variant="outline" className="shrink-0 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30">
            <Link href="/dashboard/profile">{t("editProfile")}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
