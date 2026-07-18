"use client";

// İstihdam-türü (job_type) UI parçaları — filtre çipleri + tek rozet. Ortak:
// search-view (anlık filtre), feed-modal + feed-settings-panel (kayıtlı feed),
// pool-job-row (liste rozeti). i18n: feed.jobType.<key>, feed.jobTypeLabel.
import { useTranslations } from "next-intl";
import { JOB_TYPES } from "@/lib/scrape/job-type";

// Freelance/kontrat = kullanıcının aradığı tür → vurgulu; maaşlı roller nötr.
const ACCENT = new Set(["contract", "freelance"]);

/** Çoklu-seç istihdam-türü çipleri (aria-pressed toggle; TIME_KEYS deseni). */
export function JobTypeSelect({
  values,
  onChange,
}: {
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const t = useTranslations("feed");
  function toggle(jt: string) {
    onChange(values.includes(jt) ? values.filter((v) => v !== jt) : [...values, jt]);
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {JOB_TYPES.map((jt) => {
        const on = values.includes(jt);
        return (
          <button
            key={jt}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(jt)}
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
              on
                ? "border-[#00F0FF]/50 bg-[#00F0FF]/15 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(`jobType.${jt}`)}
          </button>
        );
      })}
    </div>
  );
}

/** Liste satırında tek istihdam-türü rozeti; tanınmayan/boş türde hiçbir şey göstermez. */
export function JobTypeBadge({ jobType }: { jobType: string | null }) {
  const t = useTranslations("feed");
  if (!jobType || !(JOB_TYPES as readonly string[]).includes(jobType)) return null;
  const accent = ACCENT.has(jobType);
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
        accent
          ? "bg-[#00F0FF]/12 text-[#00A9B5] dark:text-[#00F0FF]"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {t(`jobType.${jobType}`)}
    </span>
  );
}
