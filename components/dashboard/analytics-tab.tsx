"use client";

import { useTranslations } from "next-intl";
import { TrendingUp, BarChart3, Briefcase, Wallet, ShoppingCart, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JOB_STATUSES } from "@/lib/validation/schemas/job";
import {
  StatCard, TINT_CYAN, ELEVATED, KIND_ICONS,
  STATUS_DOT, formatUsd, type AnalyticsData, type JobRow,
} from "./shared";
import { useDashboard } from "./dashboard-context";

export function AnalyticsTab({
  analytics, credits, jobs,
}: {
  analytics: AnalyticsData;
  credits: number;
  jobs: JobRow[];
}) {
  const t = useTranslations("analytics");
  const ts = useTranslations("jobs");
  const { triggerComingSoon } = useDashboard();

  return (
    <div className="space-y-4">
      <Card className={`shadow-sm overflow-hidden border-violet-200 dark:border-violet-800/40 ${ELEVATED}`}>
        <div className="h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center shrink-0">
                <Wallet className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">{t("creditBalance")}</p>
                <p className="text-3xl font-extrabold tabular-nums">{credits}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("creditsLeft")}</p>
              </div>
            </div>
            <button
              onClick={triggerComingSoon}
              className="flex items-center gap-2 rounded-xl border border-violet-200 dark:border-violet-800/60 bg-violet-50 dark:bg-violet-950/40 px-4 py-2.5 text-sm font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors cursor-pointer"
            >
              <ShoppingCart className="h-4 w-4" />
              {t("buyCredits")}
              <span className="rounded-full bg-violet-200 dark:bg-violet-800 px-1.5 py-0.5 text-[10px] font-bold text-violet-700 dark:text-violet-300">{t("soon")}</span>
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard icon={TrendingUp} tint={TINT_CYAN} label={t("totalSpend")}
          value={formatUsd(analytics.totalUsd)} sub={t("transactions", { count: analytics.totalCount })} />
        {Object.entries(analytics.byKind).map(([kind, { count, costUsd }]) => (
          <StatCard key={kind} icon={KIND_ICONS[kind] ?? Zap} tint={TINT_CYAN}
            label={t.has(`kind.${kind}`) ? t(`kind.${kind}`) : kind} value={count} sub={formatUsd(costUsd)} />
        ))}
      </div>

      {analytics.dailySeries.length > 0 ? (
        <Card className={`shadow-sm ${ELEVATED}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#00F0FF]" />
              <CardTitle className="text-sm">{t("dailyTitle")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {(() => {
              const max = Math.max(...analytics.dailySeries.map((d) => d.costUsd), 0.000001);
              return (
                <div className="flex items-end gap-1 h-32">
                  {analytics.dailySeries.map(({ date, costUsd }) => (
                    <div key={date} className="group relative flex-1 min-w-0" title={`${date}: ${formatUsd(costUsd)}`}>
                      <div className="w-full rounded-t-sm bg-[#00F0FF]/40 hover:bg-[#00F0FF] transition-colors"
                        style={{ height: `${Math.max((costUsd / max) * 100, 4)}%` }} />
                      <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block text-[10px] bg-foreground text-background rounded px-1.5 py-0.5 whitespace-nowrap z-10">
                        {formatUsd(costUsd)}
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
          <p className="text-sm font-semibold text-muted-foreground">{t("noUsage")}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {t("noUsageHint")}
          </p>
        </div>
      )}

      {/* Başvuru Performansı */}
      {jobs.length > 0 && (() => {
        const byStatus = JOB_STATUSES
          .map((s) => ({ status: s, count: jobs.filter((j) => j.status === s).length }))
          .filter((x) => x.count > 0);
        const maxCount = Math.max(...byStatus.map((x) => x.count), 1);
        return (
          <Card className={`shadow-sm ${ELEVATED}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-[#00F0FF]" />
                <CardTitle className="text-sm">{t("applicationPerformance")}</CardTitle>
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
  );
}
