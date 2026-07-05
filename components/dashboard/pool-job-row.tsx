"use client";

import { useLocale, useTranslations } from "next-intl";
import { Star } from "lucide-react";
import type { PoolJob } from "@/lib/validation/schemas/feed";
import { poolJobTitle } from "@/lib/feed/filter";
import type { PlatformId } from "@/lib/ai/platforms";
import { PlatformLogo } from "@/components/platform-logo";
import { JobScamBadge } from "./job-risk";
import { RELEVANCE_WARN_BELOW } from "@/lib/feed/relevance";
import { scoreColor, formatRelativeTime, PLATFORM_STYLES } from "./shared";

const UNIT_KEY = { minute: "min", hour: "hour", day: "day" } as const;

// job_pool.source herhangi bir platform olabilir; bilinen 5 platformdan biriyse
// renkli rozet + logo, değilse (ör. "sample") nötr rozet gösterilir.
function PlatformBadge({ source }: { source: string }) {
  const known = source in PLATFORM_STYLES ? (source as PlatformId) : null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold capitalize ${
        known ? PLATFORM_STYLES[known].badge : "bg-muted text-muted-foreground"
      }`}
    >
      {known && <PlatformLogo platform={known} size={11} />}
      {source}
    </span>
  );
}

export function PoolJobRow({
  job, onStar, onOpen, selected = false,
}: {
  job: PoolJob;
  onStar: (job: PoolJob) => void;
  onOpen: (job: PoolJob) => void;
  selected?: boolean;
}) {
  const t = useTranslations("feed");
  const locale = useLocale();
  const rel = formatRelativeTime(job.posted_at);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(job)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(job); } }}
      className={`w-full text-left rounded-xl border px-3.5 py-3 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]/40 ${
        selected ? "border-[#00F0FF]/40 bg-[#00F0FF]/5" : "border-border hover:border-border/80 hover:bg-muted/40"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {job.source && <PlatformBadge source={job.source} />}
            <JobScamBadge text={`${job.title} ${job.description}`} />
            <h3 className="text-sm font-semibold leading-snug truncate">{poolJobTitle(job, locale)}</h3>
          </div>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
            {job.budget && <span>{job.budget}</span>}
            {job.budget && rel && <span>·</span>}
            {rel && <span>{t(`${UNIT_KEY[rel.unit]}Short` as string, { count: rel.value })}</span>}
          </div>
          {job.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {job.skills.slice(0, 4).map((s) => (
                <span key={s} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{s}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onStar(job); }}
            className="text-muted-foreground/40 hover:text-amber-400 transition-colors cursor-pointer"
            title={job.isStarred ? t("unstar") : t("star")}
            aria-label={job.isStarred ? t("unstar") : t("star")}
          >
            <Star className={`h-4 w-4 ${job.isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
          </button>
          {job.score !== null ? (
            <span className={`text-[10px] font-bold rounded-md px-1.5 py-0.5 tabular-nums ${scoreColor(job.score)}`}>{job.score}</span>
          ) : job.relevance !== null ? (
            // AI skoru yokken ücretsiz profil-alaka rozeti: kullanıcı panel açıp
            // kredi harcamadan listede eleyebilsin. "~" = yaklaşık/ücretsiz sinyal.
            <span
              title={t("relevanceLabel")}
              className={`text-[10px] font-semibold rounded-md px-1.5 py-0.5 tabular-nums ${
                job.relevance < RELEVANCE_WARN_BELOW
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              ~{job.relevance}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
