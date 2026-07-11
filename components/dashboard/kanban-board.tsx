"use client";

// Başvuru pano (kanban) görünümü: işleri JobStatus'a göre sütunlara dizer.
// Sürükle-bırak ile durum değişir (fare); klavye/erişilebilirlik için her kartta
// durum <select>'i vardır. Durum değişimi üst bileşenin onChangeStatus'una
// (optimistic + PATCH /api/jobs/[id]) devredilir. Yeni state tutmaz.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { JOB_STATUSES, type JobStatus } from "@/lib/validation/schemas/job";
import { STATUS_DOT, scoreColor, type JobRow } from "./shared";

// Boru hattı sırası (soldan sağa ilerleme; rejected sonda).
const COLUMN_ORDER: JobStatus[] = [
  "saved", "applied", "awaiting_reply", "interview", "offer", "rejected",
];

export function KanbanBoard({
  jobs, onChangeStatus, onSelect, selectedId = null,
}: {
  jobs: JobRow[];
  onChangeStatus: (id: string, status: JobStatus) => void;
  onSelect?: (id: string) => void;
  selectedId?: string | null;
}) {
  const t = useTranslations("jobs");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<JobStatus | null>(null);

  function drop(status: JobStatus) {
    if (dragId) {
      const job = jobs.find((j) => j.id === dragId);
      if (job && job.status !== status) onChangeStatus(dragId, status);
    }
    setDragId(null);
    setOverCol(null);
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {COLUMN_ORDER.map((status) => {
        const colJobs = jobs.filter((j) => j.status === status);
        return (
          <div
            key={status}
            onDragOver={(e) => { e.preventDefault(); setOverCol(status); }}
            onDragLeave={() => setOverCol((c) => (c === status ? null : c))}
            onDrop={(e) => { e.preventDefault(); drop(status); }}
            className={`flex-none w-[220px] rounded-2xl border p-2.5 transition-colors ${
              overCol === status
                ? "border-[#00F0FF]/50 bg-[#00F0FF]/5"
                : "border-border bg-muted/30"
            }`}
          >
            {/* Sütun başlığı */}
            <div className="flex items-center gap-2 px-1 pb-2.5">
              <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
              <span className="text-xs font-bold">{t(`status.${status}`)}</span>
              <span className="ml-auto text-[11px] font-semibold text-muted-foreground tabular-nums">
                {colJobs.length}
              </span>
            </div>

            {/* Kartlar */}
            <div className="space-y-2 min-h-[40px]">
              {colJobs.map((job) => (
                <div
                  key={job.id}
                  draggable
                  onDragStart={() => setDragId(job.id)}
                  onDragEnd={() => { setDragId(null); setOverCol(null); }}
                  className={`rounded-xl border bg-card p-2.5 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-sm ${
                    dragId === job.id ? "opacity-50" : ""
                  } ${
                    selectedId === job.id ? "border-[#00F0FF]/50 ring-1 ring-[#00F0FF]/30" : "border-border"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelect?.(job.id)}
                    className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]/40 rounded"
                  >
                    <p className="text-xs font-semibold leading-snug line-clamp-2">{job.title}</p>
                    {(job.company || job.platform) && (
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {[job.company, job.platform].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </button>

                  <div className="flex items-center justify-between gap-2 mt-2">
                    {job.match_score !== null ? (
                      <span className={`text-[10px] font-bold rounded-md px-1.5 py-0.5 tabular-nums ${scoreColor(job.match_score)}`}>
                        {job.match_score}
                      </span>
                    ) : <span />}

                    {/* Klavye/erişilebilir durum değişimi (DnD'nin yedeği) */}
                    <select
                      aria-label={t("board.moveTo")}
                      value={job.status}
                      onChange={(e) => onChangeStatus(job.id, e.target.value as JobStatus)}
                      className="text-[10px] rounded-md border border-border bg-background px-1 py-0.5 text-muted-foreground cursor-pointer max-w-[110px]"
                    >
                      {JOB_STATUSES.map((s) => (
                        <option key={s} value={s}>{t(`status.${s}`)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
