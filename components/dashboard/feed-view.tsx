"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Briefcase, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PoolJob, JobFeedRow } from "@/lib/validation/schemas/feed";
import type { JobMatchResult } from "@/lib/validation/schemas/job";
import { PoolJobRow } from "./pool-job-row";
import { PoolJobPanel } from "./pool-job-panel";
import { FeedModal } from "./feed-modal";
import { useDashboard } from "./dashboard-context";

export function FeedView({
  initialJobs, initialFeeds,
}: {
  initialJobs: PoolJob[];
  initialFeeds: JobFeedRow[];
}) {
  const t = useTranslations("feed");
  const { applyCredits } = useDashboard();
  const [jobs, setJobs] = useState<PoolJob[]>(initialJobs);
  const [feeds, setFeeds] = useState<JobFeedRow[]>(initialFeeds);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Feed'ler değişince (oluştur/sil) hem feed listesini hem eşleşen işleri tazele.
  async function refresh() {
    const [feedsRes, feedJobsRes] = await Promise.all([fetch("/api/feeds"), fetch("/api/feed")]);
    const f = await feedsRes.json().catch(() => ({ feeds: [] }));
    const j = await feedJobsRes.json().catch(() => ({ jobs: [] }));
    setFeeds(f.feeds ?? []);
    setJobs(j.jobs ?? []);
    setSelectedId(null);
  }

  async function deleteFeed(id: string) {
    setFeeds((prev) => prev.filter((f) => f.id !== id));
    await fetch(`/api/feeds/${id}`, { method: "DELETE" });
    await refresh();
  }

  async function toggleStar(job: PoolJob) {
    const next = !job.isStarred;
    setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, isStarred: next } : j));
    await fetch(`/api/starred${next ? "" : `?jobPoolId=${job.id}`}`, {
      method: next ? "POST" : "DELETE",
      headers: next ? { "Content-Type": "application/json" } : undefined,
      body: next ? JSON.stringify({ jobPoolId: job.id }) : undefined,
    });
  }

  function onScored(poolId: string, score: number, result: JobMatchResult) {
    setJobs((prev) => prev.map((j) => j.id === poolId ? { ...j, score, scoreResult: result } : j));
  }

  const selected = selectedId ? jobs.find((j) => j.id === selectedId) ?? null : null;
  const hasFeeds = feeds.length > 0;

  return (
    <div className="space-y-3">
      {/* Kayıtlı feed'ler (etiket mantığı) + oluştur */}
      <div className="flex flex-wrap items-center gap-2">
        {hasFeeds && <span className="text-xs font-semibold text-muted-foreground mr-1">{t("savedFeeds")}</span>}
        {feeds.map((f) => (
          <span key={f.id} className="inline-flex items-center gap-1.5 rounded-full border border-[#00F0FF]/30 bg-[#00F0FF]/5 px-2.5 py-1 text-xs font-medium">
            {f.name}
            <button onClick={() => deleteFeed(f.id)} className="text-muted-foreground/60 hover:text-destructive" title={t("modal.delete")}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <Button variant="outline" size="sm" onClick={() => setModalOpen(true)} className="gap-2 ml-auto">
          <Plus className="h-4 w-4" />{t("createFeed")}
        </Button>
      </div>

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4"><Briefcase className="h-7 w-7 text-muted-foreground/40" /></div>
          <p className="text-sm font-semibold text-muted-foreground">{hasFeeds ? t("feedEmptyTitle") : t("noFeedsTitle")}</p>
          <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">{hasFeeds ? t("feedEmptyHint") : t("noFeedsHint")}</p>
          <Button variant="outline" onClick={() => setModalOpen(true)} className="gap-2 mt-4"><Plus className="h-4 w-4" />{t("createFeed")}</Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-3">
          <div className={`space-y-1.5 ${selected ? "lg:col-span-2" : "lg:col-span-5"}`}>
            {jobs.map((job) => (
              <PoolJobRow key={job.id} job={job} selected={job.id === selectedId} onStar={toggleStar} onOpen={(j) => setSelectedId(j.id === selectedId ? null : j.id)} />
            ))}
          </div>
          {selected && (
            <div className="lg:col-span-3 rounded-2xl border border-border overflow-hidden min-h-[400px]">
              <PoolJobPanel
                job={selected}
                onClose={() => setSelectedId(null)}
                onScored={onScored}
                onApplied={() => {}}
                onCreditsUpdate={(c) => applyCredits(c)}
              />
            </div>
          )}
        </div>
      )}

      {modalOpen && <FeedModal onClose={() => setModalOpen(false)} onSaved={refresh} />}
    </div>
  );
}
