"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2, AlertCircle, Briefcase, List, LayoutGrid, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobAddModal } from "@/components/job-add-modal";
import { JobDetailPanel } from "@/components/job-detail-panel";
import { KanbanBoard } from "./kanban-board";
import { PipelineStats } from "./pipeline-stats";
import { CashflowPanel } from "./cashflow-panel";
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
  const [activeTags, setActiveTags] = useState<string[]>([]);

  // Tüm işlerdeki benzersiz etiketler (filtre çubuğu). Alfabetik.
  const allTags = Array.from(new Set(jobs.flatMap((j) => j.tags ?? []))).sort((a, b) => a.localeCompare(b));
  // Aktif etiket varsa: en az birini içeren işler (OR). Yoksa hepsi.
  const visibleJobs = activeTags.length === 0
    ? jobs
    : jobs.filter((j) => (j.tags ?? []).some((tag) => activeTags.includes(tag)));

  function toggleTag(tag: string) {
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]));
  }

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

  return (
    <div className="space-y-4">
      {/* Pipeline analitiği (huni + dönüşüm oranları) + nakit-akışı projeksiyonu */}
      {jobs.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <PipelineStats jobs={jobs} />
          <CashflowPanel jobs={jobs} />
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

      {/* Etiket filtresi (etiketli iş varsa) */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Tag className="h-3 w-3" />{t("tagFilter.label")}
          </span>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              aria-pressed={activeTags.includes(tag)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                activeTags.includes(tag)
                  ? "bg-[#00F0FF]/15 text-foreground ring-1 ring-[#00F0FF]/40"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {tag}
            </button>
          ))}
          {activeTags.length > 0 && (
            <button onClick={() => setActiveTags([])} className="text-xs text-muted-foreground/60 hover:text-foreground underline underline-offset-2">
              {t("tagFilter.clear")}
            </button>
          )}
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Briefcase className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground">{t("noJobs")}</p>
          <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
            {t("emptyHint")}
          </p>
          <Button onClick={() => setJobAddModalOpen(true)} className="gap-2 mt-4">
            <Plus className="h-4 w-4" />{t("addJob")}
          </Button>
        </div>
      ) : mode === "board" ? (
        <div className="space-y-4">
          <KanbanBoard jobs={visibleJobs} onChangeStatus={changeStatus} onSelect={setSelectedJobId} selectedId={selectedJobId} />
          {/* Panoda kart seçilince detay paneli panonun altında açılır */}
          {selectedJob && (
            <div className="rounded-2xl border border-border overflow-hidden min-h-[400px]">
              <JobDetailPanel
                job={selectedJob}
                onClose={() => setSelectedJobId(null)}
                onJobUpdated={(updated) => setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)))}
                onCreditsUpdate={(c) => applyCredits(c)}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-3">
          {/* Sol: iş listesi */}
          <div className={`space-y-1.5 ${selectedJob ? "lg:col-span-2" : "lg:col-span-5"}`}>
            {visibleJobs.map((job) => (
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
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {[job.company, job.platform].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">{t(`status.${job.status}`)}</p>
                    {(job.tags?.length ?? 0) > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {job.tags!.map((tag) => (
                          <span key={tag} className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {job.match_score !== null && (
                      <span className={`text-[11px] font-bold rounded-md px-1.5 py-0.5 tabular-nums ${scoreColor(job.match_score)}`}>
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
