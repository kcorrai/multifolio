"use client";

// Başvuru pipeline analitiği paneli (Applied görünümü): dönüşüm oranları + huni.
// Saf computePipeline'dan (mevcut jobs listesi) — AI/kredi/DB yok. Kullanıcıya
// "başvurularının %X'i yanıt/mülakat/teklife dönüştü" içgörüsü verir.
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { computePipeline } from "@/lib/jobs/pipeline";
import type { JobStatus } from "@/lib/validation/schemas/job";

export function PipelineStats({ jobs }: { jobs: { status: JobStatus }[] }) {
  const t = useTranslations("jobs");
  const p = useMemo(() => computePipeline(jobs), [jobs]);

  if (p.sent === 0) return null; // henüz başvuru yoksa gösterme

  const tiles = [
    { label: t("pipeline.applications"), value: String(p.sent), tone: "text-foreground" },
    { label: t("pipeline.responseRate"), value: `${p.responseRate}%`, tone: "text-[#00F0FF]" },
    { label: t("pipeline.interviewRate"), value: `${p.interviewRate}%`, tone: "text-amber-500 dark:text-amber-400" },
    { label: t("pipeline.offers"), value: String(p.offers), tone: "text-emerald-500 dark:text-emerald-400" },
  ];

  // Huni: gönderilen tam genişlik, sonrakiler orana göre daralır.
  const funnel = [
    { label: t("pipeline.fSent"), value: p.sent, color: "bg-slate-400 dark:bg-slate-500" },
    { label: t("pipeline.fResponded"), value: p.responded, color: "bg-[#00F0FF]" },
    { label: t("pipeline.fInterview"), value: p.interviewing, color: "bg-amber-500" },
    { label: t("pipeline.fOffer"), value: p.offers, color: "bg-emerald-500" },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
            <p className={`text-xl font-extrabold tabular-nums leading-none ${tile.tone}`}>{tile.value}</p>
            <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{tile.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        {funnel.map((f) => (
          <div key={f.label} className="flex items-center gap-2.5">
            <span className="w-16 shrink-0 text-[11px] font-medium text-muted-foreground text-right">{f.label}</span>
            <div className="flex-1 h-4 rounded-md bg-muted overflow-hidden">
              <div
                className={`h-full rounded-md ${f.color} transition-all`}
                style={{ width: `${p.sent > 0 ? Math.max(f.value > 0 ? 6 : 0, (f.value / p.sent) * 100) : 0}%` }}
              />
            </div>
            <span className="w-7 shrink-0 text-[11px] font-bold tabular-nums text-right">{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
