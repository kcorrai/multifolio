"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PoolJob } from "@/lib/validation/schemas/feed";
import type { JobMatchResult } from "@/lib/validation/schemas/job";
import { PoolJobRow } from "./pool-job-row";
import { PoolJobPanel } from "./pool-job-panel";
import { useDashboard } from "./dashboard-context";

export function FeedView({
  initialJobs, hasFeeds, onCreateFeed,
}: {
  initialJobs: PoolJob[];
  hasFeeds: boolean;
  onCreateFeed: () => void;
}) {
  const t = useTranslations("feed");
  const { applyCredits } = useDashboard();
  const [jobs, setJobs] = useState<PoolJob[]>(initialJobs);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4"><Briefcase className="h-7 w-7 text-muted-foreground/40" /></div>
        <p className="text-sm font-semibold text-muted-foreground">{hasFeeds ? t("feedEmptyTitle") : t("noFeedsTitle")}</p>
        <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">{hasFeeds ? t("feedEmptyHint") : t("noFeedsHint")}</p>
        <Button variant="outline" onClick={onCreateFeed} className="gap-2 mt-4"><Plus className="h-4 w-4" />{t("createFeed")}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onCreateFeed} className="gap-2"><Plus className="h-4 w-4" />{t("createFeed")}</Button>
      </div>
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
    </div>
  );
}
