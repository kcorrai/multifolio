"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles, X, Check, AlertCircle, BarChart3,
  Wallet, Zap, Briefcase, ShoppingCart, ArrowRight,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLATFORM_IDS } from "@/lib/ai/platforms";
import { JOB_STATUSES } from "@/lib/validation/schemas/job";
import {
  StatCard, TINT_CYAN, TINT_VIOLET, ELEVATED, KIND_ICONS,
  STATUS_DOT, scoreColor, type AnalyticsData, type JobRow,
} from "./shared";
import { useDashboard } from "./dashboard-context";
import { ProfileStrengthCard } from "./profile-strength-card";
import { ReferralCard } from "./referral-card";
import { WeeklyDigestToggle } from "./weekly-digest-toggle";
import type { ProfileStrengthResult } from "@/lib/profile-strength";

export function OverviewTab({
  profileSaved, jobs, analytics, strength,
}: {
  profileSaved: boolean;
  jobs: JobRow[];
  analytics: AnalyticsData;
  strength: ProfileStrengthResult;
}) {
  const t = useTranslations("dashboard.overview");
  const ta = useTranslations("analytics");
  const ts = useTranslations("jobs");
  const locale = useLocale();
  const { credits, creditsUsed, adaptResults, triggerComingSoon } = useDashboard();
  const [onboardingDismissed, setOnboardingDismissed] = useState(profileSaved);

  const readyPlatforms = PLATFORM_IDS.filter((id) => adaptResults[id]).length;
  const onboardingStep = !profileSaved ? 1 : readyPlatforms === 0 ? 2 : 3;

  return (
    <div className="space-y-6">

      {/* Onboarding banner */}
      {!onboardingDismissed && onboardingStep < 3 && (
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
                aria-label={t("close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { step: 1, label: t("step1Label"), desc: t("step1Desc"), href: "/dashboard/import" },
                { step: 2, label: t("step2Label"), desc: t("step2Desc"), href: "/dashboard/platforms" },
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

      {/* Sıradaki adım: kurulmuş ama henüz iş takip etmeyen kullanıcıyı çekirdek
          aksiyona (iş feed'i) yönlendirir. Onboarding banner'ı profilsizde göründüğü
          için burada çakışma yok (bu yalnız profileSaved'da). */}
      {profileSaved && jobs.length === 0 && (
        <Link
          href="/dashboard/jobs"
          className="group flex items-center gap-4 rounded-2xl border border-[#00F0FF]/25 bg-[#00F0FF]/5 p-5 hover:border-[#00F0FF]/40 transition-colors"
        >
          <div className="h-11 w-11 shrink-0 rounded-xl bg-[#00F0FF]/10 flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-[#00F0FF]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">{t("nextStepTitle")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("nextStepBody")}</p>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-[#00F0FF]">
            {t("nextStepCta")}<ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </Link>
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
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard icon={Wallet} tint={TINT_VIOLET} label={t("credits")} value={credits}>
          <button onClick={triggerComingSoon} className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 font-medium transition-colors cursor-pointer">
            <ShoppingCart className="h-3 w-3" />{t("buyCredits")}
          </button>
        </StatCard>

        <StatCard icon={Zap} tint={TINT_CYAN} label={t("creditsUsed")} value={creditsUsed}
          sub={t("transactions", { count: analytics.totalCount })} />

        <StatCard icon={Briefcase} tint={TINT_VIOLET} label={t("jobs")} value={jobs.length}
          sub={t("jobsTracked")} />
      </div>

      {/* Profil gücü + davet: kalıcı kartlar (onboarding banner'ından bağımsız) */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ProfileStrengthCard strength={strength} />
        <ReferralCard />
      </div>

      {/* Tür bazlı kredi kullanımı */}
      {Object.keys(analytics.byKind).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Object.entries(analytics.byKind).map(([kind, { count, credits: kindCredits }]) => (
            <StatCard key={kind} icon={KIND_ICONS[kind] ?? Zap} tint={TINT_CYAN}
              label={ta.has(`kind.${kind}`) ? ta(`kind.${kind}`) : kind} value={count}
              sub={ta("creditsSub", { count: kindCredits })} />
          ))}
        </div>
      )}

      {/* 30 günlük kredi harcaması */}
      {analytics.dailySeries.length > 0 ? (
        <Card className={`shadow-sm ${ELEVATED}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#00F0FF]" />
              <CardTitle className="text-sm">{ta("dailyTitle")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {(() => {
              const max = Math.max(...analytics.dailySeries.map((d) => d.credits), 1);
              return (
                <div className="flex items-end gap-1 h-32">
                  {analytics.dailySeries.map(({ date, credits: dayCredits }) => (
                    <div key={date} className="group relative flex-1 min-w-0" title={`${date}: ${dayCredits}`}>
                      <div className="w-full rounded-t-sm bg-[#00F0FF]/40 hover:bg-[#00F0FF] transition-colors"
                        style={{ height: `${Math.max((dayCredits / max) * 100, 4)}%` }} />
                      <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block text-[10px] bg-foreground text-background rounded px-1.5 py-0.5 whitespace-nowrap z-10">
                        {dayCredits}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
              <span>{analytics.dailySeries[0]?.date?.slice(5)}</span>
              <span>{analytics.dailySeries.at(-1)?.date?.slice(5)}</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <BarChart3 className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground">{ta("noUsage")}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {ta("noUsageHint")}
          </p>
        </div>
      )}

      {/* Recent jobs + Başvuru performansı */}
      <div className="grid lg:grid-cols-2 gap-5">
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

        {jobs.length > 0 && (() => {
          const byStatus = JOB_STATUSES
            .map((s) => ({ status: s, count: jobs.filter((j) => j.status === s).length }))
            .filter((x) => x.count > 0);
          const maxCount = Math.max(...byStatus.map((x) => x.count), 1);
          return (
            <Card className={`shadow-sm ${ELEVATED}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-[#00F0FF]" />
                  <CardTitle className="text-sm">{ta("applicationPerformance")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {byStatus.map(({ status, count }) => (
                  <div key={status} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-28 shrink-0">{ts(`status.${status}`)}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${STATUS_DOT[status]}`}
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold tabular-nums w-4 text-right">{count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })()}
      </div>

      {/* Haftalık özet e-postası tercihi */}
      <WeeklyDigestToggle />

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
