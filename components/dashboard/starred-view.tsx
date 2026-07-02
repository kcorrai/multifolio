"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import type { PoolJob } from "@/lib/validation/schemas/feed";
import type { JobMatchResult } from "@/lib/validation/schemas/job";
import { PoolJobRow } from "./pool-job-row";
import { PoolJobPanel } from "./pool-job-panel";
import { useDashboard } from "./dashboard-context";

export function StarredView() {
  const t = useTranslations("feed");
  const { applyCredits } = useDashboard();
  const [jobs, setJobs] = useState<PoolJob[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/starred").then((r) => r.json()).then((b) => { setJobs(b.jobs ?? []); setLoaded(true); }).catch(() => setLoaded(true));
  }, []);

  async function unstar(job: PoolJob) {
    setJobs((prev) => prev.filter((j) => j.id !== job.id));
    if (selectedId === job.id) setSelectedId(null);
    await fetch(`/api/starred?jobPoolId=${job.id}`, { method: "DELETE" });
  }

  function onScored(poolId: string, score: number, result: JobMatchResult) {
    setJobs((prev) => prev.map((j) => j.id === poolId ? { ...j, score, scoreResult: result } : j));
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
    <div className="grid lg:grid-cols-5 gap-3">
      <div className={`space-y-1.5 ${selected ? "lg:col-span-2" : "lg:col-span-5"}`}>
        {jobs.map((job) => (
          <PoolJobRow key={job.id} job={job} selected={job.id === selectedId} onStar={unstar} onOpen={(j) => setSelectedId(j.id === selectedId ? null : j.id)} />
        ))}
      </div>
      {selected && (
        <div className="lg:col-span-3 rounded-2xl border border-border overflow-hidden min-h-[400px]">
          <PoolJobPanel job={selected} onClose={() => setSelectedId(null)} onScored={onScored} onApplied={() => {}} onCreditsUpdate={(c) => applyCredits(c)} />
        </div>
      )}
    </div>
  );
}
