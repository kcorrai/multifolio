"use client";

// Şeffaf skor rubriği: karar rozeti + 4 boyutun ağırlıklı bar dökümü + risk uyarıları.
// PoolJobPanel (feed slide-over) ve JobDetailPanel (iş takibi) paylaşır.
import { useTranslations } from "next-intl";
import { ThumbsUp, Scale, ThumbsDown, AlertTriangle } from "lucide-react";
import type { JobMatchRubric, MatchVerdict, RubricKey } from "@/lib/validation/schemas/job";
import { RUBRIC_KEYS } from "@/lib/validation/schemas/job";
import { RUBRIC_WEIGHTS } from "@/lib/ai/rubric";
import { scoreBarColor } from "./shared";

const VERDICT_CLASSES: Record<MatchVerdict, string> = {
  go:    "bg-green-50 text-green-700 ring-1 ring-green-200 dark:bg-green-950 dark:text-green-300 dark:ring-green-800",
  maybe: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
  skip:  "bg-red-50 text-red-600 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-400 dark:ring-red-900",
};

const VERDICT_ICONS: Record<MatchVerdict, typeof ThumbsUp> = {
  go: ThumbsUp,
  maybe: Scale,
  skip: ThumbsDown,
};

export function VerdictBadge({ verdict }: { verdict: MatchVerdict }) {
  const t = useTranslations("rubric");
  const Icon = VERDICT_ICONS[verdict];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-bold ${VERDICT_CLASSES[verdict]}`}>
      <Icon className="h-3.5 w-3.5" />
      {t(`verdict.${verdict}`)}
    </span>
  );
}

/** Sahte/riskli ilan sinyalleri — skoru etkilemez, yalnız uyarı çipleri. Boşsa render etmez. */
export function RiskBadges({ risks }: { risks: string[] }) {
  const t = useTranslations("rubric");
  if (risks.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
        <AlertTriangle className="h-3.5 w-3.5" />{t("risksTitle")}
      </p>
      <ul className="space-y-1">
        {risks.map((risk, i) => (
          <li key={i} className="rounded-md bg-amber-50 px-2 py-1 text-[11px] leading-snug text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800">
            {risk}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MatchRubric({ rubric }: { rubric: JobMatchRubric }) {
  const t = useTranslations("rubric");
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold text-muted-foreground">{t("breakdown")}</p>
      {RUBRIC_KEYS.map((key: RubricKey) => {
        const dim = rubric[key];
        return (
          <div key={key} className="space-y-0.5">
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="font-medium">
                {t(`dimensions.${key}`)}{" "}
                <span className="text-muted-foreground/60">{t("weight", { percent: Math.round(RUBRIC_WEIGHTS[key] * 100) })}</span>
              </span>
              <span className="font-bold tabular-nums">{dim.score}</span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full ${scoreBarColor(dim.score)}`} style={{ width: `${dim.score}%` }} />
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug">{dim.reason}</p>
          </div>
        );
      })}
    </div>
  );
}
