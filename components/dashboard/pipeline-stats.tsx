"use client";

// Başvuru pipeline analitiği paneli (Applied görünümü): dönüşüm oranları + huni.
// Saf computePipeline'dan (mevcut jobs listesi) — AI/kredi/DB yok. Kullanıcıya
// "başvurularının %X'i yanıt/mülakat/teklife dönüştü" içgörüsü verir.
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { computePipeline, benchmarkBand, type BenchmarkBand } from "@/lib/jobs/pipeline";
import type { JobStatus } from "@/lib/validation/schemas/job";

// Sektör kıyas bandı → değer rengi + kısa etiket. Kullanıcıya oranın "iyi mi
// kötü mü" olduğunu tek bakışta gösterir (yeşil=üstünde, amber=normal, kırmızı=altında).
const BAND_TONE: Record<BenchmarkBand, string> = {
  good: "text-emerald-500 dark:text-emerald-400",
  ok: "text-amber-500 dark:text-amber-400",
  low: "text-red-500 dark:text-red-400",
};
const BAND_LABEL_KEY: Record<BenchmarkBand, string> = {
  good: "pipeline.benchmarkGood",
  ok: "pipeline.benchmarkOk",
  low: "pipeline.benchmarkLow",
};

export function PipelineStats({ jobs }: { jobs: { status: JobStatus; referred?: boolean | null }[] }) {
  const t = useTranslations("jobs");
  const p = useMemo(() => computePipeline(jobs), [jobs]);
  const referredCount = useMemo(() => jobs.filter((j) => j.referred).length, [jobs]);

  if (p.sent === 0) return null; // henüz başvuru yoksa gösterme

  const responseBand = benchmarkBand(p.responseRate, "response");
  const interviewBand = benchmarkBand(p.interviewRate, "interview");

  const tiles = [
    { label: t("pipeline.applications"), value: String(p.sent), tone: "text-foreground", band: null as BenchmarkBand | null },
    { label: t("pipeline.responseRate"), value: `${p.responseRate}%`, tone: BAND_TONE[responseBand], band: responseBand },
    { label: t("pipeline.interviewRate"), value: `${p.interviewRate}%`, tone: BAND_TONE[interviewBand], band: interviewBand },
    { label: t("pipeline.offers"), value: String(p.offers), tone: "text-emerald-500 dark:text-emerald-400", band: null as BenchmarkBand | null },
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
            <p className="text-xs text-muted-foreground mt-1 leading-tight">{tile.label}</p>
            {tile.band && (
              <p className={`text-[11px] font-semibold mt-0.5 leading-tight ${tile.tone}`}>{t(BAND_LABEL_KEY[tile.band])}</p>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        {funnel.map((f) => (
          <div key={f.label} className="flex items-center gap-2.5">
            <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground text-right">{f.label}</span>
            <div className="flex-1 h-4 rounded-md bg-muted overflow-hidden">
              <div
                className={`h-full rounded-md ${f.color} transition-all`}
                style={{ width: `${p.sent > 0 ? Math.max(f.value > 0 ? 6 : 0, (f.value / p.sent) * 100) : 0}%` }}
              />
            </div>
            <span className="w-7 shrink-0 text-xs font-bold tabular-nums text-right">{f.value}</span>
          </div>
        ))}
      </div>

      {/* Referans içgörüsü: referanslılar ~2x daha iyi dönüşür (Ashby). */}
      {referredCount > 0 && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          {t("pipeline.referralNote", { count: referredCount })}
        </p>
      )}
    </div>
  );
}
