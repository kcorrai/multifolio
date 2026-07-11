"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2, AlertCircle, Briefcase, List, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobAddModal } from "@/components/job-add-modal";
import { JobDetailPanel } from "@/components/job-detail-panel";
import { KanbanBoard } from "./kanban-board";
import { STATUS_DOT, scoreColor, scoreBarColor, type JobRow } from "./shared";
import { useDashboard } from "./dashboard-context";
import type { JobStatus } from "@/lib/validation/schemas/job";

export function AppliedView({
  initialJobs, profileSaved,
}: {
  initialJobs: JobRow[];
  profileSaved: boolean;
}) {
  const t = useTranslations("jobs");
  const { applyCredits, setJobsCount } = useDashboard();
  const [jobs, setJobs] = useState<JobRow[]>(initialJobs);
  const [jobAddModalOpen, setJobAddModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [jobError, setJobError] = useState("");
  const [mode, setMode] = useState<"list" | "board">("list");

  // Sidebar rozetini iş listesiyle senkron tut.
  useEffect(() => { setJobsCount(jobs.length); }, [jobs.length, setJobsCount]);

  // Pano sürükle-bırak / select ile durum değişimi: optimistic + PATCH; hata geri alır.
  async function changeStatus(id: string, status: JobStatus) {
    const prev = jobs.find((j) => j.id === id);
    if (!prev || prev.status === status) return;
    setJobError("");
    setJobs((list) => list.map((j) => (j.id === id ? { ...j, status } : j)));
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setJobError(body?.error?.message ?? t("statusError"));
      setJobs((list) => list.map((j) => (j.id === id ? { ...j, status: prev.status } : j)));
    }
  }

  function handleJobAdded(job: JobRow) {
    setJobs((prev) => {
      const exists = prev.some((j) => j.id === job.id);
      if (exists) return prev.map((j) => (j.id === job.id ? job : j));
      return [job, ...prev];
    });
  }

  async function deleteJob(id: string) {
    setDeletingId(id); setJobError("");
    const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setJobError(body?.error?.message ?? t("deleteError")); setDeletingId(null); return;
    }
    setJobs((prev) => prev.filter((j) => j.id !== id)); setDeletingId(null);
  }

  const selectedJob = selectedJobId ? jobs.find((j) => j.id === selectedJobId) ?? null : null;
  const awaitingCount = jobs.filter((j) => j.status === "awaiting_reply").length;
  const appliedCount = jobs.filter((j) => j.status === "applied").length;
  const activeCount = jobs.filter((j) => j.status !== "rejected" && j.status !== "offer").length;

  return (
    <div className="space-y-4">
      {/* Stat bar */}
      {jobs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            {t("statApplied")} · {appliedCount}
          </div>
          {awaitingCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/40 px-3 py-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              {t("statAwaiting")} · {awaitingCount}
            </div>
          )}
          <div className="flex items-center gap-1.5 rounded-full bg-muted border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
            {t("statActive")} · {activeCount}
          </div>
        </div>
      )}

      {/* Add + görünüm toggle + error */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setJobAddModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />{t("addJob")}
          </Button>
          {jobs.length > 0 && (
            <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
              {([
                { m: "list" as const, Icon: List, label: t("board.list") },
                { m: "board" as const, Icon: LayoutGrid, label: t("board.board") },
              ]).map(({ m, Icon, label }) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                  title={label}
                  aria-label={label}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />{label}
                </button>
              ))}
            </div>
          )}
        </div>
        {jobError && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />{jobError}
          </div>
        )}
      </div>

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Briefcase className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground">{t("noJobs")}</p>
          <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
            {t("emptyHint")}
          </p>
        </div>
      ) : mode === "board" ? (
        <KanbanBoard jobs={jobs} onChangeStatus={changeStatus} onSelect={setSelectedJobId} />
      ) : (
        <div className="grid lg:grid-cols-5 gap-3">
          {/* Sol: iş listesi */}
          <div className={`space-y-1.5 ${selectedJob ? "lg:col-span-2" : "lg:col-span-5"}`}>
            {jobs.map((job) => (
              <div
                key={job.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedJobId(job.id === selectedJobId ? null : job.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedJobId(job.id === selectedJobId ? null : job.id);
                  }
                }}
                className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]/40 ${
                  job.id === selectedJobId
                    ? "border-[#00F0FF]/40 bg-[#00F0FF]/5"
                    : "border-border hover:border-border/80 hover:bg-muted/40"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_DOT[job.status]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold leading-snug truncate">{job.title}</p>
                    {(job.company || job.platform) && (
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {[job.company, job.platform].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">{t(`status.${job.status}`)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {job.match_score !== null && (
                      <span className={`text-[10px] font-bold rounded-md px-1.5 py-0.5 tabular-nums ${scoreColor(job.match_score)}`}>
                        {job.match_score}
                      </span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteJob(job.id); }}
                      disabled={deletingId === job.id}
                      className="text-muted-foreground/30 hover:text-destructive transition-colors cursor-pointer"
                      title={t("delete")}
                      aria-label={t("delete")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {job.match_score !== null && (
                  <div className="mt-2 ml-4 h-1 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${scoreBarColor(job.match_score)}`} style={{ width: `${job.match_score}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Sağ: iş detay paneli */}
          {selectedJob && (
            <div className="lg:col-span-3 rounded-2xl border border-border overflow-hidden min-h-[400px]">
              <JobDetailPanel
                job={selectedJob}
                onClose={() => setSelectedJobId(null)}
                onJobUpdated={(updated) => setJobs((prev) => prev.map((j) => j.id === updated.id ? updated : j))}
                onCreditsUpdate={(c) => applyCredits(c)}
              />
            </div>
          )}
        </div>
      )}

      {jobAddModalOpen && (
        <JobAddModal
          hasProfile={profileSaved}
          onClose={() => setJobAddModalOpen(false)}
          onJobAdded={handleJobAdded}
          onCreditsUpdate={(c) => applyCredits(c)}
        />
      )}
    </div>
  );
}
