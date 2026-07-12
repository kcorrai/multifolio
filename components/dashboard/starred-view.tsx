"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import type { PoolJob } from "@/lib/validation/schemas/feed";
import type { JobMatchResult } from "@/lib/validation/schemas/job";
import { PoolJobRow } from "./pool-job-row";
import { PoolJobPanel } from "./pool-job-panel";
import { JobSlideOver } from "./job-slide-over";
import { useDashboard } from "./dashboard-context";

export function StarredView() {
  const t = useTranslations("feed");
  const { applyCredits } = useDashboard();
  const [jobs, setJobs] = useState<PoolJob[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    fetch("/api/starred").then((r) => r.json()).then((b) => { setJobs(b.jobs ?? []); setLoaded(true); }).catch(() => setLoaded(true));
  }, []);

  async function unstar(job: PoolJob) {
    setActionError("");
    // İyimser kaldır; başarısızsa listeye geri ekle + hata göster.
    setJobs((prev) => prev.filter((j) => j.id !== job.id));
    const wasSelected = selectedId === job.id;
    if (wasSelected) setSelectedId(null);
    const res = await fetch(`/api/starred?jobPoolId=${job.id}`, { method: "DELETE" });
    if (!res.ok) {
      setJobs((prev) => (prev.some((j) => j.id === job.id) ? prev : [...prev, job]));
      setActionError(t("actionFailed"));
    }
  }

  function onScored(poolId: string, score: number, result: JobMatchResult) {
    setJobs((prev) => prev.map((j) => j.id === poolId ? { ...j, score, scoreResult: result } : j));
  }

  // İlanı açınca okundu işaretle (iyimser; okunmamış noktası temizlensin).
  function openJob(job: PoolJob) {
    setSelectedId(job.id);
    if (job.isRead) return;
    setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, isRead: true } : j));
    void fetch("/api/job-reads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobPoolIds: [job.id] }),
    }).catch(() => {});
  }

  const selected = selectedId ? jobs.find((j) => j.id === selectedId) ?? null : null;

  if (loaded && jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4"><Star className="h-7 w-7 text-muted-foreground/40" /></div>
        <p className="text-sm font-semibold text-muted-foreground">{t("starredEmptyTitle")}</p>
        <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">{t("starredEmptyHint")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {actionError && (
        <div
          role="alert"
          className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 shadow-lg backdrop-blur cursor-pointer"
          onClick={() => setActionError("")}
        >
          {actionError}
        </div>
      )}
      {jobs.map((job) => (
        <PoolJobRow key={job.id} job={job} selected={job.id === selectedId} onStar={unstar} onOpen={openJob} />
      ))}
      {selected && (
        <JobSlideOver onClose={() => setSelectedId(null)}>
          <PoolJobPanel job={selected} onClose={() => setSelectedId(null)} onScored={onScored} onApplied={() => {}} onCreditsUpdate={(c) => applyCredits(c)} />
        </JobSlideOver>
      )}
    </div>
  );
}
