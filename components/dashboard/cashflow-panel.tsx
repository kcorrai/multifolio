"use client";

// Nakit-akışı projeksiyon paneli (Applied görünümü): aktif pipeline'daki işlerin
// budget metninden ağırlıklı beklenen gelir tahmini. Saf projectCashflow'dan —
// AI/kredi/DB yok. KABA yön göstergesi (karışık para birimi + serbest metin budget).
import { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { TrendingUp } from "lucide-react";
import { projectCashflow } from "@/lib/jobs/cashflow";
import type { JobStatus } from "@/lib/validation/schemas/job";

const STAGE_TONE: Record<string, string> = {
  applied: "bg-blue-500",
  awaiting_reply: "bg-cyan-500",
  interview: "bg-amber-500",
  offer: "bg-emerald-500",
};

export function CashflowPanel({ jobs }: { jobs: { status: JobStatus; budget?: string | null }[] }) {
  const t = useTranslations("jobs");
  const locale = useLocale();
  const proj = useMemo(
    () => projectCashflow(jobs.map((j) => ({ status: j.status, budget: j.budget ?? null }))),
    [jobs],
  );

  // Tutarı okunabilen aktif iş yoksa panel gizli (saatlik-yalnız da dahil değilse).
  if (proj.countedCount === 0 && proj.hourlyCount === 0) return null;

  const fmt = (n: number) => new Intl.NumberFormat(locale).format(n);
  const maxWeighted = Math.max(1, ...proj.byStage.map((s) => s.weighted));

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-emerald-500" />
        <h3 className="text-sm font-bold">{t("cashflow.title")}</h3>
      </div>

      {proj.countedCount > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-950/20 px-3 py-2.5">
              <p className="text-xl font-extrabold tabular-nums leading-none text-emerald-600 dark:text-emerald-400">≈ {fmt(proj.weighted)}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{t("cashflow.weighted")}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
              <p className="text-xl font-extrabold tabular-nums leading-none">{fmt(proj.potential)}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{t("cashflow.potential")}</p>
            </div>
          </div>

          {/* Aşama bazında ağırlıklı katkı */}
          <div className="space-y-1.5">
            {proj.byStage.map((s) => (
              <div key={s.status} className="flex items-center gap-2.5">
                <span className="w-20 shrink-0 text-[11px] font-medium text-muted-foreground text-right">{t(`status.${s.status}`)}</span>
                <div className="flex-1 h-4 rounded-md bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-md ${STAGE_TONE[s.status] ?? "bg-slate-400"} transition-all`}
                    style={{ width: `${Math.max(6, (s.weighted / maxWeighted) * 100)}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-[11px] font-bold tabular-nums text-right">≈ {fmt(Math.round(s.weighted))}</span>
              </div>
            ))}
          </div>
        </>
      ) : null}

      <p className="text-[10px] text-muted-foreground/70 leading-snug">
        {t("cashflow.disclaimer")}
        {proj.hourlyCount > 0 && ` ${t("cashflow.hourlyNote", { count: proj.hourlyCount })}`}
      </p>
    </div>
  );
}
