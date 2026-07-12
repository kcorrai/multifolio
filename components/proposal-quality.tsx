"use client";

// Teklif kalite rozeti: SAF assessProposal sonucunu gösterir (skor band + kelime sayısı
// + iyileştirme ipuçları). Kredisiz/anlık; teklif üretilince altında belirir. Rakiplerde
// olmayan farklılaştırıcı — kullanıcı GÖNDERMEDEN zayıf teklifi düzeltir.
import { useTranslations } from "next-intl";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { assessProposal, type QualityBand } from "@/lib/proposal/quality";
import type { ProposalLength } from "@/lib/proposal/style";

const BAND_STYLE: Record<QualityBand, string> = {
  excellent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  good: "bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/25",
  fair: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
  weak: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25",
};

export function ProposalQualityBadge({ text, length = "standard" }: { text: string; length?: ProposalLength }) {
  const t = useTranslations("proposal.quality");
  const q = assessProposal(text, length);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground">{t("label")}</span>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold tabular-nums ${BAND_STYLE[q.band]}`}>
          {q.score} · {t(`band.${q.band}`)}
        </span>
        <span className="text-[11px] text-muted-foreground/70">{t("wordCount", { count: q.wordCount })}</span>
      </div>
      {q.issues.length === 0 ? (
        <p className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />{t("allGood")}
        </p>
      ) : (
        <ul className="space-y-1">
          {q.issues.map((iss) => (
            <li key={iss} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-px text-amber-500" />{t(`issue.${iss}`)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
